<?php

namespace App\Actions;

use App\Models\User;
use App\Notifications\StaffInvitation;
use Illuminate\Contracts\Auth\PasswordBroker;
use Illuminate\Support\Facades\Password;

/**
 * Emails a staff member a one-time, expiring link to set their password.
 * Tokens come from the staff_invitations password broker, so they're stored
 * hashed, replace any earlier link, and can't be re-sent more than once a
 * minute.
 */
class SendStaffInvitation
{
    /**
     * @return string A password broker status, e.g. PasswordBroker::RESET_LINK_SENT.
     */
    public function handle(User $user): string
    {
        $status = Password::broker('staff_invitations')->sendResetLink(
            ['email' => $user->email],
            fn (User $user, string $token) => $user->notify(new StaffInvitation($token)),
        );

        if ($status === PasswordBroker::RESET_LINK_SENT) {
            $user->forceFill(['invited_at' => now()])->save();
        }

        return $status;
    }
}
