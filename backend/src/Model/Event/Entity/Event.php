<?php

namespace App\Model\Event\Entity;

use App\Model\Session\Entity\Session;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'events')]
class Event
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 255)]
    private string $name;

    #[ORM\Column(type: 'text')]
    private string $description;

    #[ORM\Column(type: 'date')]
    private \DateTimeInterface $date;

    #[ORM\Column(type: 'string', length: 200)]
    private string $location;

    #[ORM\Column(type: 'string', length: 30)]
    private string $status = 'upcoming';

    #[ORM\OneToMany(targetEntity: Session::class, mappedBy: 'event')]
    #[ORM\OrderBy(['startsAt' => 'ASC'])]
    private Collection $sessions;

    public function __construct()
    {
        $this->sessions = new ArrayCollection();
    }

    public function getId(): ?int { return $this->id; }

    public function getName(): string { return $this->name; }
    public function setName(string $name): self { $this->name = $name; return $this; }

    public function getDescription(): string { return $this->description; }
    public function setDescription(string $description): self { $this->description = $description; return $this; }

    public function getDate(): \DateTimeInterface { return $this->date; }
    public function setDate(\DateTimeInterface $date): self { $this->date = $date; return $this; }

    public function getLocation(): string { return $this->location; }
    public function setLocation(string $location): self { $this->location = $location; return $this; }

    public function getStatus(): string { return $this->status; }
    public function setStatus(string $status): self { $this->status = $status; return $this; }

    public function getSessions(): Collection { return $this->sessions; }

    public function toArray(): array
    {
        $tags = [];
        foreach ($this->sessions as $session) {
            foreach ($session->getTags() as $tag) {
                if (!in_array($tag, $tags, true)) {
                    $tags[] = $tag;
                }
            }
        }

        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'date' => $this->date->format('Y-m-d'),
            'location' => $this->location,
            'status' => $this->getComputedStatus(),
            'tags' => $tags,
        ];
    }

    /** Status derived from date: today=active, past=completed, future=upcoming */
    public function getComputedStatus(): string
    {
        $eventDateStr = $this->date->format('Y-m-d');
        $todayStr = (new \DateTime())->format('Y-m-d');
        if ($eventDateStr < $todayStr) {
            return 'completed';
        }
        if ($eventDateStr > $todayStr) {
            return 'upcoming';
        }
        return 'active';
    }
}
