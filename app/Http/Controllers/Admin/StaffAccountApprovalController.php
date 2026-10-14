<?php

namespace App\Http\Controllers\Admin;

use App\Enums\AccountStatus;
use App\Enums\AuditAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateStaffAccountApprovalRequest;
use App\Models\AuditLog;
use App\Models\User;
use App\Notifications\StaffAccountReviewed;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

/**
 * Admins approving or rejecting accounts staff asked for on the sign-up page.
 */
class StaffAccountApprovalController extends Controller
{
    public function update(UpdateStaffAccountApprovalRequest $request, User $staffAccount): RedirectResponse
    {
        $status = $request->enum('account_status', AccountStatus::class);

        DB::transaction(function () use ($staffAccount, $status): void {
            $staffAccount->forceFill([
                'account_status' => $status,
                // An approved account is one the school vouches for, as with
                // an accepted invitation.
                'email_verified_at' => $status === AccountStatus::Approved ? now() : null,
            ])->save();

            AuditLog::record(
                $status === AccountStatus::Approved ? AuditAction::StaffSignUpApproved : AuditAction::StaffSignUpRejected,
                $staffAccount,
                ['role' => $staffAccount->role->value],
            );
        });

        $staffAccount->notify(new StaffAccountReviewed($status));

        return back()->with('success', $status === AccountStatus::Approved
            ? "{$staffAccount->name} can now sign in as a {$staffAccount->role->label()}."
            : "{$staffAccount->name}'s account request was rejected.");
    }
}
