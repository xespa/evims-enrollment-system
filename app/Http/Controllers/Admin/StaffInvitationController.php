<?php

namespace App\Http\Controllers\Admin;

use App\Actions\SendStaffInvitation;
use App\Enums\AuditAction;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Contracts\Auth\PasswordBroker;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;

class StaffInvitationController extends Controller
{
    /**
     * Send a fresh invitation link, replacing the old one.
     */
    public function store(User $staffAccount, SendStaffInvitation $sendStaffInvitation): RedirectResponse
    {
        if (! $staffAccount->hasPendingInvitation() || ! $staffAccount->isActive()) {
            throw ValidationException::withMessages([
                'staff_account' => "{$staffAccount->name} has no pending invitation.",
            ]);
        }

        if ($sendStaffInvitation->handle($staffAccount) === PasswordBroker::RESET_THROTTLED) {
            throw ValidationException::withMessages([
                'staff_account' => 'An invitation was just sent. Wait a minute before sending another.',
            ]);
        }

        AuditLog::record(AuditAction::InvitationResent, $staffAccount);

        return back()->with('success', "A new invitation was sent to {$staffAccount->email}.");
    }
}
