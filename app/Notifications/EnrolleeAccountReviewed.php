<?php

namespace App\Notifications;

use App\Enums\AccountRejectionReason;
use App\Enums\AccountStatus;
use App\Models\EnrolleeUser;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Tells an account holder their portal account was approved or rejected by
 * an admin — and, when rejected, exactly what to fix.
 *
 * The decision is captured here rather than read off the account, since the
 * account may be reviewed again before this queued notification is sent.
 */
class EnrolleeAccountReviewed extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * @param  array<int, AccountRejectionReason>  $rejectionReasons
     */
    public function __construct(
        public AccountStatus $status,
        public array $rejectionReasons = [],
        public ?string $note = null,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(EnrolleeUser $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(EnrolleeUser $notifiable): MailMessage
    {
        if ($this->status === AccountStatus::Approved) {
            return (new MailMessage)
                ->subject('Your EVIMS Portal Account Has Been Approved')
                ->greeting("Hello {$notifiable->name},")
                ->line('Your portal account has been approved. You can now view your applications, upload documents, and pay online.')
                ->action('Go to the Portal', route('portal.dashboard'));
        }

        $message = (new MailMessage)
            ->subject('Please Try Creating Your EVIMS Portal Account Again')
            ->greeting("Hello {$notifiable->name},")
            ->line('Thank you for registering. Unfortunately, we could not approve your previous attempt to create a portal account because of the following issue(s):');

        foreach ($this->rejectionReasons as $reason) {
            $message->line("**{$reason->label()}** — {$reason->guidance()}");
        }

        if ($this->note) {
            $message->line("**Note from the school:** {$this->note}");
        }

        return $message
            ->line('Please try creating your account again, making sure the issue(s) above are fixed. You can submit enrollment applications once your account is approved.')
            ->action('Create My Account Again', $notifiable->reapplicationUrl())
            ->line('This link works for 14 days. If you have questions, please contact the school registrar.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(EnrolleeUser $notifiable): array
    {
        $isApproved = $this->status === AccountStatus::Approved;

        return [
            'type' => 'account_reviewed',
            'status' => $this->status->value,
            'title' => $isApproved ? 'Account approved' : 'Account not approved',
            'message' => $isApproved
                ? 'Your portal account has been approved. You can now use the portal and pay online.'
                : 'Your portal account was not approved: '.implode('; ', array_map(
                    fn (AccountRejectionReason $reason) => $reason->label(),
                    $this->rejectionReasons,
                )).'.',
            'url' => $isApproved ? '/portal/dashboard' : '/portal/account-status',
        ];
    }
}
