<?php

namespace App\Adapter\In\Http\Controller;

use App\Adapter\Out\Persistence\Doctrine\Repository\NotificationRepository;
use App\Model\Notification\Entity\Notification;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/notifications')]
class NotificationController extends AbstractController
{
    public function __construct(
        private NotificationRepository $notificationRepo,
    ) {}

    #[Route('', name: 'api_notifications_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $user = $this->getUser();
        $userId = $user?->getId();
        $notifications = $this->notificationRepo->findAllRecent($userId);
        $data = array_map(fn(Notification $n) => $n->toArray(), $notifications);

        return $this->json(['notifications' => $data]);
    }

    #[Route('', name: 'api_notifications_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $data = json_decode($request->getContent(), true);

        $notification = new Notification();
        $notification->setTitle($data['title'] ?? '');
        $notification->setContent($data['content'] ?? '');
        $notification->setType($data['type'] ?? 'info');
        $notification->setPriority($data['priority'] ?? 'normal');

        $this->notificationRepo->save($notification);

        return $this->json(['notification' => $notification->toArray()], 201);
    }
}
