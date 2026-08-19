<?php

namespace App\Mail;

use App\Models\Enrollment;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\URL;

class EnrollmentStatusUpdated extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Enrollment $enrollment) {}

    public function build(): self
    {
        $this->enrollment->loadMissing('student', 'gradeLevel');

        return $this->subject($this->subjectLine())
            ->markdown('emails.enrollment-status', [
                'enrollment' => $this->enrollment,
                'student' => $this->enrollment->student,
                'gradeLevel' => $this->enrollment->gradeLevel,
                'status' => $this->enrollment->enrollment_status,
                'paymentUrl' => $this->enrollment->enrollment_status === 'APPROVED'
                    ? URL::signedRoute('payments.show', $this->enrollment->id)
                    : null,
            ]);
    }

    protected function subjectLine(): string
    {
        return match ($this->enrollment->enrollment_status) {
            'APPROVED' => 'Your Enrollment Application Has Been Approved',
            'REJECTED' => 'Update on Your Enrollment Application',
            default => 'Enrollment Application Update',
        };
    }
}
