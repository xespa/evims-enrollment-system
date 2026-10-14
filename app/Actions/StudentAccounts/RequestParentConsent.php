<?php

namespace App\Actions\StudentAccounts;

use App\Enums\AuditAction;
use App\Enums\StudentAccountStatus;
use App\Models\AuditLog;
use App\Models\Student;
use App\Models\StudentAccount;
use App\Models\User;
use App\Notifications\StudentAccountConsentRequested;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;

/**
 * Emails a student's parent or guardian a one-time link to consent to (or
 * decline) a student account. Sending again replaces the earlier link.
 * Nothing about the account is usable until the parent consents.
 */
class RequestParentConsent
{
    /**
     * @throws ValidationException When the student can't have an account yet.
     */
    public function handle(Student $student, User $requestedBy): StudentAccount
    {
        $parentEmail = $this->parentEmail($student);
        $existing = $student->account;

        if ($existing?->isActive()) {
            throw ValidationException::withMessages(['account' => 'This student already has an active account.']);
        }

        [$account, $token] = DB::transaction(function () use ($student, $requestedBy, $parentEmail) {
            $account = StudentAccount::query()->firstOrNew(['student_id' => $student->id]);

            $account->fill([
                'status' => StudentAccountStatus::AwaitingConsent,
                'password' => null,
                'consent_email' => $parentEmail,
                'consent_requested_at' => now(),
                'consent_requested_by' => $requestedBy->id,
                'consent_given_by' => null,
                'consent_responded_at' => null,
            ]);

            $token = $account->issueConsentToken();
            $account->save();

            return [$account, $token];
        });

        // Sent right away rather than queued, so the plain token never sits
        // in the jobs table (only its hash is stored).
        Notification::route('mail', $parentEmail)
            ->notify(new StudentAccountConsentRequested($account->setRelation('student', $student), $token));

        AuditLog::record(AuditAction::StudentConsentRequested, $account, ['resent' => $existing !== null]);

        return $account;
    }

    /**
     * Where the consent email goes: the parent's portal account, or the
     * email given on the application.
     *
     * @throws ValidationException
     */
    private function parentEmail(Student $student): string
    {
        if (! $student->lrn) {
            throw ValidationException::withMessages(['account' => 'Assign the student an LRN first; the account is bound to it.']);
        }

        $enrollment = $student->latestApprovedEnrollment();

        if (! $enrollment) {
            throw ValidationException::withMessages(['account' => 'Only students with an approved application can have an account.']);
        }

        $email = $enrollment->enrolleeUser()->value('email') ?? $enrollment->email;

        if (! $email) {
            throw ValidationException::withMessages(['account' => 'There is no parent or guardian email on file to ask for consent.']);
        }

        return $email;
    }
}
