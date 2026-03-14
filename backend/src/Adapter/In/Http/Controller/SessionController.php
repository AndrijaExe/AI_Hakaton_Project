<?php

namespace App\Adapter\In\Http\Controller;

use App\Adapter\Out\Persistence\Doctrine\Repository\EventRegistrationRepository;
use App\Adapter\Out\Persistence\Doctrine\Repository\EventRepository;
use App\Adapter\Out\Persistence\Doctrine\Repository\SessionRepository;
use App\Adapter\Out\Persistence\Doctrine\Repository\PersonalScheduleRepository;
use App\Adapter\Out\Persistence\Doctrine\Repository\SessionRegistrationRepository;
use App\Model\Session\Entity\Session;
use App\Model\Session\Entity\SessionRegistration;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/sessions')]
class SessionController extends AbstractController
{
    public function __construct(
        private SessionRepository $sessionRepo,
        private PersonalScheduleRepository $scheduleRepo,
        private SessionRegistrationRepository $sessionRegRepo,
        private EventRegistrationRepository $eventRegRepo,
        private EventRepository $eventRepo,
    ) {}

    #[Route('', name: 'api_sessions_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $category = $request->query->get('category');

        $sessions = $category
            ? $this->sessionRepo->findByCategory($category)
            : $this->sessionRepo->findAllOrdered();

        $user = $this->getUser();
        $bookmarkedIds = $user ? $this->scheduleRepo->getBookmarkedSessionIds($user) : [];
        $registeredIds = $user ? $this->sessionRegRepo->getRegisteredSessionIds($user) : [];

        $data = array_map(function ($session) use ($bookmarkedIds, $registeredIds) {
            $arr = $session->toArray();
            $arr['isBookmarked'] = in_array($session->getId(), $bookmarkedIds);
            $arr['isRegistered'] = in_array($session->getId(), $registeredIds);
            return $arr;
        }, $sessions);

