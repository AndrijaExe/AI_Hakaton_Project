<?php

namespace App\Adapter\In\Http\Controller;

use App\Adapter\Out\Persistence\Doctrine\Repository\EventRegistrationRepository;
use App\Adapter\Out\Persistence\Doctrine\Repository\EventRepository;
use App\Adapter\Out\Persistence\Doctrine\Repository\NotificationRepository;
use App\Model\Notification\Entity\Notification;
use App\Service\PdfGenerator;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\Routing\Attribute\Route;
use Twig\Environment;

#[Route('/api/admin')]
class AdminEventController extends AbstractController
{
    private const SUPPORTED_LANGUAGES = ['en', 'fr', 'de', 'es'];

    public function __construct(
        private EventRepository $eventRepo,
        private EventRegistrationRepository $eventRegRepo,
        private NotificationRepository $notificationRepo,
        private PdfGenerator $pdfGenerator,
        private MailerInterface $mailer,
        private Environment $twig,
    ) {}

    #[Route('/events/{id}/send-email', name: 'api_admin_events_send_email', methods: ['POST'])]
    public function sendEmailToEventParticipants(int $id, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $event = $this->eventRepo->find($id);
        if (!$event) {
            return $this->json(['error' => 'Event not found'], 404);
        }

        $data = json_decode($request->getContent(), true) ?: [];
        $message = $data['message'] ?? '';
        $subject = $data['subject'] ?? 'Community Day – Event Reminder';
        $attachPdf = (bool)($data['attachPdf'] ?? false);
        $busInfoSentence = $data['busInfoSentence'] ?? '';
        $sendNotification = (bool)($data['sendNotification'] ?? false);

        if (empty($message) && !$attachPdf) {
            return $this->json(['error' => 'Message or PDF attachment is required'], 400);
        }

        $registrations = $this->eventRegRepo->findByEvent($event);
        $hasRecipients = false;
        foreach ($registrations as $reg) {
            if ($reg->getUser()->getEmail()) {
                $hasRecipients = true;
                break;
            }
        }
        if (!$hasRecipients) {
            return $this->json(['error' => 'No participants with email addresses'], 400);
        }

        $defaultsByLang = [
            'en' => "This is a reminder about the upcoming Community Day event. We look forward to seeing you there.",
            'fr' => "Ceci est un rappel concernant le prochain événement Community Day. Nous avons hâte de vous y retrouver.",
            'de' => "Dies ist eine Erinnerung an die bevorstehende Community Day Veranstaltung. Wir freuen uns auf Ihr Kommen.",
            'es' => "Este es un recordatorio del próximo evento Community Day. Esperamos verle allí.",
        ];

        try {
            foreach ($registrations as $reg) {
                $user = $reg->getUser();
                $to = $user->getEmail();
                if (!$to) {
                    continue;
                }

                $lang = $this->resolveLanguage($user->getLanguage());
                $text = $message ?: ($defaultsByLang[$lang] ?? $defaultsByLang['en']);
                $messageHtml = $this->markdownToHtml($text);

                $body = $this->twig->render("email/reminder_{$lang}.html.twig", [
                    'messageHtml' => $messageHtml,
                ]);

                $email = (new Email())
                    ->from('noreply@communityday.local')
                    ->to($to)
                    ->subject($subject)
                    ->html($body);

                if ($attachPdf && !empty(trim($busInfoSentence))) {
                    $pdfContent = $this->pdfGenerator->generateTouristGuide(trim($busInfoSentence), $lang);
                    $email->attach($pdfContent, 'turisticki-vodic.pdf', 'application/pdf');
                }

                $this->mailer->send($email);
            }

            if ($sendNotification) {
                $content = trim($message) ?: 'Check your email for event details.';
                $content = preg_replace('/\*\*(.+?)\*\*/s', '$1', $content);
                $content = preg_replace('/\*(.+?)\*/s', '$1', $content);
                $content = strip_tags($content);
                $content = preg_replace('/\s+/', ' ', $content);
                $content = mb_substr($content, 0, 500);
                $notification = new Notification();
                $notification->setTitle($subject);
                $notification->setContent($content);
                $notification->setType('info');
                $notification->setPriority('normal');
                $this->notificationRepo->save($notification);
            }

            return $this->json([
                'message' => 'Email sent',
                'recipientCount' => count($registrations),
                'notificationCreated' => $sendNotification,
            ]);
        } catch (\Throwable $e) {
            return $this->json(['error' => 'Failed to send email: ' . $e->getMessage()], 500);
        }
    }

