<?php

namespace App\Notifications;

use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

/**
 * Tells the admins a parent cancelled a pending application, so nobody
 * keeps reviewing it.
 */
class ApplicationCancelled extends Notification implements ShouldQueue
{
    use Queueable;

    public const TYPE = 'application_cancelled';

    public function __construct(public Enrollment $enrollment) {}

    /**
     * @return array<int, string>
     */
    public function via(User $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(User $notifiable): array
    {
        $this->enrollment->loadMissing('student');
        $student = $this->enrollment->student;

        return [
            'type' => self::TYPE,
            'enrollment_id' => $this->enrollment->id,
            'student_name' => trim("{$student->first_name} {$student->last_name}"),
            'title' => 'Application cancelled',
            'message' => "The parent cancelled {$student->first_name} {$student->last_name}'s application for S.Y. {$this->enrollment->school_year}.",
            'url' => route('admin.enrollments.show', $this->enrollment, false),
        ];
    }
}
