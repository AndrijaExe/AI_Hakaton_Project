<?php

namespace App\Adapter\In\Http\Controller;

use App\Adapter\Out\Persistence\Doctrine\Repository\ConnectionRequestRepository;
use App\Adapter\Out\Persistence\Doctrine\Repository\NotificationRepository;
use App\Adapter\Out\Persistence\Doctrine\Repository\UserRepository;
use App\Model\Connection\Entity\ConnectionRequest;
use App\Model\Notification\Entity\Notification;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/connections')]
class ConnectionController extends AbstractController
{
    public function __construct(
        private ConnectionRequestRepository $connectionRepo,
        private UserRepository $userRepo,
        private NotificationRepository $notificationRepo,
    ) {}

    #[Route('/my', name: 'api_connections_my', methods: ['GET'])]
    public function myConnections(): JsonResponse
    {
        $user = $this->getUser();
        $connections = $this->connectionRepo->findAcceptedForUser($user);

        $data = array_map(fn(ConnectionRequest $cr) => $cr->toArray(), $connections);

        return $this->json(['connections' => $data]);
    }

    #[Route('/pending', name: 'api_connections_pending', methods: ['GET'])]
    public function pending(): JsonResponse
    {
        $user = $this->getUser();
        $pending = $this->connectionRepo->findPendingForUser($user);

        $data = array_map(fn(ConnectionRequest $cr) => $cr->toArray(), $pending);

        return $this->json(['pending' => $data]);
    }

    #[Route('/all', name: 'api_connections_all', methods: ['GET'])]
    public function all(): JsonResponse
    {
        $user = $this->getUser();
        $all = $this->connectionRepo->findByUser($user);

        $data = array_map(fn(ConnectionRequest $cr) => $cr->toArray(), $all);

        return $this->json(['connections' => $data]);
    }

    #[Route('/request', name: 'api_connections_request', methods: ['POST'])]
    public function sendRequest(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $receiverId = $data['receiverId'] ?? null;
        $message = $data['message'] ?? null;

        if (!$receiverId) {
            return $this->json(['error' => 'receiverId is required'], 400);
        }

        $sender = $this->getUser();
        $receiver = $this->userRepo->find($receiverId);

        if (!$receiver) {
            return $this->json(['error' => 'User not found'], 404);
        }

        if ($sender->getId() === $receiver->getId()) {
            return $this->json(['error' => 'Cannot connect with yourself'], 400);
        }

        $existing = $this->connectionRepo->findExistingBetween($sender, $receiver);
        if ($existing) {
            return $this->json(['error' => 'Connection already exists', 'status' => $existing->getStatus()], 409);
        }

        $cr = new ConnectionRequest();
        $cr->setSender($sender);
        $cr->setReceiver($receiver);
        $cr->setMessage($message);
        $this->connectionRepo->save($cr);

        $notification = new Notification();
        $notification->setTitle('Connection request received');
        $content = $sender->getFirstName() . ' ' . $sender->getLastName() . ' wants to connect with you.';
        if (!empty(trim($message ?? ''))) {
            $preview = mb_substr(trim($message), 0, 80);
            if (mb_strlen(trim($message)) > 80) {
                $preview .= '...';
            }
            $content .= ' Message: "' . $preview . '"';
        }
        $notification->setContent($content);
        $notification->setType('info');
        $notification->setPriority('normal');
        $notification->setReceiver($receiver);
        $this->notificationRepo->save($notification);

        return $this->json(['message' => 'Request sent', 'connection' => $cr->toArray()], 201);
    }

    #[Route('/{id}/accept', name: 'api_connections_accept', methods: ['PUT'])]
    public function accept(int $id): JsonResponse
    {
        $cr = $this->connectionRepo->find($id);
        if (!$cr) {
            return $this->json(['error' => 'Connection not found'], 404);
        }

        $user = $this->getUser();
        if ($cr->getReceiver()->getId() !== $user->getId()) {
            return $this->json(['error' => 'Not authorized'], 403);
        }

        $cr->accept();
        $this->connectionRepo->save($cr);

        return $this->json(['message' => 'Accepted', 'connection' => $cr->toArray()]);
    }

    #[Route('/{id}/decline', name: 'api_connections_decline', methods: ['PUT'])]
    public function decline(int $id): JsonResponse
    {
        $cr = $this->connectionRepo->find($id);
        if (!$cr) {
            return $this->json(['error' => 'Connection not found'], 404);
        }

        $user = $this->getUser();
        if ($cr->getReceiver()->getId() !== $user->getId()) {
            return $this->json(['error' => 'Not authorized'], 403);
        }

        $cr->decline();
        $this->connectionRepo->save($cr);

        return $this->json(['message' => 'Declined']);
    }
}
