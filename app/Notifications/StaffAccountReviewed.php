<?php

namespace App\Notifications;

use App\Enums\AccountStatus;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Emails someone who asked for a staff account whether an admin approved it.
 */
class StaffAccountReviewed extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public AccountStatus $status) {}

    /**
     * @return array<int, string>
     */
    public function via(User $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(User $notifiable): MailMessage
    {
        $message = (new MailMessage)->greeting("Hello {$notifiable->name},");

        if ($this->status === AccountStatus::Approved) {
            return $message
                ->subject('Your EVIMS staff account was approved')
                ->line("Your {$notifiable->role->label()} account on the EVIMS admin panel was approved. You can sign in now.")
                ->action('Sign In', route('login', ['role' => $notifiable->role->value]));
        }

        return $message
            ->subject('Your EVIMS staff account request')
            ->line("Your request for a {$notifiable->role->label()} account on the EVIMS admin panel was not approved.")
            ->line('If you think this is a mistake, contact the school administrator.');
    }
}
