<?php

namespace App\Adapter\In\Http\Controller;

use App\Adapter\Out\Persistence\Doctrine\Repository\EventRegistrationRepository;
use App\Adapter\Out\Persistence\Doctrine\Repository\EventRepository;
use App\Adapter\Out\Persistence\Doctrine\Repository\SessionRegistrationRepository;
use App\Adapter\Out\Persistence\Doctrine\Repository\SessionRepository;
use App\Model\Event\Entity\Event;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/admin/events')]
class AdminEventCrudController extends AbstractController
{
    public function __construct(
        private EventRepository $eventRepo,
        private SessionRepository $sessionRepo,
        private EventRegistrationRepository $eventRegRepo,
        private SessionRegistrationRepository $sessionRegRepo,
    ) {}

    #[Route('', name: 'api_admin_events_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $data = json_decode($request->getContent(), true) ?: [];
        $errors = $this->validate($data);
        if (!empty($errors)) {
            return $this->json(['errors' => $errors], 422);
        }

        $event = new Event();
        $event->setName($data['name']);
        $event->setDescription($data['description']);
        $event->setDate(new \DateTime($data['date']));
        $event->setLocation($data['location']);
        $event->setStatus($data['status'] ?? 'upcoming');

        $this->eventRepo->save($event);

        return $this->json(['event' => $event->toArray()], 201);
    }

    #[Route('/{id}', name: 'api_admin_events_update', methods: ['PUT'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $event = $this->eventRepo->find($id);
        if (!$event) {
            return $this->json(['error' => 'Event not found'], 404);
        }

        $data = json_decode($request->getContent(), true) ?: [];
        $errors = $this->validate($data, true);
        if (!empty($errors)) {
            return $this->json(['errors' => $errors], 422);
        }

        if (isset($data['name'])) $event->setName($data['name']);
        if (isset($data['description'])) $event->setDescription($data['description']);
        if (isset($data['date'])) $event->setDate(new \DateTime($data['date']));
        if (isset($data['location'])) $event->setLocation($data['location']);
        if (isset($data['status'])) $event->setStatus($data['status']);

        $this->eventRepo->save($event);

        return $this->json(['event' => $event->toArray()]);
    }

    #[Route('/{id}', name: 'api_admin_events_delete', methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $event = $this->eventRepo->find($id);
        if (!$event) {
            return $this->json(['error' => 'Event not found'], 404);
        }

        foreach ($event->getSessions()->toArray() as $session) {
            $sessionRegs = $this->sessionRegRepo->findBy(['session' => $session]);
            foreach ($sessionRegs as $sr) {
                $this->sessionRegRepo->remove($sr, false);
            }
            $this->sessionRepo->remove($session, false);
        }
        foreach ($this->eventRegRepo->findByEvent($event) as $er) {
            $this->eventRegRepo->remove($er, false);
        }
        $this->eventRepo->remove($event);

        return $this->json(['message' => 'Deleted']);
    }

    #[Route('/{id}/sessions', name: 'api_admin_events_sessions', methods: ['GET'])]
    public function sessions(int $id): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $event = $this->eventRepo->find($id);
        if (!$event) {
            return $this->json(['error' => 'Event not found'], 404);
        }

        $sessions = $this->sessionRepo->findByEventId($id);
        $data = array_map(fn($s) => $s->toArray(), $sessions);

        return $this->json(['sessions' => $data]);
    }

    private function validate(array $data, bool $isUpdate = false): array
    {
        $errors = [];

        if (!$isUpdate) {
            if (empty($data['name'])) $errors['name'] = 'Name is required';
            if (empty($data['date'])) $errors['date'] = 'Date is required';
            if (empty($data['location'])) $errors['location'] = 'Location is required';
        }

        if (isset($data['name']) && strlen($data['name']) > 255) {
            $errors['name'] = 'Name must be at most 255 characters';
        }

        return $errors;
    }
}
