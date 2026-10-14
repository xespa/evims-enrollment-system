<?php

namespace App\Notifications;

use App\Enums\AccountRole;
use App\Models\StudentAccount;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Tells the parent who consented that their child's student account is
 * ready, and how the child signs in. The LRN itself isn't repeated here.
 */
class StudentAccountCreated extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public StudentAccount $account) {}

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
            ->subject("{$student->first_name}'s student account is ready")
            ->greeting('Dear Parent/Guardian,')
            ->line("Thank you for your consent. The school has created **{$student->first_name} {$student->last_name}**'s student account.")
            ->line("{$student->first_name} signs in with their LRN (printed on their report card). The first password is also the LRN, so please help them change it right after signing in.")
            ->line("{$student->first_name} can use the account to see their grades each school year.")
            ->action('Go to Student Sign In', route('login', ['role' => AccountRole::Student->value]));
    }
}
