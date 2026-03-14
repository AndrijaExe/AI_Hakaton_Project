<?php

namespace App\Adapter\In\Http\Controller;

use App\Adapter\Out\Persistence\Doctrine\Repository\EventRepository;
use App\Adapter\Out\Persistence\Doctrine\Repository\EventRegistrationRepository;
use App\Adapter\Out\Persistence\Doctrine\Repository\NotificationRepository;
use App\Adapter\Out\Persistence\Doctrine\Repository\SessionRegistrationRepository;
use App\Model\Event\Entity\Event;
use App\Model\Event\Entity\EventRegistration;
use App\Model\Session\Entity\SessionRegistration;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/events')]
class EventController extends AbstractController
{
    public function __construct(
        private EventRepository $eventRepo,
        private EventRegistrationRepository $eventRegRepo,
        private NotificationRepository $notificationRepo,
        private SessionRegistrationRepository $sessionRegRepo,
    ) {}

    #[Route('/recommended', name: 'api_events_recommended', methods: ['GET'])]
    public function recommended(): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['recommendations' => []]);
        }
        $interests = array_map('strtolower', $user->getInterests());
        if (empty($interests)) {
            return $this->json(['recommendations' => []]);
        }

        $events = $this->eventRepo->findAllOrdered();
        $scored = [];
        foreach ($events as $event) {
            $eventArr = $event->toArray();
            $eventTags = array_map('strtolower', $eventArr['tags'] ?? []);
            $matches = array_intersect($interests, $eventTags);
            $score = count($matches);
            $scored[] = [
                'event' => $event,
                'eventArr' => $eventArr,
                'score' => $score,
                'matches' => array_values($matches),
            ];
        }

        usort($scored, fn($a, $b) => $b['score'] <=> $a['score']);
        $top = array_slice(array_filter($scored, fn($s) => $s['score'] > 0), 0, 10);

        $userArr = $user;
        $recommendations = array_map(function ($item) {
            $eventArr = $item['eventArr'];
            $matches = $item['matches'];
            $reason = !empty($matches)
                ? 'Matches your interests: ' . implode(', ', $matches)
                : 'Recommended for you';
            return [
                'id' => $eventArr['id'],
                'title' => $eventArr['name'],
                'reason' => $reason,
            ];
        }, $top);

        return $this->json(['recommendations' => $recommendations]);
    }

    #[Route('', name: 'api_events_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $events = $this->eventRepo->findAllOrdered();
        $user = $this->getUser();

        $data = array_map(function (Event $event) use ($user) {
            $arr = $event->toArray();
            $arr['isRegistered'] = $user ? $this->eventRegRepo->isRegistered($user, $event) : false;
            $arr['attendeeCount'] = count($this->eventRegRepo->findByEvent($event));
            return $arr;
        }, $events);

        return $this->json(['events' => $data]);
    }

    #[Route('/{id}/notifications', name: 'api_events_notifications', methods: ['GET'])]
    public function notifications(int $id): JsonResponse
    {
        $event = $this->eventRepo->find($id);
        if (!$event) {
            return $this->json(['error' => 'Event not found'], 404);
        }

        $notifications = $this->notificationRepo->findByEventDeduplicated($event);
        $eventDateStr = $event->getDate()->format('Y-m-d');

        $before = [];
        $during = [];
        $after = [];
        foreach ($notifications as $n) {
            $arr = $n->toArray();
            $createdAtStr = $n->getCreatedAt()->format('Y-m-d');
            if ($createdAtStr < $eventDateStr) {
                $before[] = $arr;
            } elseif ($createdAtStr === $eventDateStr) {
                $during[] = $arr;
            } else {
                $after[] = $arr;
            }
        }

        return $this->json([
            'event' => $event->toArray(),
            'beforeEvent' => $before,
            'duringEvent' => $during,
            'afterEvent' => $after,
        ]);
    }

    #[Route('/{id}', name: 'api_events_detail', methods: ['GET'])]
    public function detail(int $id): JsonResponse
    {
        $event = $this->eventRepo->find($id);
        if (!$event) {
            return $this->json(['error' => 'Event not found'], 404);
        }

        $user = $this->getUser();

        $eventData = $event->toArray();
        $eventData['isRegistered'] = $user ? $this->eventRegRepo->isRegistered($user, $event) : false;
        $eventData['attendeeCount'] = count($this->eventRegRepo->findByEvent($event));

        $registeredOptionalIds = $user ? $this->sessionRegRepo->getRegisteredSessionIds($user) : [];

        $sessionsData = [];
        foreach ($event->getSessions() as $session) {
            $arr = $session->toArray();
            $arr['isRegistered'] = in_array($session->getId(), $registeredOptionalIds);
            $sessionsData[] = $arr;
        }

        $eventData['sessions'] = $sessionsData;

        return $this->json(['event' => $eventData]);
    }

    #[Route('/{id}/register', name: 'api_events_register', methods: ['POST'])]
    public function register(int $id): JsonResponse
    {
        $event = $this->eventRepo->find($id);
        if (!$event) {
            return $this->json(['error' => 'Event not found'], 404);
        }

        $status = $event->getComputedStatus();
        if ($status === 'active' || $status === 'completed') {
            return $this->json(['error' => 'Registration is closed for this event'], 400);
        }

        $user = $this->getUser();
        if ($this->eventRegRepo->isRegistered($user, $event)) {
            return $this->json(['message' => 'Already registered']);
        }

        $reg = new EventRegistration();
        $reg->setUser($user);
        $reg->setEvent($event);
        $this->eventRegRepo->save($reg);

        foreach ($event->getSessions() as $session) {
            if (!$this->sessionRegRepo->isRegistered($user, $session)) {
                $sessionReg = new SessionRegistration();
                $sessionReg->setUser($user);
                $sessionReg->setSession($session);
                $this->sessionRegRepo->save($sessionReg, false);
            }
        }
        $this->sessionRegRepo->getEntityManager()->flush();

        return $this->json(['registration' => $reg->toArray()], 201);
    }

    #[Route('/{id}/unregister', name: 'api_events_unregister', methods: ['DELETE'])]
    public function unregister(int $id): JsonResponse
    {
        $event = $this->eventRepo->find($id);
        if (!$event) {
            return $this->json(['error' => 'Event not found'], 404);
        }

        $user = $this->getUser();
        $reg = $this->eventRegRepo->findByUserAndEvent($user, $event);
        if (!$reg) {
            return $this->json(['error' => 'Not registered'], 404);
        }

        foreach ($event->getSessions() as $session) {
            $sessionReg = $this->sessionRegRepo->findByUserAndSession($user, $session);
            if ($sessionReg) {
                $this->sessionRegRepo->remove($sessionReg, false);
            }
        }
        $this->sessionRegRepo->getEntityManager()->flush();

        $this->eventRegRepo->remove($reg);

        return $this->json(['message' => 'Unregistered']);
    }
}
