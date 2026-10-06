<?php

namespace App\Http\Controllers\Admin;

use App\Enums\AuditAction;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Staff accounts are deactivated rather than deleted, so their past actions
 * stay attributed to them and the account can be restored.
 */
class StaffAccountDeactivationController extends Controller
{
    /**
     * Deactivate the account and end every session it has open.
     */
    public function store(Request $request, User $staffAccount): RedirectResponse
    {
        if ($staffAccount->is($request->user())) {
            throw ValidationException::withMessages([
                'staff_account' => "You can't deactivate your own account.",
            ]);
        }

        DB::transaction(function () use ($staffAccount): void {
            $staffAccount->forceFill([
                'deactivated_at' => now(),
                'remember_token' => Str::random(60),
            ])->save();

            // An unused invitation link mustn't still work.
            Password::broker('staff_invitations')->deleteToken($staffAccount);

            if (config('session.driver') === 'database') {
                DB::table(config('session.table', 'sessions'))
                    ->where('user_id', $staffAccount->id)
                    ->delete();
            }

            AuditLog::record(AuditAction::StaffDeactivated, $staffAccount);
        });

        return back()->with('success', "{$staffAccount->name}'s account has been deactivated.");
    }

    /**
     * Let the account sign in again.
     */
    public function destroy(User $staffAccount): RedirectResponse
    {
        DB::transaction(function () use ($staffAccount): void {
            $staffAccount->forceFill(['deactivated_at' => null])->save();

            AuditLog::record(AuditAction::StaffReactivated, $staffAccount);
        });

        return back()->with('success', "{$staffAccount->name}'s account has been reactivated.");
    }
}
