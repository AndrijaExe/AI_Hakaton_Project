<?php

namespace App\Model\Session\Entity;

use App\Model\User\Entity\User;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'session_registrations')]
#[ORM\UniqueConstraint(columns: ['user_id', 'session_id'])]
class SessionRegistration
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private User $user;

    #[ORM\ManyToOne(targetEntity: Session::class)]
    #[ORM\JoinColumn(nullable: false)]
    private Session $session;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $registeredAt;

    public function __construct()
    {
        $this->registeredAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }

    public function getUser(): User { return $this->user; }
    public function setUser(User $user): self { $this->user = $user; return $this; }

    public function getSession(): Session { return $this->session; }
    public function setSession(Session $session): self { $this->session = $session; return $this; }

    public function getRegisteredAt(): \DateTimeImmutable { return $this->registeredAt; }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'userId' => $this->user->getId(),
            'sessionId' => $this->session->getId(),
            'registeredAt' => $this->registeredAt->format('Y-m-d\TH:i:s'),
        ];
    }
}
