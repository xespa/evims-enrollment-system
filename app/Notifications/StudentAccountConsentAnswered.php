<?php

namespace App\Notifications;

use App\Enums\StudentAccountStatus;
use App\Models\StudentAccount;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

/**
 * Tells the admins a parent agreed to, or declined, a student account.
 */
class StudentAccountConsentAnswered extends Notification implements ShouldQueue
{
    use Queueable;

    public const TYPE = 'student_account_consent';

    public function __construct(public StudentAccount $account) {}

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
        $this->account->loadMissing('student');
        $student = $this->account->student;
        $name = trim("{$student->first_name} {$student->last_name}");
        $agreed = $this->account->status === StudentAccountStatus::ConsentGiven;

        return [
            'type' => self::TYPE,
            'status' => $this->account->status->value,
            'student_name' => $name,
            'title' => $agreed ? 'Student account ready to create' : 'Student account declined',
            'message' => $agreed
                ? "{$name}'s parent agreed. Create the account so the student can sign in."
                : "{$name}'s parent declined the student account.",
            'url' => route('admin.student-accounts.index', ['status' => $this->account->status->value], false),
        ];
    }
}
