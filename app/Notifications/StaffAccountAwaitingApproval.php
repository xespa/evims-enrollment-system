<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

/**
 * Tells the admins someone asked for a staff account from the sign-up page.
 */
class StaffAccountAwaitingApproval extends Notification implements ShouldQueue
{
    use Queueable;

    public const TYPE = 'staff_account_awaiting_approval';

    public function __construct(public User $staffAccount) {}

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
            'staff_account_id' => $this->staffAccount->id,
            'title' => 'Staff account to approve',
            'message' => "{$this->staffAccount->name} asked for a {$this->staffAccount->role->label()} account.",
            'url' => route('admin.staff-accounts.index', [], false),
        ];
    }
}
