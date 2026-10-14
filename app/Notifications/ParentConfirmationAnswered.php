<?php

namespace App\Notifications;

use App\Enums\AccountRole;
use App\Models\EnrolleeUser;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Tells a student whether their parent or guardian confirmed their portal
 * account, in the bell and by email.
 */
class ParentConfirmationAnswered extends Notification implements ShouldQueue
{
    use Queueable;

    public const TYPE = 'parent_confirmation_answered';

    public function __construct(public bool $confirmed) {}

    /**
     * @return array<int, string>
     */
    public function via(EnrolleeUser $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(EnrolleeUser $notifiable): MailMessage
    {
        $message = (new MailMessage)->greeting("Hello {$notifiable->name},");

        if ($this->confirmed) {
            return $message
                ->subject('Your parent confirmed your EVIMS account')
                ->line('Your parent or guardian confirmed your Student Portal account. The school will now review it, and we\'ll email you once it\'s approved.');
        }

        return $message
            ->subject('Your parent declined your EVIMS account')
            ->line('Your parent or guardian declined your Student Portal account, so the school can\'t review it.')
            ->line('If this was a mistake, log in and send the confirmation again, or use a different parent or guardian email.')
            ->action('Log In', route('login', ['role' => AccountRole::Student->value]));
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(EnrolleeUser $notifiable): array
    {
        return [
            'type' => self::TYPE,
            'confirmed' => $this->confirmed,
            'title' => $this->confirmed ? 'Parent confirmed your account' : 'Parent declined your account',
            'message' => $this->confirmed
                ? 'The school will now review your account.'
                : 'Send the confirmation again or use a different parent or guardian email.',
            'url' => route('portal.account-status', [], false),
        ];
    }
}
