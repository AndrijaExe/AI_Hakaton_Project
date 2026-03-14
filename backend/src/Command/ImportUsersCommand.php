<?php

namespace App\Command;

use App\Adapter\Out\Persistence\Doctrine\Repository\UserRepository;
use App\Model\User\Entity\User;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

#[AsCommand(
    name: 'app:import-users',
    description: 'Import users from a CSV file',
)]
class ImportUsersCommand extends Command
{
    public function __construct(
        private UserRepository $userRepo,
        private UserPasswordHasherInterface $hasher,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addArgument('file', InputArgument::REQUIRED, 'Path to the CSV file');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $filePath = $input->getArgument('file');

        if (!file_exists($filePath)) {
            $io->error("File not found: {$filePath}");
            return Command::FAILURE;
        }

        $handle = fopen($filePath, 'r');
        $header = fgetcsv($handle);

        if (!$header) {
            $io->error('Empty CSV file');
            return Command::FAILURE;
        }

        $header = array_map('trim', $header);
        $imported = 0;
        $skipped = 0;

        while (($row = fgetcsv($handle)) !== false) {
            $data = array_combine($header, array_map('trim', $row));

            $existing = $this->userRepo->findOneBy(['email' => $data['email'] ?? '']);
            if ($existing) {
                $skipped++;
                continue;
            }

            $user = new User();
            $user->setEmail($data['email'] ?? '');
            $user->setFirstName($data['firstName'] ?? $data['first_name'] ?? '');
            $user->setLastName($data['lastName'] ?? $data['last_name'] ?? '');
            $user->setCompany($data['company'] ?? null);
            $user->setPosition($data['position'] ?? null);
            $user->setCountry($data['country'] ?? null);
            $user->setBio($data['bio'] ?? null);
            $user->setPhone($data['phone'] ?? null);
            $user->setLinkedin($data['linkedin'] ?? null);

            $interests = $data['interests'] ?? '';
            $user->setInterests(array_filter(array_map('trim', explode(';', $interests))));

            $roles = [];
            if (!empty($data['role']) && $data['role'] === 'admin') {
                $roles[] = 'ROLE_ADMIN';
            }
            $user->setRoles($roles);

            $password = $data['password'] ?? 'community2026';
            $user->setPassword($this->hasher->hashPassword($user, $password));

            $this->userRepo->save($user, false);
            $imported++;
        }

        fclose($handle);
        $this->userRepo->getEntityManager()->flush();

        $io->success("Imported {$imported} users, skipped {$skipped} duplicates.");

        return Command::SUCCESS;
    }
}
