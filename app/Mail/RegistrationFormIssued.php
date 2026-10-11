<?php

namespace App\Mail;

use App\Actions\Enrollment\GenerateRegistrationForm;
use App\Models\Enrollment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Sends the family their registration form as a PDF once the application
 * is approved. Queued, since rendering the PDF takes a moment.
 */
class RegistrationFormIssued extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public Enrollment $enrollment)
    {
        $this->afterCommit();
    }

    public function envelope(): Envelope
    {
        $this->enrollment->loadMissing('student');

        return new Envelope(
            subject: "Registration Form for {$this->enrollment->student->first_name} {$this->enrollment->student->last_name} (S.Y. {$this->enrollment->school_year})",
        );
    }

    public function content(): Content
    {
        $this->enrollment->loadMissing('student', 'gradeLevel');

        return new Content(
            markdown: 'emails.registration-form',
            with: [
                'enrollment' => $this->enrollment,
                'student' => $this->enrollment->student,
                'gradeLevel' => $this->enrollment->gradeLevel,
                'portalUrl' => route('portal.dashboard'),
            ],
        );
    }

    /**
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        $registrationForm = app(GenerateRegistrationForm::class);

        return [
            Attachment::fromData(
                fn () => $registrationForm->handle($this->enrollment)->output(),
                $registrationForm->filename($this->enrollment),
            )->withMime('application/pdf'),
        ];
    }
}
