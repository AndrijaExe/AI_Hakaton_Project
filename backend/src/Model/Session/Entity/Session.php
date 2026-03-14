<?php

namespace App\Model\Session\Entity;

use App\Model\Event\Entity\Event;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'sessions')]
class Session
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 255)]
    private string $title;

    #[ORM\Column(type: 'text')]
    private string $description;

    #[ORM\Column(type: 'string', length: 200)]
    private string $speaker;

    #[ORM\Column(type: 'string', length: 300, nullable: true)]
    private ?string $speakerBio = null;

    #[ORM\Column(type: 'string', length: 100)]
    private string $location;

    #[ORM\Column(type: 'string', length: 50)]
    private string $category;

    #[ORM\Column(type: 'datetime')]
    private \DateTimeInterface $startsAt;

    #[ORM\Column(type: 'datetime')]
    private \DateTimeInterface $endsAt;

    #[ORM\Column(type: 'json')]
    private array $tags = [];

    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $capacity = null;

    #[ORM\Column(type: 'boolean')]
    private bool $isOptional = false;

    #[ORM\ManyToOne(targetEntity: Event::class, inversedBy: 'sessions')]
    #[ORM\JoinColumn(nullable: true)]
    private ?Event $event = null;

    public function getId(): ?int { return $this->id; }

    public function getTitle(): string { return $this->title; }
    public function setTitle(string $title): self { $this->title = $title; return $this; }

    public function getDescription(): string { return $this->description; }
    public function setDescription(string $description): self { $this->description = $description; return $this; }

    public function getSpeaker(): string { return $this->speaker; }
    public function setSpeaker(string $speaker): self { $this->speaker = $speaker; return $this; }

    public function getSpeakerBio(): ?string { return $this->speakerBio; }
    public function setSpeakerBio(?string $speakerBio): self { $this->speakerBio = $speakerBio; return $this; }

    public function getLocation(): string { return $this->location; }
    public function setLocation(string $location): self { $this->location = $location; return $this; }

    public function getCategory(): string { return $this->category; }
    public function setCategory(string $category): self { $this->category = $category; return $this; }

    public function getStartsAt(): \DateTimeInterface { return $this->startsAt; }
    public function setStartsAt(\DateTimeInterface $startsAt): self { $this->startsAt = $startsAt; return $this; }

    public function getEndsAt(): \DateTimeInterface { return $this->endsAt; }
    public function setEndsAt(\DateTimeInterface $endsAt): self { $this->endsAt = $endsAt; return $this; }

    public function getTags(): array { return $this->tags; }
    public function setTags(array $tags): self { $this->tags = $tags; return $this; }

    public function getCapacity(): ?int { return $this->capacity; }
    public function setCapacity(?int $capacity): self { $this->capacity = $capacity; return $this; }

    public function isOptional(): bool { return $this->isOptional; }
    public function getIsOptional(): bool { return $this->isOptional; }
    public function setIsOptional(bool $isOptional): self { $this->isOptional = $isOptional; return $this; }

    public function getEvent(): ?Event { return $this->event; }
    public function setEvent(?Event $event): self { $this->event = $event; return $this; }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'speaker' => $this->speaker,
            'speakerBio' => $this->speakerBio,
            'location' => $this->location,
            'category' => $this->category,
            'startsAt' => $this->startsAt->format('Y-m-d\TH:i:s'),
            'endsAt' => $this->endsAt->format('Y-m-d\TH:i:s'),
            'tags' => $this->tags,
            'capacity' => $this->capacity,
            'isOptional' => $this->isOptional,
            'eventId' => $this->event?->getId(),
        ];
    }
}