    #[Route('/events/{id}/send-notification', name: 'api_admin_events_send_notification', methods: ['POST'])]
    public function sendNotificationToEventParticipants(int $id, Request $request): JsonResponse
    {
        try {
            $this->denyAccessUnlessGranted('ROLE_ADMIN');

            $event = $this->eventRepo->find($id);
            if (!$event) {
                return $this->json(['error' => 'Event not found'], 404);
            }

            $status = $event->getComputedStatus();
            if ($status === 'completed') {
                return $this->json(['error' => 'Cannot send notifications for closed events'], 400);
            }

            $data = json_decode($request->getContent(), true) ?: [];
            $title = trim($data['title'] ?? 'Event update');
            $message = trim($data['message'] ?? '');
            $type = in_array($data['type'] ?? 'info', ['info', 'alert'], true) ? $data['type'] : 'info';

            if (empty($message)) {
                return $this->json(['error' => 'Message is required'], 400);
            }

            $registrations = $this->eventRegRepo->findByEvent($event);
            $content = $this->markdownToPlainText($message);

            foreach ($registrations as $reg) {
                $user = $reg->getUser();
                $notification = new Notification();
                $notification->setTitle($title);
                $notification->setContent($content);
                $notification->setType($type);
                $notification->setPriority('normal');
                $notification->setReceiver($user);
                $notification->setEvent($event);
                $this->notificationRepo->save($notification);
            }

            return $this->json([
                'message' => 'Notification sent',
                'recipientCount' => count($registrations),
            ]);
        } catch (\Throwable $e) {
            return $this->json(['error' => 'Failed to send notification: ' . $e->getMessage()], 500);
        }
    }

    #[Route('/pdf/generate', name: 'api_admin_pdf_generate', methods: ['POST'])]
    public function generatePdf(Request $request): Response
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $data = json_decode($request->getContent(), true) ?: [];
        $busInfoSentence = $data['busInfoSentence'] ?? '';

        if (empty(trim($busInfoSentence))) {
            return new JsonResponse(['error' => 'busInfoSentence is required'], 400);
        }

        $pdfContent = $this->pdfGenerator->generateTouristGuide(trim($busInfoSentence));

        return new Response($pdfContent, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="turisticki-vodic.pdf"',
        ]);
    }

    private function resolveLanguage(?string $language): string
    {
        if ($language && in_array($language, self::SUPPORTED_LANGUAGES, true)) {
            return $language;
        }
        return 'en';
    }

    private function markdownToHtml(string $markdown): string
    {
        $html = htmlspecialchars($markdown, ENT_QUOTES, 'UTF-8');
        $html = nl2br($html);
        $html = preg_replace('/\*\*(.+?)\*\*/s', '<strong>$1</strong>', $html);
        $html = preg_replace('/\*(.+?)\*/s', '<em>$1</em>', $html);
        return $html;
    }

    private function markdownToPlainText(string $markdown): string
    {
        $text = preg_replace('/\*\*(.+?)\*\*/s', '$1', $markdown);
        $text = preg_replace('/\*(.+?)\*/s', '$1', $text);
        $text = strip_tags($text);
        $text = preg_replace('/[ \t]+/', ' ', $text);
        return trim($text);
    }
}
