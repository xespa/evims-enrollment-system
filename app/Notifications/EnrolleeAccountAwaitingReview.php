<?php

namespace App\Notifications;

use App\Models\EnrolleeUser;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

/**
 * Tells the admins a portal account is ready to be approved: a new one
 * whose email was just confirmed, or one that sent a new ID or registered
 * again after being rejected.
 */
class EnrolleeAccountAwaitingReview extends Notification implements ShouldQueue
{
    use Queueable;

    public const TYPE = 'account_awaiting_review';

    public function __construct(public EnrolleeUser $enrollee, public bool $isResubmission = false) {}

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
        return [
            'type' => self::TYPE,
            'enrollee_user_id' => $this->enrollee->id,
            'title' => $this->isResubmission ? 'Account sent for review again' : 'New account to review',
            'message' => $this->isResubmission
                ? "{$this->enrollee->name} sent a new ID for their portal account."
                : "{$this->enrollee->name} registered a portal account and confirmed their email.",
            'url' => route('admin.enrollee-accounts.index', [], false),
        ];
    }
}
