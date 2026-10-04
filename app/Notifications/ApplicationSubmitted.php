<?php

namespace App\Notifications;

use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

/**
 * Tells the admins a parent submitted an admission application to review.
 */
class ApplicationSubmitted extends Notification implements ShouldQueue
{
    use Queueable;

    public const TYPE = 'application_submitted';

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
        $this->enrollment->loadMissing('student', 'gradeLevel');
        $student = $this->enrollment->student;

        return [
            'type' => self::TYPE,
            'enrollment_id' => $this->enrollment->id,
            'student_name' => trim("{$student->first_name} {$student->last_name}"),
            'title' => 'New application',
            'message' => "{$student->first_name} {$student->last_name} applied for {$this->enrollment->gradeLevel->name}, S.Y. {$this->enrollment->school_year}.",
            'url' => route('admin.enrollments.show', $this->enrollment, false),
        ];
    }
}
