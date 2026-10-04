<?php

namespace App\Notifications;

use App\Models\DocumentAppointment;
use App\Models\Enrollment;
use Illuminate\Notifications\Notification;

/**
 * Tells the parent when to bring documents to the registrar's office.
 * Sent again, with the new date, when the appointment is rescheduled.
 */
class DocumentAppointmentScheduled extends Notification
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
        $documents = implode(', ', $this->appointment->documentLabels());

        $message = "Please bring {$student->first_name}'s {$documents} to the registrar's office on {$this->appointment->formattedSchedule()}.";

        if ($this->appointment->note) {
            $message .= " Note from the registrar: \"{$this->appointment->note}\"";
        }

        return [
            'type' => 'document_appointment',
            'enrollment_id' => $this->enrollment->id,
            'student_name' => trim("{$student->first_name} {$student->last_name}"),
            'scheduled_on' => $this->appointment->scheduled_on->toDateString(),
            'scheduled_time' => $this->appointment->scheduled_time,
            'documents' => $this->appointment->documentLabels(),
            'note' => $this->appointment->note,
            'title' => 'Bring documents to school',
            'message' => $message,
            'url' => '/portal/dashboard',
        ];
    }
}
