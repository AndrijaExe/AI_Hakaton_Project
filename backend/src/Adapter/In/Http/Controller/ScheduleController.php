<?php

namespace App\Adapter\In\Http\Controller;

use App\Adapter\Out\Persistence\Doctrine\Repository\EventRegistrationRepository;
use App\Adapter\Out\Persistence\Doctrine\Repository\SessionRegistrationRepository;
use App\Adapter\Out\Persistence\Doctrine\Repository\SessionRepository;
use App\Adapter\Out\Persistence\Doctrine\Repository\PersonalScheduleRepository;
use App\Model\Schedule\Entity\PersonalSchedule;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/schedule')]
class ScheduleController extends AbstractController
{
    public function __construct(
        private PersonalScheduleRepository $scheduleRepo,
        private SessionRepository $sessionRepo,
        private EventRegistrationRepository $eventRegRepo,
        private SessionRegistrationRepository $sessionRegRepo,
    ) {}

    /**
     * Returns events the user is registered for, with their program (mandatory sessions + optional sessions joined).
     * The whole event is in schedule, not individual sessions.
     */
    #[Route('/my', name: 'api_schedule_my', methods: ['GET'])]
    public function mySchedule(): JsonResponse
    {
        $user = $this->getUser();
        $eventRegs = $this->eventRegRepo->findByUser($user);
        $registeredOptionalIds = $this->sessionRegRepo->getRegisteredSessionIds($user);

        $events = [];
        foreach ($eventRegs as $reg) {
            $event = $reg->getEvent();
            $eventData = $event->toArray();
            $eventData['sessions'] = [];
            foreach ($event->getSessions() as $session) {
                $isOptional = $session->isOptional();
                if (!$isOptional) {
                    $eventData['sessions'][] = array_merge($session->toArray(), ['isRegistered' => false]);
                } elseif (in_array($session->getId(), $registeredOptionalIds)) {
                    $eventData['sessions'][] = array_merge($session->toArray(), ['isRegistered' => true]);
                }
            }
            usort($eventData['sessions'], fn($a, $b) => strcmp($a['startsAt'], $b['startsAt']));
            $events[] = $eventData;
        }

        return $this->json(['schedule' => $events]);
    }

    #[Route('/bookmark', name: 'api_schedule_bookmark', methods: ['POST'])]
    public function bookmark(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $sessionId = $data['sessionId'] ?? null;

        if (!$sessionId) {
            return $this->json(['error' => 'sessionId is required'], 400);
        }

        $user = $this->getUser();
        $session = $this->sessionRepo->find($sessionId);

        if (!$session) {
            return $this->json(['error' => 'Session not found'], 404);
        }

        $existing = $this->scheduleRepo->findOneByUserAndSession($user, $sessionId);
        if ($existing) {
            return $this->json(['error' => 'Already bookmarked'], 409);
        }

        $schedule = new PersonalSchedule();
        $schedule->setUser($user);
        $schedule->setSession($session);
        $this->scheduleRepo->save($schedule);

        return $this->json(['message' => 'Bookmarked'], 201);
    }

    #[Route('/bookmark/{sessionId}', name: 'api_schedule_unbookmark', methods: ['DELETE'])]
    public function unbookmark(int $sessionId): JsonResponse
    {
        $user = $this->getUser();
        $entry = $this->scheduleRepo->findOneByUserAndSession($user, $sessionId);

        if (!$entry) {
            return $this->json(['error' => 'Bookmark not found'], 404);
        }

        $this->scheduleRepo->remove($entry);

        return $this->json(['message' => 'Removed']);
    }
}
