<?php

namespace App\Adapter\Out\Persistence\Doctrine\Repository;

use App\Model\Schedule\Entity\PersonalSchedule;
use App\Model\User\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class PersonalScheduleRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PersonalSchedule::class);
    }

    public function save(PersonalSchedule $schedule, bool $flush = true): void
    {
        $this->getEntityManager()->persist($schedule);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(PersonalSchedule $schedule, bool $flush = true): void
    {
        $this->getEntityManager()->remove($schedule);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function findByUser(User $user): array
    {
        return $this->createQueryBuilder('ps')
            ->join('ps.session', 's')
            ->where('ps.user = :user')
            ->setParameter('user', $user)
            ->orderBy('s.startsAt', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findOneByUserAndSession(User $user, int $sessionId): ?PersonalSchedule
    {
        return $this->createQueryBuilder('ps')
            ->where('ps.user = :user')
            ->andWhere('ps.session = :sessionId')
            ->setParameter('user', $user)
            ->setParameter('sessionId', $sessionId)
            ->getQuery()
            ->getOneOrNullResult();
    }

    public function getBookmarkedSessionIds(User $user): array
    {
        $results = $this->createQueryBuilder('ps')
            ->select('IDENTITY(ps.session) as sessionId')
            ->where('ps.user = :user')
            ->setParameter('user', $user)
            ->getQuery()
            ->getScalarResult();

        return array_column($results, 'sessionId');
    }
}
