<?php

namespace App\Notifications;

use App\Models\EnrolleeUser;
use Illuminate\Notifications\Notification;

/**
 * A bell reminder, sent on registration, to confirm the account's email.
 * It's marked read once the email is confirmed.
 */
class ConfirmEmailReminder extends Notification
{
    public const TYPE = 'confirm_email';

    /**
     * @return array<int, string>
     */
    public function via(EnrolleeUser $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(EnrolleeUser $notifiable): array
    {
        return [
            'type' => self::TYPE,
            'title' => 'Confirm your email',
            'message' => "We sent a link to {$notifiable->email}. Open it to finish setting up your account.",
            'url' => route('portal.verification.notice', absolute: false),
        ];
    }
}
