<?php

namespace App\Adapter\Out\Ai;

use Symfony\Contracts\HttpClient\HttpClientInterface;

class OpenAiAdapter
{
    private string $openAiKey;
    private string $groqKey;

    public function __construct(
        private HttpClientInterface $httpClient,
    ) {
        $this->openAiKey = $_ENV['OPENAI_API_KEY'] ?? '';
        $this->groqKey = $_ENV['GROQ_API_KEY'] ?? '';
    }

    private function hasAiKey(): bool
    {
        return !empty($this->groqKey) || !empty($this->openAiKey);
    }

    public function recommendSessions(array $userProfile, array $sessions): array
    {
        if (!$this->hasAiKey()) {
            return $this->fallbackSessionRecommendations($userProfile, $sessions);
        }

        $prompt = $this->buildSessionPrompt($userProfile, $sessions);

        try {
            return $this->callAi($prompt);
        } catch (\Throwable $e) {
            return $this->fallbackSessionRecommendations($userProfile, $sessions);
        }
    }

    public function recommendEvents(array $userProfile, array $events): array
    {
        if (!$this->hasAiKey()) {
            return $this->fallbackEventRecommendations($userProfile, $events);
        }

        $prompt = $this->buildEventPrompt($userProfile, $events);

        try {
            return $this->callAi($prompt);
        } catch (\Throwable $e) {
            return $this->fallbackEventRecommendations($userProfile, $events);
        }
    }

    public function recommendPeople(array $userProfile, array $people): array
    {
        if (!$this->hasAiKey()) {
            return $this->fallbackPeopleRecommendations($userProfile, $people);
        }

        $prompt = $this->buildPeoplePrompt($userProfile, $people);

        try {
            return $this->callAi($prompt);
        } catch (\Throwable $e) {
            return $this->fallbackPeopleRecommendations($userProfile, $people);
        }
    }

    private function callAi(string $prompt): array
    {
        if (!empty($this->groqKey)) {
            return $this->callGroq($prompt);
        }
        return $this->callOpenAi($prompt);
    }

    private function callGroq(string $prompt): array
    {
        $response = $this->httpClient->request('POST', 'https://api.groq.com/openai/v1/chat/completions', [
            'headers' => [
                'Authorization' => 'Bearer ' . $this->groqKey,
                'Content-Type' => 'application/json',
            ],
            'json' => [
                'model' => 'llama-3.1-8b-instant',
                'messages' => [
                    ['role' => 'system', 'content' => 'You are a conference assistant. Respond with valid JSON only.'],
                    ['role' => 'user', 'content' => $prompt],
                ],
                'temperature' => 0.7,
                'max_tokens' => 1000,
            ],
        ]);

        $data = $response->toArray();
        $content = $data['choices'][0]['message']['content'] ?? '[]';

        return json_decode($content, true) ?? [];
    }

    private function callOpenAi(string $prompt): array
    {
        $response = $this->httpClient->request('POST', 'https://api.openai.com/v1/chat/completions', [
            'headers' => [
                'Authorization' => 'Bearer ' . $this->openAiKey,
                'Content-Type' => 'application/json',
            ],
            'json' => [
                'model' => 'gpt-3.5-turbo',
                'messages' => [
                    ['role' => 'system', 'content' => 'You are a conference assistant. Respond with valid JSON only.'],
                    ['role' => 'user', 'content' => $prompt],
                ],
                'temperature' => 0.7,
                'max_tokens' => 1000,
            ],
        ]);

        $data = $response->toArray();
        $content = $data['choices'][0]['message']['content'] ?? '[]';

        return json_decode($content, true) ?? [];
    }

    private function buildSessionPrompt(array $user, array $sessions): string
    {
        $userJson = json_encode([
            'interests' => $user['interests'],
            'position' => $user['position'],
            'company' => $user['company'],
        ]);

        $sessionsJson = json_encode(array_map(fn($s) => [
            'id' => $s['id'],
            'title' => $s['title'],
            'description' => $s['description'],
            'category' => $s['category'],
            'tags' => $s['tags'],
        ], $sessions));

        return "Given this attendee profile: {$userJson}\n\nAnd these conference sessions: {$sessionsJson}\n\nRecommend the top 5 most relevant sessions. Return a JSON array of objects with: id, title, reason (brief explanation why this is relevant).";
    }

