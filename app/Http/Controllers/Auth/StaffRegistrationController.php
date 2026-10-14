<?php

namespace App\Http\Controllers\Auth;

use App\Enums\AccountStatus;
use App\Enums\AuditAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\StoreStaffRegistrationRequest;
use App\Models\AuditLog;
use App\Models\User;
use App\Notifications\StaffAccountAwaitingApproval;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

/**
 * Staff asking for an account from the sign-up page. The account can't sign
 * in until an admin approves it from Staff Accounts.
 */
class StaffRegistrationController extends Controller
{
    public function store(StoreStaffRegistrationRequest $request): RedirectResponse
    {
        $staffAccount = DB::transaction(function () use ($request): User {
            $staffAccount = User::create($request->safe()->only(['name', 'email', 'password', 'role']));
            $staffAccount->forceFill(['account_status' => AccountStatus::Pending])->save();

            AuditLog::record(AuditAction::StaffSignUpRequested, $staffAccount, ['role' => $staffAccount->role->value], actor: $staffAccount);

            return $staffAccount;
        });

        Notification::send(User::query()->admins()->get(), new StaffAccountAwaitingApproval($staffAccount));

        return redirect()
            ->route('login', ['role' => $staffAccount->role->value])
            ->with('status', 'Your account request was sent. An administrator will review it, and we\'ll email you once it\'s approved.');
    }
}