        return $this->json(['sessions' => array_values($data)]);
    }

    #[Route('', name: 'api_sessions_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $data = json_decode($request->getContent(), true);

        if (!empty($data['eventId'])) {
            $event = $this->eventRepo->find($data['eventId']);
            if ($event && $event->getComputedStatus() === 'active') {
                return $this->json(['error' => 'Cannot add sessions to a live event'], 403);
            }
        }

        $errors = $this->validateSessionData($data);
        if (!empty($errors)) {
            return $this->json(['errors' => $errors], 422);
        }

        $session = new Session();
        $this->applySessionData($session, $data);
        if (!empty($data['eventId'])) {
            $event = $this->eventRepo->find($data['eventId']);
            if ($event) {
                $session->setEvent($event);
            }
        }
        $this->sessionRepo->save($session);

        return $this->json(['session' => $session->toArray()], 201);
    }

    #[Route('/{id}', name: 'api_sessions_detail', methods: ['GET'])]
    public function detail(int $id): JsonResponse
    {
        $session = $this->sessionRepo->find($id);
        if (!$session) {
            return $this->json(['error' => 'Session not found'], 404);
        }

        $user = $this->getUser();
        $bookmarkedIds = $user ? $this->scheduleRepo->getBookmarkedSessionIds($user) : [];

        $data = $session->toArray();
        $data['isBookmarked'] = in_array($session->getId(), $bookmarkedIds);
        $data['isRegistered'] = $user ? $this->sessionRegRepo->isRegistered($user, $session) : false;

        return $this->json(['session' => $data]);
    }

    #[Route('/{id}/register', name: 'api_sessions_register', methods: ['POST'])]
    public function registerForSession(int $id): JsonResponse
    {
        $session = $this->sessionRepo->find($id);
        if (!$session) {
            return $this->json(['error' => 'Session not found'], 404);
        }

        $user = $this->getUser();
        $event = $session->getEvent();
        if ($event && !$this->eventRegRepo->isRegistered($user, $event)) {
            return $this->json(['error' => 'You must register for the event first'], 400);
        }

        if ($this->sessionRegRepo->isRegistered($user, $session)) {
            return $this->json(['message' => 'Already checked in']);
        }

        $reg = new SessionRegistration();
        $reg->setUser($user);
        $reg->setSession($session);
        $this->sessionRegRepo->save($reg);

        return $this->json(['registration' => $reg->toArray()], 201);
    }

    #[Route('/{id}/register', name: 'api_sessions_unregister', methods: ['DELETE'])]
    public function unregisterFromSession(int $id): JsonResponse
    {
        $session = $this->sessionRepo->find($id);
        if (!$session) {
            return $this->json(['error' => 'Session not found'], 404);
        }

        $user = $this->getUser();
        $reg = $this->sessionRegRepo->findByUserAndSession($user, $session);
        if (!$reg) {
            return $this->json(['error' => 'Not registered'], 404);
        }

        $this->sessionRegRepo->remove($reg);

        return $this->json(['message' => 'Unregistered']);
    }

    #[Route('/{id}', name: 'api_sessions_update', methods: ['PUT'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $session = $this->sessionRepo->find($id);
        if (!$session) {
            return $this->json(['error' => 'Session not found'], 404);
        }

        $event = $session->getEvent();
        if ($event && $event->getComputedStatus() === 'active') {
            return $this->json(['error' => 'Cannot edit sessions of a live event'], 403);
        }

        $data = json_decode($request->getContent(), true);

        $errors = $this->validateSessionData($data, true);
        if (!empty($errors)) {
            return $this->json(['errors' => $errors], 422);
        }

        $this->applySessionData($session, $data);
        $this->sessionRepo->save($session);

        return $this->json(['session' => $session->toArray()]);
    }

    #[Route('/{id}', name: 'api_sessions_delete', methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $session = $this->sessionRepo->find($id);
        if (!$session) {
            return $this->json(['error' => 'Session not found'], 404);
        }

        $event = $session->getEvent();
        if ($event && $event->getComputedStatus() === 'active') {
            return $this->json(['error' => 'Cannot delete sessions of a live event'], 403);
        }

        $this->sessionRepo->remove($session);

        return $this->json(['message' => 'Deleted']);
    }

    private function applySessionData(Session $session, array $data): void
    {
        if (isset($data['title'])) $session->setTitle($data['title']);
        if (isset($data['description'])) $session->setDescription($data['description']);
        if (isset($data['speaker'])) $session->setSpeaker($data['speaker']);
        if (isset($data['location'])) $session->setLocation($data['location']);
        if (isset($data['category'])) $session->setCategory($data['category']);
        if (isset($data['startsAt'])) $session->setStartsAt(new \DateTime($data['startsAt']));
        if (isset($data['endsAt'])) $session->setEndsAt(new \DateTime($data['endsAt']));
        if (isset($data['tags'])) $session->setTags($data['tags']);
        if (isset($data['capacity'])) $session->setCapacity($data['capacity']);
        if (isset($data['speakerBio'])) $session->setSpeakerBio($data['speakerBio']);
        if (array_key_exists('isOptional', $data)) $session->setIsOptional((bool)$data['isOptional']);
        if (!empty($data['eventId'])) {
            $event = $this->eventRepo->find($data['eventId']);
            if ($event) {
                $session->setEvent($event);
            }
        }
    }

    private function validateSessionData(array $data, bool $isUpdate = false): array
    {
        $errors = [];

        if (!$isUpdate) {
            if (empty($data['title'])) {
                $errors['title'] = 'Title is required.';
            }
            if (empty($data['startsAt'])) {
                $errors['startsAt'] = 'Start time is required.';
            }
            if (empty($data['endsAt'])) {
                $errors['endsAt'] = 'End time is required.';
            }
        }

        if (isset($data['title']) && strlen($data['title']) > 255) {
            $errors['title'] = 'Title must be at most 255 characters.';
        }

        if (!empty($data['startsAt']) && !empty($data['endsAt'])) {
            try {
                $start = new \DateTime($data['startsAt']);
                $end = new \DateTime($data['endsAt']);
                if ($end <= $start) {
                    $errors['endsAt'] = 'End time must be after start time.';
                }
            } catch (\Exception $e) {
                $errors['startsAt'] = 'Invalid date format.';
            }
        }

        if (isset($data['location']) && strlen($data['location']) > 100) {
            $errors['location'] = 'Location must be at most 100 characters.';
        }

        return $errors;
    }
}
