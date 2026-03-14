<?php

namespace App\Adapter\Out\Persistence\Doctrine\Repository;

use App\Model\Connection\Entity\ConnectionRequest;
use App\Model\User\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class ConnectionRequestRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ConnectionRequest::class);
    }

    public function save(ConnectionRequest $request, bool $flush = true): void
    {
        $this->getEntityManager()->persist($request);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function findByUser(User $user): array
    {
        return $this->createQueryBuilder('cr')
            ->where('cr.sender = :user OR cr.receiver = :user')
            ->setParameter('user', $user)
            ->orderBy('cr.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findPendingForUser(User $user): array
    {
        return $this->createQueryBuilder('cr')
            ->where('cr.receiver = :user')
            ->andWhere('cr.status = :status')
            ->setParameter('user', $user)
            ->setParameter('status', ConnectionRequest::STATUS_PENDING)
            ->orderBy('cr.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findAcceptedForUser(User $user): array
    {
        return $this->createQueryBuilder('cr')
            ->where('(cr.sender = :user OR cr.receiver = :user)')
            ->andWhere('cr.status = :status')
            ->setParameter('user', $user)
            ->setParameter('status', ConnectionRequest::STATUS_ACCEPTED)
            ->orderBy('cr.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findExistingBetween(User $userA, User $userB): ?ConnectionRequest
    {
        return $this->createQueryBuilder('cr')
            ->where('(cr.sender = :a AND cr.receiver = :b) OR (cr.sender = :b AND cr.receiver = :a)')
            ->setParameter('a', $userA)
            ->setParameter('b', $userB)
            ->getQuery()
            ->getOneOrNullResult();
    }
}
