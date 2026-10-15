<?php

namespace App\Actions\StudentAccounts;

use App\Enums\AuditAction;
use App\Enums\StudentPasswordResetMethod;
use App\Models\AuditLog;
use App\Models\StudentAccount;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Resets a student's forgotten password, either back to their LRN or to a
 * random temporary one. Passwords are stored hashed, so staff can't look one
 * up; this is how a student who forgot theirs gets back in. Either way the
 * student must choose a new password at their next sign-in.
 */
class ResetStudentPassword
{
    /**
     * @return string|null The temporary password, to show staff once; null when reset to the LRN.
     *
     * @throws ValidationException When the account isn't active, or the student has no LRN.
     */
    public function handle(StudentAccount $account, StudentPasswordResetMethod $method): ?string
    {
        if (! $account->isActive()) {
            throw ValidationException::withMessages(['password' => 'Only an active account’s password can be reset.']);
        }

        $lrn = $account->student->lrn;

        if ($lrn === null) {
            throw ValidationException::withMessages(['password' => 'The student needs an LRN to sign in.']);
        }

        $temporaryPassword = $method === StudentPasswordResetMethod::Temporary
            ? Str::password(10, symbols: false)
            : null;

        DB::transaction(function () use ($account, $method, $lrn, $temporaryPassword): void {
            $account->forceFill([
                'password' => $temporaryPassword ?? $lrn,
                'must_change_password' => true,
                // Signs the student out of any "remember me" sessions.
                'remember_token' => Str::random(60),
            ])->save();

            AuditLog::record(AuditAction::StudentPasswordReset, $account, ['method' => $method->value]);
        });

        return $temporaryPassword;
    }
}
