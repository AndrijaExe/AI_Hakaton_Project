<?php

namespace App\Adapter\In\Http\Controller;

use App\Adapter\Out\Persistence\Doctrine\Repository\UserRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/users')]
class UserController extends AbstractController
{
    public function __construct(
        private UserRepository $userRepo,
    ) {}

    #[Route('', name: 'api_users_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $query = $request->query->get('q');

        $users = $query
            ? $this->userRepo->search($query)
            : $this->userRepo->findAll();

        $data = array_map(fn($u) => $u->toArray(), $users);

        return $this->json(['users' => $data]);
    }

    #[Route('/profile', name: 'api_users_update_profile', methods: ['PUT'])]
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $this->getUser();
        $data = json_decode($request->getContent(), true);

        $errors = $this->validateProfileData($data);
        if (!empty($errors)) {
            return $this->json(['errors' => $errors], 422);
        }

        $allowedFields = [
            'firstName', 'lastName', 'company', 'position', 'country',
            'bio', 'phone', 'linkedin', 'interests',
            'dietaryPreference', 'allergies', 'dietaryNotes', 'language',
        ];

        foreach ($allowedFields as $field) {
            if (!array_key_exists($field, $data)) {
                continue;
            }
            $setter = 'set' . ucfirst($field);
            if (method_exists($user, $setter)) {
                $user->$setter($data[$field]);
            }
        }

        $this->userRepo->save($user);

        return $this->json(['user' => $user->toArray()]);
    }

    #[Route('/similar', name: 'api_users_similar', methods: ['GET'])]
    public function similar(): JsonResponse
    {
        $currentUser = $this->getUser();
        $similar = $this->userRepo->findByInterests(
            $currentUser->getInterests(),
            $currentUser->getId()
        );

        $data = array_map(function ($u) use ($currentUser) {
            $arr = $u->toArray();
            $arr['commonInterests'] = array_values(
                array_intersect($u->getInterests(), $currentUser->getInterests())
            );
            return $arr;
        }, $similar);

        return $this->json(['users' => $data]);
    }

    #[Route('/{id}', name: 'api_users_detail', methods: ['GET'])]
    public function detail(int $id): JsonResponse
    {
        $user = $this->userRepo->find($id);
        if (!$user) {
            return $this->json(['error' => 'User not found'], 404);
        }

        return $this->json(['user' => $user->toArray()]);
    }

    private function validateProfileData(array $data): array
    {
        $errors = [];

        if (array_key_exists('firstName', $data)) {
            $v = trim($data['firstName'] ?? '');
            if (strlen($v) < 2) {
                $errors['firstName'] = 'First name must be at least 2 characters.';
            }
            if (strlen($v) > 100) {
                $errors['firstName'] = 'First name must be at most 100 characters.';
            }
        }

        if (array_key_exists('lastName', $data)) {
            $v = trim($data['lastName'] ?? '');
            if (strlen($v) < 2) {
                $errors['lastName'] = 'Last name must be at least 2 characters.';
            }
            if (strlen($v) > 100) {
                $errors['lastName'] = 'Last name must be at most 100 characters.';
            }
        }

        if (array_key_exists('company', $data) && $data['company'] !== null && strlen($data['company']) > 200) {
            $errors['company'] = 'Company must be at most 200 characters.';
        }

        if (array_key_exists('position', $data) && $data['position'] !== null && strlen($data['position']) > 150) {
            $errors['position'] = 'Position must be at most 150 characters.';
        }

        if (array_key_exists('country', $data) && $data['country'] !== null && strlen($data['country']) > 100) {
            $errors['country'] = 'Country must be at most 100 characters.';
        }

        if (array_key_exists('bio', $data) && $data['bio'] !== null && strlen($data['bio']) > 500) {
            $errors['bio'] = 'Bio must be at most 500 characters.';
        }

        if (array_key_exists('phone', $data) && $data['phone'] !== null && strlen($data['phone']) > 50) {
            $errors['phone'] = 'Phone must be at most 50 characters.';
        }

        if (array_key_exists('linkedin', $data) && $data['linkedin'] !== null) {
            if (strlen($data['linkedin']) > 255) {
                $errors['linkedin'] = 'LinkedIn URL must be at most 255 characters.';
            }
            if (!empty($data['linkedin']) && !filter_var($data['linkedin'], FILTER_VALIDATE_URL)) {
                $errors['linkedin'] = 'LinkedIn must be a valid URL.';
            }
        }

        if (array_key_exists('dietaryNotes', $data) && $data['dietaryNotes'] !== null && strlen($data['dietaryNotes']) > 300) {
            $errors['dietaryNotes'] = 'Dietary notes must be at most 300 characters.';
        }

        $validDiets = ['vegetarian', 'vegan', 'halal', 'kosher', 'other', null];
        if (array_key_exists('dietaryPreference', $data) && !in_array($data['dietaryPreference'], $validDiets, true)) {
            $errors['dietaryPreference'] = 'Invalid dietary preference.';
        }

        return $errors;
    }
}
