<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Emails a newly invited staff member a one-time link to set their own
 * password. Sent right away rather than queued, so the plain token never
 * sits in the jobs table (only its hash is stored, like a password reset).
 */
class StaffInvitation extends Notification
{
    public function __construct(public string $token) {}

    /**
     * @return array<int, string>
     */
    public function via(User $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(User $notifiable): MailMessage
    {
        $expiresInHours = intdiv((int) config('auth.passwords.staff_invitations.expire'), 60);

        return (new MailMessage)
            ->subject('You have been invited to the EVIMS admin panel')
            ->greeting("Hello {$notifiable->name},")
            ->line("You've been given a {$notifiable->role->label()} account on the EVIMS admin panel. Set your password to start using it.")
            ->action('Set My Password', route('invitation.create', [
                'token' => $this->token,
                'email' => $notifiable->email,
            ]))
            ->line("This link works once and expires in {$expiresInHours} hours.")
            ->line("If you weren't expecting this, you can ignore this email.");
    }
}
