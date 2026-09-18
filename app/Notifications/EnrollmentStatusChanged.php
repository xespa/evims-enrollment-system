<?php

namespace App\Notifications;

use App\Models\Enrollment;
use Illuminate\Notifications\Notification;

class EnrollmentStatusChanged extends Notification
{
    public function __construct(public Enrollment $enrollment) {}

    public function via($notifiable): array
    {
        return ['database'];
    }

    public function toArray($notifiable): array
    {
        $student = $this->enrollment->student;
        $status = $this->enrollment->enrollment_status;

        return [
            'type' => 'enrollment_status_changed',
            'enrollment_id' => $this->enrollment->id,
            'student_name' => trim("{$student->first_name} {$student->last_name}"),
            'status' => $status,
            'title' => match ($status) {
                'APPROVED' => 'Application approved',
                'REJECTED' => 'Application update',
                default => 'Application status updated',
            },
            'message' => match ($status) {
                'APPROVED' => "{$student->first_name}'s enrollment application has been approved. You can now proceed with payment.",
                'REJECTED' => "There's an update on {$student->first_name}'s enrollment application. Please check the details.",
                default => "{$student->first_name}'s enrollment application status changed to {$status}.",
            },
            'url' => '/portal/dashboard',
        ];
    }
}
