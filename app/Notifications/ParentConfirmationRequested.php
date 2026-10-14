<?php

namespace App\Notifications;

use App\Models\EnrolleeUser;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Asks a parent or guardian to confirm the portal account their child just
 * created. Sent right away rather than queued, so the plain token never
 * sits in the jobs table (only its hash is stored).
 */
class ParentConfirmationRequested extends Notification
{
    public function __construct(public EnrolleeUser $student, public string $token) {}

    /**
     * @return array<int, string>
     */
    public function via(AnonymousNotifiable $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(AnonymousNotifiable $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Please confirm {$this->student->name}'s EVIMS Student Portal account")
            ->greeting('Dear Parent/Guardian,')
            ->line("**{$this->student->name}** ({$this->student->email}) created a student account on the EVIMS Student Portal and named you as their parent or guardian.")
            ->line('With the account they can apply for enrollment, upload documents, and pay tuition online. The school needs you to confirm it before reviewing it.')
            ->action('Review and Confirm', route('parent-confirmation.show', $this->token))
            ->line('This link works once and expires in '.EnrolleeUser::PARENT_CONFIRMATION_LINK_DAYS.' days.')
            ->line("If you don't know this student or didn't expect this, choose Decline on that page, or ignore this email.");
    }
}
