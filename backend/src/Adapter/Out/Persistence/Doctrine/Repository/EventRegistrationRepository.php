<?php

namespace App\Adapter\Out\Persistence\Doctrine\Repository;

use App\Model\Event\Entity\Event;
use App\Model\Event\Entity\EventRegistration;
use App\Model\User\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class EventRegistrationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, EventRegistration::class);
    }

    public function save(EventRegistration $reg, bool $flush = true): void
    {
        $this->getEntityManager()->persist($reg);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function findByUserAndEvent(User $user, Event $event): ?EventRegistration
    {
        return $this->findOneBy(['user' => $user, 'event' => $event]);
    }

    public function findByEvent(Event $event): array
    {
        return $this->findBy(['event' => $event]);
    }

    public function isRegistered(User $user, Event $event): bool
    {
        return $this->findByUserAndEvent($user, $event) !== null;
    }

    /** @return EventRegistration[] */
    public function findByUser(User $user): array
    {
        return $this->findBy(['user' => $user], ['registeredAt' => 'ASC']);
    }

    public function remove(EventRegistration $reg, bool $flush = true): void
    {
        $this->getEntityManager()->remove($reg);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }
}
