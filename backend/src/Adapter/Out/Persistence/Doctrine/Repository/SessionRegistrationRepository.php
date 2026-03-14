<?php

namespace App\Adapter\Out\Persistence\Doctrine\Repository;

use App\Model\Session\Entity\Session;
use App\Model\Session\Entity\SessionRegistration;
use App\Model\User\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class SessionRegistrationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, SessionRegistration::class);
    }

    public function save(SessionRegistration $reg, bool $flush = true): void
    {
        $this->getEntityManager()->persist($reg);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function findByUserAndSession(User $user, Session $session): ?SessionRegistration
    {
        return $this->findOneBy(['user' => $user, 'session' => $session]);
    }

    public function isRegistered(User $user, Session $session): bool
    {
        return $this->findByUserAndSession($user, $session) !== null;
    }

    public function getRegisteredSessionIds(User $user): array
    {
        $results = $this->createQueryBuilder('sr')
            ->select('IDENTITY(sr.session)')
            ->where('sr.user = :user')
            ->setParameter('user', $user)
            ->getQuery()
            ->getSingleColumnResult();

        return array_map('intval', $results);
    }

    public function remove(SessionRegistration $reg, bool $flush = true): void
    {
        $this->getEntityManager()->remove($reg);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }
}