    private function buildEventPrompt(array $user, array $events): string
    {
        $userJson = json_encode([
            'interests' => $user['interests'],
            'position' => $user['position'],
            'company' => $user['company'],
        ]);

        $eventsJson = json_encode(array_map(fn($e) => [
            'id' => $e['id'],
            'name' => $e['name'],
            'description' => $e['description'],
            'tags' => $e['tags'] ?? [],
        ], $events));

        return "Given this attendee profile: {$userJson}\n\nAnd these conference events: {$eventsJson}\n\nRecommend the top 5 most relevant events. Return a JSON array of objects with: id, name (use as title), reason (brief explanation why this event is relevant).";
    }

    private function buildPeoplePrompt(array $user, array $people): string
    {
        $userJson = json_encode([
            'interests' => $user['interests'],
            'position' => $user['position'],
            'company' => $user['company'],
        ]);

        $peopleJson = json_encode(array_map(fn($p) => [
            'id' => $p['id'],
            'fullName' => $p['fullName'],
            'position' => $p['position'],
            'company' => $p['company'],
            'interests' => $p['interests'],
        ], $people));

        return "Given this attendee profile: {$userJson}\n\nAnd these other attendees: {$peopleJson}\n\nRecommend the top 5 people they should network with. Return a JSON array of objects with: id, fullName, reason (brief explanation of networking value).";
    }

    /**
     * Tag-based matching fallback for events when no API key is configured.
     */
    private function fallbackEventRecommendations(array $user, array $events): array
    {
        $interests = array_map('strtolower', $user['interests'] ?? []);
        $scored = [];

        foreach ($events as $event) {
            $tags = array_map('strtolower', $event['tags'] ?? []);
            $overlap = array_intersect($interests, $tags);
            $score = count($overlap);

            if ($score > 0) {
                $scored[] = [
                    'id' => $event['id'],
                    'name' => $event['name'],
                    'reason' => 'Matches your interests: ' . implode(', ', $overlap),
                    'score' => $score,
                ];
            }
        }

        usort($scored, fn($a, $b) => $b['score'] - $a['score']);
        $top = array_slice($scored, 0, 5);

        return array_map(function ($item) {
            unset($item['score']);
            $item['title'] = $item['name'];
            unset($item['name']);
            return $item;
        }, $top);
    }

    /**
     * Tag-based matching fallback when no API key is configured.
     */
    private function fallbackSessionRecommendations(array $user, array $sessions): array
    {
        $interests = array_map('strtolower', $user['interests'] ?? []);
        $scored = [];

        foreach ($sessions as $session) {
            $tags = array_map('strtolower', $session['tags'] ?? []);
            $overlap = array_intersect($interests, $tags);
            $score = count($overlap);

            if ($score > 0) {
                $scored[] = [
                    'id' => $session['id'],
                    'title' => $session['title'],
                    'reason' => 'Matches your interests: ' . implode(', ', $overlap),
                    'score' => $score,
                ];
            }
        }

        usort($scored, fn($a, $b) => $b['score'] - $a['score']);
        $top = array_slice($scored, 0, 5);

        return array_map(function ($item) {
            unset($item['score']);
            return $item;
        }, $top);
    }

    public function recommendCateringMenu(array $dietaryStats, array $allergyStats, int $totalAttendees): array
    {
        if ($this->hasAiKey()) {
            $prompt = $this->buildCateringPrompt($dietaryStats, $allergyStats, $totalAttendees);
            try {
                return $this->callAi($prompt);
            } catch (\Throwable $e) {
                // fall through
            }
        }

        return $this->fallbackCateringMenu($dietaryStats, $allergyStats, $totalAttendees);
    }

    private function buildCateringPrompt(array $dietaryStats, array $allergyStats, int $total): string
    {
        $dietJson = json_encode($dietaryStats);
        $allergyJson = json_encode($allergyStats);

        return <<<PROMPT
You are a professional event catering planner. We have a conference with {$total} attendees.

Dietary preferences breakdown: {$dietJson}
Allergy breakdown: {$allergyJson}

Plan a buffet-style (Swedish table) catering menu with multiple stations so that every attendee can eat safely.
Return a JSON array of station objects, each with:
- "station": station name
- "description": brief description of this station's purpose
- "dishes": array of dish objects with "name" and "tags" (array of dietary labels like "vegan", "gluten-free", "halal" etc.)

Include 3-5 stations covering: main dishes, vegetarian/vegan options, halal-friendly options, allergen-free options, and desserts.
Make sure every dietary group has at least 2-3 dishes they can eat.
Return ONLY valid JSON array, no other text.
PROMPT;
    }

