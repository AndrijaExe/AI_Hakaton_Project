<?php

namespace App\Adapter\In\Http\Controller;

use App\Adapter\Out\Ai\OpenAiAdapter;
use App\Adapter\Out\Persistence\Doctrine\Repository\EventRegistrationRepository;
use App\Adapter\Out\Persistence\Doctrine\Repository\EventRepository;
use App\Adapter\Out\Persistence\Doctrine\Repository\UserRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/admin')]
class AdminController extends AbstractController
{
    public function __construct(
        private UserRepository $userRepo,
        private OpenAiAdapter $ai,
        private EventRepository $eventRepo,
        private EventRegistrationRepository $eventRegRepo,
    ) {}

    #[Route('/attendees-stats', name: 'api_admin_attendees_stats', methods: ['GET'])]
    public function attendeesStats(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $eventId = $request->query->getInt('eventId', 0);
        $users = [];

        if ($eventId > 0) {
            $event = $this->eventRepo->find($eventId);
            if (!$event) {
                return $this->json(['error' => 'Event not found'], 404);
            }
            $regs = $this->eventRegRepo->findByEvent($event);
            foreach ($regs as $reg) {
                $users[] = $reg->getUser();
            }
        } else {
            $users = $this->userRepo->findAll();
        }

        $total = count($users);
        $dietaryBreakdown = [];
        $allergyBreakdown = [];
        $countryBreakdown = [];

        foreach ($users as $user) {
            $pref = $user->getDietaryPreference() ?: 'none';
            $dietaryBreakdown[$pref] = ($dietaryBreakdown[$pref] ?? 0) + 1;

            foreach ($user->getAllergies() as $allergy) {
                $allergyBreakdown[$allergy] = ($allergyBreakdown[$allergy] ?? 0) + 1;
            }

            $country = $user->getCountry() ?: 'Unknown';
            $countryBreakdown[$country] = ($countryBreakdown[$country] ?? 0) + 1;
        }

        arsort($dietaryBreakdown);
        arsort($allergyBreakdown);
        arsort($countryBreakdown);

        return $this->json([
            'total' => $total,
            'dietaryBreakdown' => $dietaryBreakdown,
            'allergyBreakdown' => $allergyBreakdown,
            'countryBreakdown' => $countryBreakdown,
        ]);
    }

    #[Route('/events/{id}/attendees', name: 'api_admin_events_attendees', methods: ['GET'])]
    public function eventAttendees(int $id): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $event = $this->eventRepo->find($id);
        if (!$event) {
            return $this->json(['error' => 'Event not found'], 404);
        }

        $regs = $this->eventRegRepo->findByEvent($event);
        $attendees = array_map(function ($r) {
            $user = $r->getUser()->toArray();
            return [
                'user' => $user,
                'registrationId' => $r->getId(),
                'attended' => $r->getAttended(),
            ];
        }, $regs);

        return $this->json(['attendees' => $attendees]);
    }

    #[Route('/events/{eventId}/attendees/{userId}/attendance', name: 'api_admin_events_attendees_attendance', methods: ['PUT'])]
    public function setAttendance(int $eventId, int $userId, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $event = $this->eventRepo->find($eventId);
        if (!$event) {
            return $this->json(['error' => 'Event not found'], 404);
        }

        $user = $this->userRepo->find($userId);
        if (!$user) {
            return $this->json(['error' => 'User not found'], 404);
        }

        $reg = $this->eventRegRepo->findByUserAndEvent($user, $event);
        if (!$reg) {
            return $this->json(['error' => 'User is not registered for this event'], 404);
        }

        $data = json_decode($request->getContent(), true) ?: [];
        $attended = $data['attended'] ?? null;
        if ($attended === true) {
            $reg->setAttended(true);
        } elseif ($attended === false) {
            $reg->setAttended(false);
        } else {
            $reg->setAttended(null);
        }

        $this->eventRegRepo->save($reg);

        return $this->json(['attended' => $reg->getAttended()]);
    }

    #[Route('/catering-plan', name: 'api_admin_catering_plan', methods: ['GET'])]
    public function cateringPlan(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $eventId = $request->query->getInt('eventId', 0);
        $users = [];

        if ($eventId > 0) {
            $event = $this->eventRepo->find($eventId);
            if (!$event) {
                return $this->json(['error' => 'Event not found'], 404);
            }
            $regs = $this->eventRegRepo->findByEvent($event);
            foreach ($regs as $reg) {
                $users[] = $reg->getUser();
            }
        } else {
            $users = $this->userRepo->findAll();
        }

        $total = count($users);
        $dietaryStats = [];
        $allergyStats = [];

        foreach ($users as $user) {
            $pref = $user->getDietaryPreference() ?: 'none';
            $dietaryStats[$pref] = ($dietaryStats[$pref] ?? 0) + 1;

            foreach ($user->getAllergies() as $allergy) {
                $allergyStats[$allergy] = ($allergyStats[$allergy] ?? 0) + 1;
            }
        }

        $menu = $this->ai->recommendCateringMenu($dietaryStats, $allergyStats, $total);

        return $this->json([
            'totalAttendees' => $total,
            'dietaryStats' => $dietaryStats,
            'allergyStats' => $allergyStats,
            'menu' => $menu,
        ]);
    }
}
