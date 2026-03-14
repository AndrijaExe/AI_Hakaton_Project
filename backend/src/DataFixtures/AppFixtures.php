<?php

namespace App\DataFixtures;

use App\Model\User\Entity\User;
use App\Model\Session\Entity\Session;
use App\Model\Session\Entity\SessionRegistration;
use App\Model\Event\Entity\Event;
use App\Model\Event\Entity\EventRegistration;
use App\Model\Notification\Entity\Notification;
use App\Model\Connection\Entity\ConnectionRequest;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AppFixtures extends Fixture
{
    public function __construct(
        private UserPasswordHasherInterface $hasher,
    ) {}

    public function load(ObjectManager $manager): void
    {
        $conn = $manager->getConnection();
        foreach (['users', 'events', 'sessions', 'event_registrations', 'session_registrations', 'notifications', 'connection_requests', 'personal_schedules'] as $table) {
            try {
                $conn->executeStatement("ALTER SEQUENCE {$table}_id_seq RESTART WITH 1");
            } catch (\Throwable $e) {
                // Ignore if sequence doesn't exist
            }
        }

        $users = $this->loadUsers($manager);
        $events = $this->loadEvents($manager);
        $this->loadSessions($manager, $events);
        $eventRegs = $this->loadEventRegistrations($manager, $events, $users);
        $manager->flush(); // flush so sessions exist in DB for loadSessionRegistrations query
        $this->loadSessionRegistrations($manager, $eventRegs);
        $this->loadNotifications($manager, $events);
        $this->loadConnections($manager, $users);

        $manager->flush();
    }

    private function loadUsers(ObjectManager $manager): array
    {
        $usersData = [
            ['email' => 'admin@community.day', 'firstName' => 'Admin', 'lastName' => 'User', 'company' => 'Fiscal Solutions', 'position' => 'Event Organizer', 'country' => 'Serbia', 'interests' => ['fiscalization', 'pos', 'retail'], 'roles' => ['ROLE_ADMIN'], 'bio' => 'Community Day organizer and tech enthusiast.', 'dietaryPreference' => null, 'allergies' => []],
            ['email' => 'marko@example.com', 'firstName' => 'Marko', 'lastName' => 'Petrovic', 'company' => 'RetailTech d.o.o.', 'position' => 'CTO', 'country' => 'Serbia', 'interests' => ['pos', 'cloud', 'api', 'retail'], 'bio' => 'Building next-gen POS solutions.', 'dietaryPreference' => null, 'allergies' => []],
            ['email' => 'anna@example.com', 'firstName' => 'Anna', 'lastName' => 'Mueller', 'company' => 'FiscalDE GmbH', 'position' => 'Compliance Manager', 'country' => 'Germany', 'interests' => ['fiscalization', 'compliance', 'regulation'], 'bio' => 'Specializing in EU fiscal compliance.', 'dietaryPreference' => 'vegetarian', 'allergies' => ['lactose'], 'language' => 'de'],
            ['email' => 'john@example.com', 'firstName' => 'John', 'lastName' => 'Smith', 'company' => 'CloudPOS Inc.', 'position' => 'Software Architect', 'country' => 'USA', 'interests' => ['cloud', 'microservices', 'api', 'pos'], 'bio' => 'Cloud-first POS architecture advocate.', 'dietaryPreference' => null, 'allergies' => ['gluten']],
            ['email' => 'elena@example.com', 'firstName' => 'Elena', 'lastName' => 'Vasic', 'company' => 'DataFisc', 'position' => 'Data Analyst', 'country' => 'Serbia', 'interests' => ['data', 'analytics', 'fiscalization', 'reporting'], 'bio' => 'Turning fiscal data into business insights.', 'dietaryPreference' => 'vegan', 'allergies' => ['nuts']],
            ['email' => 'pierre@example.com', 'firstName' => 'Pierre', 'lastName' => 'Dupont', 'company' => 'FiscalFR', 'position' => 'Integration Lead', 'country' => 'France', 'interests' => ['integration', 'api', 'erp', 'fiscalization'], 'bio' => 'ERP and fiscal integration specialist.', 'dietaryPreference' => null, 'allergies' => [], 'language' => 'fr'],
            ['email' => 'sarah@example.com', 'firstName' => 'Sarah', 'lastName' => 'Johnson', 'company' => 'RetailAI', 'position' => 'Product Manager', 'country' => 'UK', 'interests' => ['ai', 'retail', 'ux', 'pos'], 'bio' => 'AI-powered retail experiences.', 'dietaryPreference' => 'vegan', 'allergies' => []],
            ['email' => 'milan@example.com', 'firstName' => 'Milan', 'lastName' => 'Jovanovic', 'company' => 'EFiskalni', 'position' => 'Developer', 'country' => 'Serbia', 'interests' => ['pos', 'mobile', 'android', 'fiscalization'], 'bio' => 'Mobile POS developer.', 'dietaryPreference' => null, 'allergies' => []],
            ['email' => 'katarina@example.com', 'firstName' => 'Katarina', 'lastName' => 'Novak', 'company' => 'ShopSys', 'position' => 'UX Designer', 'country' => 'Croatia', 'interests' => ['ux', 'design', 'retail', 'mobile'], 'bio' => 'Designing beautiful retail interfaces.', 'dietaryPreference' => 'vegetarian', 'allergies' => []],
            ['email' => 'thomas@example.com', 'firstName' => 'Thomas', 'lastName' => 'Weber', 'company' => 'PayTech AG', 'position' => 'Payment Specialist', 'country' => 'Austria', 'interests' => ['payments', 'pos', 'security', 'compliance'], 'bio' => 'Making payments seamless and secure.', 'dietaryPreference' => null, 'allergies' => ['shellfish']],
            ['email' => 'ivana@example.com', 'firstName' => 'Ivana', 'lastName' => 'Stojanovic', 'company' => 'Fiscal Solutions', 'position' => 'QA Lead', 'country' => 'Serbia', 'interests' => ['testing', 'quality', 'fiscalization', 'automation'], 'bio' => 'Quality-driven fiscal solutions.', 'dietaryPreference' => null, 'allergies' => []],
            ['email' => 'luca@example.com', 'firstName' => 'Luca', 'lastName' => 'Rossi', 'company' => 'FiscalIT', 'position' => 'Technical Director', 'country' => 'Italy', 'interests' => ['fiscalization', 'regulation', 'cloud', 'compliance'], 'bio' => 'Leading fiscal innovation in Italy.', 'dietaryPreference' => null, 'allergies' => []],
            ['email' => 'maja@example.com', 'firstName' => 'Maja', 'lastName' => 'Horvat', 'company' => 'SmartRetail', 'position' => 'Business Analyst', 'country' => 'Slovenia', 'interests' => ['retail', 'analytics', 'reporting', 'strategy'], 'bio' => 'Retail strategy and analytics.', 'dietaryPreference' => 'halal', 'allergies' => []],
            ['email' => 'alex@example.com', 'firstName' => 'Aleksandar', 'lastName' => 'Djordjevic', 'company' => 'DevHub', 'position' => 'Full Stack Dev', 'country' => 'Serbia', 'interests' => ['api', 'cloud', 'mobile', 'react'], 'bio' => 'Full stack development enthusiast.', 'dietaryPreference' => null, 'allergies' => ['gluten', 'lactose']],
            ['email' => 'nina@example.com', 'firstName' => 'Nina', 'lastName' => 'Kovac', 'company' => 'FiscalHR', 'position' => 'Project Manager', 'country' => 'Croatia', 'interests' => ['management', 'fiscalization', 'compliance', 'agile'], 'bio' => 'Agile project management in fiscal tech.', 'dietaryPreference' => 'halal', 'allergies' => ['nuts']],
        ];

        $users = [];
        foreach ($usersData as $data) {
            $user = new User();
            $user->setEmail($data['email']);
            $user->setFirstName($data['firstName']);
            $user->setLastName($data['lastName']);
            $user->setCompany($data['company']);
            $user->setPosition($data['position']);
            $user->setCountry($data['country']);
            $user->setInterests($data['interests']);
            $user->setBio($data['bio'] ?? null);
            $user->setRoles($data['roles'] ?? []);
            $user->setDietaryPreference($data['dietaryPreference'] ?? null);
            $user->setAllergies($data['allergies'] ?? []);
            $user->setLanguage($data['language'] ?? 'en');
            $user->setPassword($this->hasher->hashPassword($user, 'community2026'));

            $manager->persist($user);
            $users[] = $user;
        }

        return $users;
    }

    private function loadEvents(ObjectManager $manager): array
    {
        $today = (new \DateTime())->format('Y-m-d');
        $yesterday = (new \DateTime('-1 day'))->format('Y-m-d');
        $eventsData = [
            ['name' => 'Community Day 2026', 'description' => 'Annual professional event bringing together experts in fiscalization, retail technology, and POS systems.', 'date' => $today, 'location' => 'Fiscal Solutions HQ, Belgrade'],
            ['name' => 'Fiscal Tech Summit', 'description' => 'Deep dive into fiscal compliance and regulatory technology across European markets.', 'date' => '2026-04-10', 'location' => 'Novi Sad, Serbia'],
            ['name' => 'Retail Innovation Day', 'description' => 'Explore the latest in retail technology, AI, and customer experience.', 'date' => '2026-05-22', 'location' => 'Belgrade'],
            ['name' => 'API & Integration Workshop', 'description' => 'Hands-on workshop on building integrations and APIs for fiscal systems.', 'date' => '2026-06-05', 'location' => 'Online'],
            ['name' => 'POS Workshop 2025', 'description' => 'Hands-on POS development workshop (closed event for testing attendance stats).', 'date' => $yesterday, 'location' => 'Belgrade'],
        ];

        $events = [];
        foreach ($eventsData as $data) {
            $event = new Event();
            $event->setName($data['name']);
            $event->setDescription($data['description']);
            $event->setDate(new \DateTime($data['date']));
            $event->setLocation($data['location']);
            $event->setStatus('upcoming');
            $manager->persist($event);
            $events[] = $event;
        }

        return $events;
    }

    private function loadSessions(ObjectManager $manager, array $events): void
    {
        $event1 = $events[0];
        $event2 = $events[1];
        $event3 = $events[2];
        $event4 = $events[3];
        $event5 = $events[4];

        $d1 = $event1->getDate()->format('Y-m-d');
        $d5 = $event5->getDate()->format('Y-m-d');
        $sessionsData = [
            // Community Day 2026 - tags: fiscalization, pos, cloud, retail
            [$event1, 'Welcome & Opening Keynote', 'Opening remarks and keynote on the future of fiscalization.', 'Dragan Milić', 'Main Hall', 'presentation', $d1 . ' 09:00', $d1 . ' 09:45', ['fiscalization', 'regulation', 'keynote']],
            [$event1, 'Cloud POS Architecture', 'Modern cloud-based POS architectures.', 'John Smith', 'Room A', 'presentation', $d1 . ' 10:00', $d1 . ' 10:45', ['cloud', 'pos', 'microservices', 'api']],
            [$event1, 'Fiscal Compliance Across EU', 'Overview of fiscal compliance in EU markets.', 'Anna Mueller', 'Room B', 'presentation', $d1 . ' 10:00', $d1 . ' 10:45', ['fiscalization', 'compliance', 'regulation']],
            [$event1, 'Coffee Break & Networking', 'Connect with other attendees.', '', 'Lobby', 'networking', $d1 . ' 10:45', $d1 . ' 11:15', ['networking', 'coffee']],
            [$event1, 'AI in Retail', 'AI applications in retail operations.', 'Sarah Johnson', 'Main Hall', 'presentation', $d1 . ' 11:15', $d1 . ' 12:00', ['ai', 'retail', 'automation']],
            [$event1, 'Mobile POS Workshop', 'Hands-on mobile POS development.', 'Milan Jovanovic', 'Room A', 'workshop', $d1 . ' 11:15', $d1 . ' 12:30', ['mobile', 'pos', 'android']],
            [$event1, 'Panel: Future of Payments', 'Experts discuss payment trends.', 'Thomas Weber', 'Main Hall', 'discussion', $d1 . ' 13:30', $d1 . ' 14:30', ['payments', 'pos', 'security']],
            [$event1, 'Expert Consultations', 'One-on-one with Fiscal Solutions experts.', 'Fiscal Solutions Team', 'Consultation Area', 'consultation', $d1 . ' 15:45', $d1 . ' 17:00', ['consultation', 'fiscalization']],
            [$event1, 'Evening Cocktail', 'Informal networking event.', '', 'Terrace', 'social', $d1 . ' 18:00', $d1 . ' 22:00', ['networking', 'social']],

            // Fiscal Tech Summit - tags: fiscalization, compliance, regulation
            [$event2, 'EU Fiscal Directives 2026', 'Latest EU fiscal regulations and implications.', 'Anna Mueller', 'Main Hall', 'presentation', '2026-04-10 09:00', '2026-04-10 10:00', ['fiscalization', 'regulation', 'eu']],
            [$event2, 'Compliance Automation', 'Automating fiscal compliance workflows.', 'Pierre Dupont', 'Room A', 'workshop', '2026-04-10 10:30', '2026-04-10 12:00', ['compliance', 'automation', 'api']],
            [$event2, 'Multi-Country Fiscal Setup', 'Managing fiscal requirements across borders.', 'Luca Rossi', 'Room B', 'presentation', '2026-04-10 10:30', '2026-04-10 11:30', ['fiscalization', 'compliance', 'regulation']],
            [$event2, 'Q&A with Regulators', 'Direct questions to regulatory experts.', 'Panel', 'Main Hall', 'discussion', '2026-04-10 14:00', '2026-04-10 15:30', ['regulation', 'compliance']],

            // Retail Innovation Day - tags: retail, ai, ux, design
            [$event3, 'Retail Trends 2026', 'Key trends shaping retail technology.', 'Sarah Johnson', 'Main Hall', 'presentation', '2026-05-22 09:00', '2026-05-22 09:45', ['retail', 'trends', 'innovation']],
            [$event3, 'UX for Retail Software', 'Designing intuitive POS interfaces.', 'Katarina Novak', 'Room A', 'presentation', '2026-05-22 10:00', '2026-05-22 10:45', ['ux', 'design', 'retail']],
            [$event3, 'Data Analytics for Retail', 'Leveraging data for business intelligence.', 'Elena Vasic', 'Room B', 'workshop', '2026-05-22 10:00', '2026-05-22 11:30', ['data', 'analytics', 'retail']],
            [$event3, 'AI-Powered Personalization', 'Using AI for customer experience.', 'Sarah Johnson', 'Main Hall', 'presentation', '2026-05-22 13:00', '2026-05-22 13:45', ['ai', 'retail', 'personalization']],

            // API & Integration Workshop - tags: api, integration, cloud
            [$event4, 'REST API Best Practices', 'Building robust fiscal APIs.', 'John Smith', 'Online', 'presentation', '2026-06-05 10:00', '2026-06-05 11:00', ['api', 'rest', 'integration']],
            [$event4, 'ERP Integration Patterns', 'Integrating with SAP, Oracle, and custom ERPs.', 'Pierre Dupont', 'Online', 'workshop', '2026-06-05 11:30', '2026-06-05 13:00', ['integration', 'erp', 'api']],
            [$event4, 'Webhook & Event-Driven Architecture', 'Real-time sync and webhooks.', 'Aleksandar Djordjevic', 'Online', 'presentation', '2026-06-05 14:00', '2026-06-05 14:45', ['api', 'webhooks', 'cloud']],
        ];

        foreach ($sessionsData as $data) {
            $session = new Session();
            $session->setEvent($data[0]);
            $session->setTitle($data[1]);
            $session->setDescription($data[2]);
            $session->setSpeaker($data[3]);
            $session->setLocation($data[4]);
            $session->setCategory($data[5]);
            $session->setStartsAt(new \DateTime($data[6]));
            $session->setEndsAt(new \DateTime($data[7]));
            $session->setTags($data[8]);
            $session->setIsOptional(true);
            $manager->persist($session);
        }
    }

    /** @return array<array{user: User, event: Event}> */
    private function loadEventRegistrations(ObjectManager $manager, array $events, array $users): array
    {
        $communityDay = $events[0];
        $posWorkshop2025 = $events[4]; // Closed event for testing
        $emailsForCommunityDay = ['admin@community.day', 'marko@example.com', 'anna@example.com', 'pierre@example.com', 'elena@example.com', 'sarah@example.com', 'milan@example.com', 'katarina@example.com', 'ivana@example.com', 'alex@example.com'];
        $emailsForPosWorkshop = ['marko@example.com', 'anna@example.com', 'john@example.com', 'elena@example.com', 'milan@example.com', 'thomas@example.com', 'ivana@example.com', 'alex@example.com'];
        $attendedPosWorkshop = ['marko@example.com', 'anna@example.com', 'john@example.com', 'elena@example.com', 'milan@example.com'];
        $noShowPosWorkshop = ['thomas@example.com', 'ivana@example.com'];

        $eventRegs = [];

        foreach ($users as $i => $user) {
            $reg = new EventRegistration();
            $event = in_array($user->getEmail(), $emailsForCommunityDay) ? $communityDay : $events[$i % count($events)];
            $reg->setUser($user);
            $reg->setEvent($event);
            $manager->persist($reg);
            $eventRegs[] = ['user' => $user, 'event' => $event];
        }

        // Add registrations for closed event (POS Workshop 2025) with attendance data - only for users NOT already assigned to it
        foreach ($users as $i => $user) {
            if (!in_array($user->getEmail(), $emailsForPosWorkshop)) {
                continue;
            }
            $assignedEvent = in_array($user->getEmail(), $emailsForCommunityDay) ? $communityDay : $events[$i % count($events)];
            if ($assignedEvent === $posWorkshop2025) {
                continue; // Already registered for posWorkshop in first loop
            }
            $reg = new EventRegistration();
            $reg->setUser($user);
            $reg->setEvent($posWorkshop2025);
            if (in_array($user->getEmail(), $attendedPosWorkshop)) {
                $reg->setAttended(true);
            } elseif (in_array($user->getEmail(), $noShowPosWorkshop)) {
                $reg->setAttended(false);
            }
            $manager->persist($reg);
            $eventRegs[] = ['user' => $user, 'event' => $posWorkshop2025];
        }

        return $eventRegs;
    }

    /** Give each event participant some sessions in their schedule (session_registrations). */
    private function loadSessionRegistrations(ObjectManager $manager, array $eventRegs): void
    {
        $sessionRepo = $manager->getRepository(Session::class);

        foreach ($eventRegs as ['user' => $user, 'event' => $event]) {
            $sessions = $sessionRepo->findBy(['event' => $event], ['startsAt' => 'ASC']);
            if (empty($sessions)) {
                continue;
            }
            // Add first 3-5 sessions to each participant's schedule so "My Schedule" is not empty
            $count = min(4, count($sessions));
            for ($i = 0; $i < $count; $i++) {
                $sr = new SessionRegistration();
                $sr->setUser($user);
                $sr->setSession($sessions[$i]);
                $manager->persist($sr);
            }
        }
    }

    private function loadNotifications(ObjectManager $manager, array $events): void
    {
        $communityDay = $events[0];
        $notificationsData = [
            ['title' => 'Welcome to Community Day!', 'content' => 'Check the agenda to plan your day.', 'type' => 'info', 'priority' => 'normal', 'event' => $communityDay],
            ['title' => 'Wi-Fi Information', 'content' => 'Network: CommunityDay2026 | Password: fiscal2026', 'type' => 'info', 'priority' => 'normal', 'event' => $communityDay],
            ['title' => 'Room Change', 'content' => 'The Mobile POS Workshop has been moved to Room A.', 'type' => 'alert', 'priority' => 'high', 'event' => $communityDay],
        ];

        foreach ($notificationsData as $data) {
            $notification = new Notification();
            $notification->setTitle($data['title']);
            $notification->setContent($data['content']);
            $notification->setType($data['type']);
            $notification->setPriority($data['priority']);
            $notification->setEvent($data['event']);
            $manager->persist($notification);
        }
    }

    private function loadConnections(ObjectManager $manager, array $users): void
    {
        if (count($users) < 5) return;

        $cr1 = new ConnectionRequest();
        $cr1->setSender($users[1]);
        $cr1->setReceiver($users[3]);
        $cr1->setMessage('Hi John! Would love to discuss cloud POS.');
        $cr1->accept();
        $manager->persist($cr1);

        $cr2 = new ConnectionRequest();
        $cr2->setSender($users[2]);
        $cr2->setReceiver($users[4]);
        $cr2->setMessage('Let\'s discuss fiscal data analytics!');
        $manager->persist($cr2);

        $cr3 = new ConnectionRequest();
        $cr3->setSender($users[6]);
        $cr3->setReceiver($users[8]);
        $cr3->setMessage('Your UX work is amazing!');
        $cr3->accept();
        $manager->persist($cr3);
    }
}
