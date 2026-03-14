<?php

namespace App\Adapter\In\Http\Controller;

use App\Adapter\Out\Ai\OpenAiAdapter;
use App\Adapter\Out\Persistence\Doctrine\Repository\EventRepository;
use App\Adapter\Out\Persistence\Doctrine\Repository\SessionRepository;
use App\Adapter\Out\Persistence\Doctrine\Repository\UserRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/ai')]
class AiController extends AbstractController
{
    public function __construct(
        private OpenAiAdapter $ai,
        private SessionRepository $sessionRepo,
        private UserRepository $userRepo,
        private EventRepository $eventRepo,
    ) {}

    #[Route('/recommend-events', name: 'api_ai_recommend_events', methods: ['GET'])]
    public function recommendEvents(): JsonResponse
    {
        $user = $this->getUser();
        $events = $this->eventRepo->findAllOrdered();
        $eventsData = array_map(fn($e) => $e->toArray(), $events);

        $recommendations = $this->ai->recommendEvents($user->toArray(), $eventsData);

        return $this->json(['recommendations' => $recommendations]);
    }

    #[Route('/recommend-sessions', name: 'api_ai_recommend_sessions', methods: ['GET'])]
    public function recommendSessions(): JsonResponse
    {
        $user = $this->getUser();
        $sessions = $this->sessionRepo->findAllOrdered();

        $sessionsData = array_map(fn($s) => $s->toArray(), $sessions);

        $recommendations = $this->ai->recommendSessions($user->toArray(), $sessionsData);

        return $this->json(['recommendations' => $recommendations]);
    }

    #[Route('/recommend-people', name: 'api_ai_recommend_people', methods: ['GET'])]
    public function recommendPeople(): JsonResponse
    {
        $user = $this->getUser();
        $allUsers = $this->userRepo->findAll();

        $usersData = array_map(fn($u) => $u->toArray(), array_filter(
            $allUsers,
            fn($u) => $u->getId() !== $user->getId()
        ));

        $recommendations = $this->ai->recommendPeople($user->toArray(), array_values($usersData));

        return $this->json(['recommendations' => $recommendations]);
    }
}
