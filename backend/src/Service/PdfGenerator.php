<?php

namespace App\Service;

use Dompdf\Dompdf;
use Dompdf\Options;
use Twig\Environment;

class PdfGenerator
{
    private const SUPPORTED_LANGUAGES = ['en', 'fr', 'de', 'es'];

    public function __construct(
        private Environment $twig,
    ) {}

    public function generateTouristGuide(string $busInfoSentence, ?string $language = 'en'): string
    {
        $lang = $this->resolveLanguage($language);
        $html = $this->twig->render("pdf/tourist_guide_{$lang}.html.twig", [
            'busInfo' => $busInfoSentence,
        ]);

        $options = new Options();
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isRemoteEnabled', false);
        $options->set('defaultFont', 'DejaVu Sans');

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        return $dompdf->output();
    }

    private function resolveLanguage(?string $language): string
    {
        if ($language && in_array($language, self::SUPPORTED_LANGUAGES, true)) {
            return $language;
        }
        return 'en';
    }
}