    private function fallbackCateringMenu(array $dietaryStats, array $allergyStats, int $total): array
    {
        $stations = [];

        $stations[] = [
            'station' => 'Station 1: Main Dishes',
            'description' => 'Hearty main courses for all attendees',
            'dishes' => [
                ['name' => 'Grilled Chicken Breast with Herbs', 'tags' => ['gluten-free', 'halal']],
                ['name' => 'Beef Tenderloin with Red Wine Sauce', 'tags' => ['gluten-free']],
                ['name' => 'Baked Salmon with Lemon Dill', 'tags' => ['gluten-free', 'halal']],
                ['name' => 'Rice Pilaf', 'tags' => ['vegan', 'gluten-free', 'halal', 'kosher']],
            ],
        ];

        $stations[] = [
            'station' => 'Station 2: Vegetarian & Vegan',
            'description' => 'Plant-based options for vegetarian and vegan attendees',
            'dishes' => [
                ['name' => 'Grilled Vegetable Lasagna', 'tags' => ['vegetarian']],
                ['name' => 'Chickpea & Sweet Potato Curry', 'tags' => ['vegan', 'gluten-free', 'halal']],
                ['name' => 'Mediterranean Quinoa Bowl', 'tags' => ['vegan', 'gluten-free']],
                ['name' => 'Stuffed Bell Peppers with Rice & Beans', 'tags' => ['vegan', 'gluten-free', 'halal']],
            ],
        ];

        if (!empty($dietaryStats['halal']) || !empty($dietaryStats['kosher'])) {
            $stations[] = [
                'station' => 'Station 3: Halal & Kosher',
                'description' => 'Certified halal and kosher-friendly options',
                'dishes' => [
                    ['name' => 'Lamb Kofta with Yogurt Sauce', 'tags' => ['halal', 'gluten-free']],
                    ['name' => 'Chicken Shawarma Plate', 'tags' => ['halal']],
                    ['name' => 'Falafel with Hummus & Pita', 'tags' => ['vegan', 'halal', 'kosher']],
                    ['name' => 'Tabbouleh Salad', 'tags' => ['vegan', 'halal', 'kosher']],
                ],
            ];
        }

        $stations[] = [
            'station' => 'Station ' . (count($stations) + 1) . ': Salads & Sides',
            'description' => 'Fresh salads and side dishes, allergen-conscious',
            'dishes' => [
                ['name' => 'Mixed Green Salad', 'tags' => ['vegan', 'gluten-free', 'nut-free', 'halal']],
                ['name' => 'Roasted Root Vegetables', 'tags' => ['vegan', 'gluten-free', 'nut-free', 'halal']],
                ['name' => 'Fresh Fruit Platter', 'tags' => ['vegan', 'gluten-free', 'nut-free', 'halal', 'kosher']],
                ['name' => 'Gluten-Free Bread Basket', 'tags' => ['vegan', 'gluten-free', 'nut-free']],
            ],
        ];

        $stations[] = [
            'station' => 'Station ' . (count($stations) + 1) . ': Desserts',
            'description' => 'Sweet treats for every dietary need',
            'dishes' => [
                ['name' => 'Dark Chocolate Mousse', 'tags' => ['gluten-free', 'vegetarian']],
                ['name' => 'Fresh Berry Sorbet', 'tags' => ['vegan', 'gluten-free', 'nut-free', 'halal']],
                ['name' => 'Baklava', 'tags' => ['vegetarian', 'halal']],
                ['name' => 'Coconut Chia Pudding', 'tags' => ['vegan', 'gluten-free', 'nut-free']],
            ],
        ];

        return $stations;
    }

    private function fallbackPeopleRecommendations(array $user, array $people): array
    {
        $interests = array_map('strtolower', $user['interests'] ?? []);
        $scored = [];

        foreach ($people as $person) {
            $theirInterests = array_map('strtolower', $person['interests'] ?? []);
            $overlap = array_intersect($interests, $theirInterests);
            $score = count($overlap);

            if ($score > 0) {
                $scored[] = [
                    'id' => $person['id'],
                    'fullName' => $person['fullName'],
                    'reason' => 'Shared interests: ' . implode(', ', $overlap),
                    'score' => $score,
                ];
            }
        }

        usort($scored, fn($a, $b) => $b['score'] - $a['score']);
        $top = array_slice($scored, 0, 5);

        return array_map(function ($item) {
            unset($item['score']);
            return $item;
        }, $top);
    }
}
