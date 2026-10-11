<?php

namespace App\Actions\Enrollment;

use App\Models\Enrollment;
use Barryvdh\DomPDF\Facade\Pdf;
use Barryvdh\DomPDF\PDF as RegistrationFormPdf;
use Illuminate\Support\Str;

/**
 * The registration form a family receives once their application is
 * approved: who is enrolled, in which grade and subjects, and what they'll
 * pay and when. Built as a PDF for the approval email and for downloading
 * from the portal or the admin panel.
 */
class GenerateRegistrationForm
{
    private const STUDENT_TYPES = [
        'NO_LRN' => 'New student (no LRN yet)',
        'WITH_LRN' => 'New student (transferee)',
        'RETURNEE' => 'Returning student',
    ];

    private const SESSIONS = [
        'MORNING_SESSION' => 'Morning session',
        'AFTERNOON_SESSION' => 'Afternoon session',
        'SCHOOL_SERVICE' => 'School service',
    ];

    /** Pixels; plenty for the 56px-wide logo to print sharply. */
    private const LOGO_SIZE = 200;

    private const PAYMENT_OPTIONS = [
        'FULL_PAYMENT' => 'Full payment',
        'BI_MONTHLY' => 'Bi-monthly (5 installments)',
        'MONTHLY' => 'Monthly (10 installments)',
    ];

    public function handle(Enrollment $enrollment): RegistrationFormPdf
    {
        return Pdf::loadView('pdf.registration-form', $this->viewData($enrollment))
            ->setPaper('a4')
            // Embeds only the letters used instead of the whole font, so
            // the email attachment stays small.
            ->setOption('isFontSubsettingEnabled', true);
    }

    /**
     * Everything the registration form shows.
     *
     * @return array<string, mixed>
     */
    public function viewData(Enrollment $enrollment): array
    {
        $enrollment->loadMissing([
            'student.address',
            'student.parentProfile',
            'gradeLevel',
            'subjects' => fn ($subjects) => $subjects->orderBy('name'),
            'billingContract.installments' => fn ($installments) => $installments->orderBy('installment_number'),
        ]);

        return [
            'enrollment' => $enrollment,
            'student' => $enrollment->student,
            'address' => $enrollment->student->address,
            'parents' => $enrollment->student->parentProfile,
            'billingContract' => $enrollment->billingContract,
            'curriculum' => $enrollment->gradeLevel->curriculumFor($enrollment->school_year),
            'studentType' => self::STUDENT_TYPES[$enrollment->student_type],
            'session' => self::SESSIONS[$enrollment->session_time_preference],
            'paymentOption' => self::PAYMENT_OPTIONS[$enrollment->billingContract?->payment_option] ?? null,
            'logo' => $this->logoDataUri(),
            'issuedOn' => now('Asia/Manila'),
        ];
    }

    /**
     * e.g. "registration-form-2026-2027-dela-cruz-juan.pdf"
     */
    public function filename(Enrollment $enrollment): string
    {
        $enrollment->loadMissing('student');

        return 'registration-form-'.Str::slug("{$enrollment->school_year} {$enrollment->student->last_name} {$enrollment->student->first_name}").'.pdf';
    }

    /**
     * Embedded so the PDF renderer never has to fetch it over the network,
     * and scaled down from the 1000px original, which would otherwise make
     * up most of the attachment's size.
     */
    private function logoDataUri(): ?string
    {
        $path = public_path('images/logoevims.png');
        $original = is_file($path) ? imagecreatefrompng($path) : false;

        if ($original === false) {
            return null;
        }

        $logo = imagescale($original, self::LOGO_SIZE, self::LOGO_SIZE, IMG_BICUBIC);

        if ($logo === false) {
            return null;
        }

        imagealphablending($logo, false);
        imagesavealpha($logo, true);

        ob_start();
        imagepng($logo, null, 9);

        return 'data:image/png;base64,'.base64_encode((string) ob_get_clean());
    }
}
