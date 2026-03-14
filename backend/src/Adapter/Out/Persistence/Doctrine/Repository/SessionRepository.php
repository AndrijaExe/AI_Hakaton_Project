<?php

namespace App\Adapter\Out\Persistence\Doctrine\Repository;

use App\Model\Session\Entity\Session;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class SessionRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Session::class);
    }

    public function save(Session $session, bool $flush = true): void
    {
        $this->getEntityManager()->persist($session);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(Session $session, bool $flush = true): void
    {
        $this->getEntityManager()->remove($session);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function findAllOrdered(): array
    {
        return $this->createQueryBuilder('s')
            ->orderBy('s.startsAt', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findByEventId(int $eventId): array
    {
        return $this->createQueryBuilder('s')
            ->innerJoin('s.event', 'e')
            ->where('e.id = :eventId')
            ->setParameter('eventId', $eventId)
            ->orderBy('s.startsAt', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findByCategory(string $category): array
    {
        return $this->createQueryBuilder('s')
            ->where('s.category = :category')
            ->setParameter('category', $category)
            ->orderBy('s.startsAt', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findByTags(array $tags): array
    {
        $sessions = $this->findAllOrdered();

        return array_filter($sessions, function (Session $session) use ($tags) {
            return count(array_intersect($session->getTags(), $tags)) > 0;
        });
    }
}
