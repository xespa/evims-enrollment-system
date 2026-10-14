<?php

namespace App\Actions\StudentAccounts;

use App\Enums\AuditAction;
use App\Enums\StudentAccountStatus;
use App\Models\AuditLog;
use App\Models\Student;
use App\Models\StudentAccount;
use App\Notifications\StudentAccountCreated;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;

/**
 * Creates a student's sign-in account once their parent has consented. The
 * account is bound to the student's LRN, which is also the first password;
 * the student is prompted to change it after signing in.
 */
class CreateStudentAccount
{
    /**
     * @throws ValidationException When the parent hasn't consented, or the student has no LRN.
     */
    public function handle(Student $student): StudentAccount
    {
        $account = $student->account;

        if ($account?->status !== StudentAccountStatus::ConsentGiven) {
            throw ValidationException::withMessages([
                'account' => $account?->isActive()
                    ? 'This student already has an active account.'
                    : 'A parent or guardian has to consent before the account can be created.',
            ]);
        }

        if (! $student->lrn) {
            throw ValidationException::withMessages(['account' => 'Assign the student an LRN first; the account is bound to it.']);
        }

        DB::transaction(function () use ($account, $student): void {
            $account->forceFill([
                'status' => StudentAccountStatus::Active,
                'password' => $student->lrn,
            ])->save();

            AuditLog::record(AuditAction::StudentAccountCreated, $account);
        });

        Notification::route('mail', $account->consent_email)
            ->notify(new StudentAccountCreated($account->setRelation('student', $student)));

        return $account;
    }
}
