<?php

namespace App\Http\Controllers\Auth;

use App\Enums\AuditAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\AcceptInvitationRequest;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Contracts\Auth\PasswordBroker;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Where an invited staff member sets their first password, from the link in
 * their invitation email.
 */
class AcceptInvitationController extends Controller
{
    public function create(Request $request, string $token): Response
    {
        $email = (string) $request->query('email', '');
        $staffAccount = User::query()->where('email', $email)->first();

        // Checked up front so an expired link says so before anything is typed.
        $isValid = $staffAccount !== null
            && $staffAccount->isActive()
            && $staffAccount->hasPendingInvitation()
            && Password::broker('staff_invitations')->tokenExists($staffAccount, $token);

        return Inertia::render('auth/accept-invitation', [
            'token' => $token,
            'email' => $email,
            // Only shown with a valid link, so the page can't be used to look up who has an account.
            'name' => $isValid ? $staffAccount->name : null,
            'isValid' => $isValid,
            'passwordRules' => PasswordRule::defaults()->toPasswordRulesString(),
        ]);
    }

    public function store(AcceptInvitationRequest $request): RedirectResponse
    {
        $status = Password::broker('staff_invitations')->reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $staffAccount, string $password): void {
                if (! $staffAccount->isActive() || ! $staffAccount->hasPendingInvitation()) {
                    throw ValidationException::withMessages([
                        'email' => 'This invitation is no longer valid.',
                    ]);
                }

                // Following the emailed link also proves the address is theirs.
                $staffAccount->forceFill([
                    'password' => $password,
                    'email_verified_at' => now(),
                    'remember_token' => Str::random(60),
                ])->save();

                AuditLog::record(AuditAction::InvitationAccepted, $staffAccount, actor: $staffAccount);
            },
        );

        if ($status !== PasswordBroker::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => 'This invitation link is invalid or has expired. Ask an administrator to send a new one.',
            ]);
        }

        return to_route('login')->with('status', 'Your password is set. Log in to get started.');
    }
}
