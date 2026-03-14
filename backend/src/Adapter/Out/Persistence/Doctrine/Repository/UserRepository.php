<?php

namespace App\Adapter\Out\Persistence\Doctrine\Repository;

use App\Model\User\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class UserRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, User::class);
    }

    public function save(User $user, bool $flush = true): void
    {
        $this->getEntityManager()->persist($user);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function findByInterests(array $interests, int $excludeUserId, int $limit = 20): array
    {
        $qb = $this->createQueryBuilder('u')
            ->where('u.id != :excludeId')
            ->setParameter('excludeId', $excludeUserId);

        $users = $qb->getQuery()->getResult();

        usort($users, function (User $a, User $b) use ($interests) {
            $scoreA = count(array_intersect($a->getInterests(), $interests));
            $scoreB = count(array_intersect($b->getInterests(), $interests));
            return $scoreB - $scoreA;
        });

        return array_slice($users, 0, $limit);
    }

    public function search(string $query): array
    {
        return $this->createQueryBuilder('u')
            ->where('LOWER(u.firstName) LIKE :q')
            ->orWhere('LOWER(u.lastName) LIKE :q')
            ->orWhere('LOWER(u.company) LIKE :q')
            ->setParameter('q', '%' . strtolower($query) . '%')
            ->getQuery()
            ->getResult();
    }
}
