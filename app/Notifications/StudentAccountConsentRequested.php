<?php

namespace App\Notifications;

use App\Models\StudentAccount;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Asks a parent or guardian to consent to their child's student account.
 * Sent right away rather than queued, so the plain token never sits in the
 * jobs table (only its hash is stored).
 */
class StudentAccountConsentRequested extends Notification
{
    public function __construct(public StudentAccount $account, public string $token) {}

    /**
     * @return array<int, string>
     */
    public function via(AnonymousNotifiable $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(AnonymousNotifiable $notifiable): MailMessage
    {
        $student = $this->account->student;

        return (new MailMessage)
            ->subject("Your consent is needed for {$student->first_name}'s student account")
            ->greeting('Dear Parent/Guardian,')
            ->line("The school would like to create a student account for **{$student->first_name} {$student->last_name}**.")
            ->line("The account is tied to {$student->first_name}'s LRN. It lets {$student->first_name} sign in to see their grades, and lets their teachers record grades against the right student.")
            ->line("We need your consent first. If you agree, {$student->first_name} signs in with their LRN, which is also their first password; they'll be asked to change it after signing in. You can also decline.")
            ->action('Review and Respond', route('student-consent.show', $this->token))
            ->line('This link works once and expires in '.StudentAccount::CONSENT_LINK_DAYS.' days.')
            ->line("If you weren't expecting this, you can ignore this email; no account is created without your consent.");
    }
}
