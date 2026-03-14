<?php

namespace App\Adapter\Out\Persistence\Doctrine\Repository;

use App\Model\Event\Entity\Event;
use App\Model\Notification\Entity\Notification;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class NotificationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Notification::class);
    }

    public function save(Notification $notification, bool $flush = true): void
    {
        $this->getEntityManager()->persist($notification);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    /**
     * @param int|null $userId When set, returns global notifications (receiver=null) + notifications for this user
     */
    public function findAllRecent(?int $userId = null, int $limit = 50): array
    {
        $qb = $this->createQueryBuilder('n')
            ->orderBy('n.createdAt', 'DESC')
            ->setMaxResults($limit);

        if ($userId !== null) {
            $qb->andWhere('n.receiver IS NULL OR n.receiver = :userId')
                ->setParameter('userId', $userId);
        } else {
            $qb->andWhere('n.receiver IS NULL');
        }

        return $qb->getQuery()->getResult();
    }

    /**
     * Returns event notifications, deduplicated by (title, content, createdAt).
     * Ordered by createdAt DESC.
     */
    public function findByEventDeduplicated(Event $event): array
    {
        $all = $this->createQueryBuilder('n')
            ->where('n.event = :event')
            ->setParameter('event', $event)
            ->orderBy('n.createdAt', 'DESC')
            ->getQuery()
            ->getResult();

        $seen = [];
        $result = [];
        foreach ($all as $n) {
            $key = $n->getTitle() . '|' . $n->getContent() . '|' . $n->getCreatedAt()->format('c');
            if (!isset($seen[$key])) {
                $seen[$key] = true;
                $result[] = $n;
            }
        }
        usort($result, fn($a, $b) => $b->getCreatedAt() <=> $a->getCreatedAt());
        return $result;
    }
}
