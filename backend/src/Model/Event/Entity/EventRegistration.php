<?php

namespace App\Model\Event\Entity;

use App\Model\User\Entity\User;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'event_registrations')]
#[ORM\UniqueConstraint(columns: ['user_id', 'event_id'])]
class EventRegistration
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private User $user;

    #[ORM\ManyToOne(targetEntity: Event::class)]
    #[ORM\JoinColumn(nullable: false)]
    private Event $event;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $registeredAt;

    #[ORM\Column(type: 'boolean', nullable: true)]
    private ?bool $attended = null;

    public function __construct()
    {
        $this->registeredAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }

    public function getUser(): User { return $this->user; }
    public function setUser(User $user): self { $this->user = $user; return $this; }

    public function getEvent(): Event { return $this->event; }
    public function setEvent(Event $event): self { $this->event = $event; return $this; }

    public function getRegisteredAt(): \DateTimeImmutable { return $this->registeredAt; }

    public function getAttended(): ?bool { return $this->attended; }
    public function setAttended(?bool $attended): self { $this->attended = $attended; return $this; }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'userId' => $this->user->getId(),
            'eventId' => $this->event->getId(),
            'registeredAt' => $this->registeredAt->format('Y-m-d\TH:i:s'),
            'attended' => $this->attended,
        ];
    }
}
