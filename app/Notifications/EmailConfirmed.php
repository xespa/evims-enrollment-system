<?php

namespace App\Notifications;

use App\Models\EnrolleeUser;
use Illuminate\Notifications\Notification;

/**
 * A bell notification once the account's email has been confirmed.
 */
class EmailConfirmed extends Notification
{
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
            'type' => 'email_confirmed',
            'title' => 'Email confirmed',
            'message' => $notifiable->isApproved()
                ? 'Thanks! Your email is confirmed.'
                : "Thanks! Your email is confirmed. The school is now verifying your account — you can submit enrollment applications once it's approved.",
            'url' => route($notifiable->isApproved() ? 'portal.dashboard' : 'portal.account-status', absolute: false),
        ];
    }
}
