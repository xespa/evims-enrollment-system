<?php

namespace App\Notifications;

use App\Models\DocumentAppointment;
use App\Models\Enrollment;
use Illuminate\Notifications\Notification;

/**
 * Tells the parent they no longer need to come in on the appointment date.
 */
class DocumentAppointmentCancelled extends Notification
{
    public function __construct(
        public Enrollment $enrollment,
        public DocumentAppointment $appointment,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $student = $this->enrollment->student;

        return [
            'type' => 'document_appointment_cancelled',
            'enrollment_id' => $this->enrollment->id,
            'student_name' => trim("{$student->first_name} {$student->last_name}"),
            'title' => 'Appointment cancelled',
            'message' => "The appointment on {$this->appointment->formattedSchedule()} to bring {$student->first_name}'s documents was cancelled. You don't need to come in that day.",
            'url' => '/portal/dashboard',
        ];
    }
}
