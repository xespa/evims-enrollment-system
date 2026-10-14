<?php

namespace App\Actions\StudentAccounts;

use App\Enums\AuditAction;
use App\Enums\StudentAccountStatus;
use App\Models\AuditLog;
use App\Models\StudentAccount;
use App\Models\User;
use App\Notifications\StudentAccountConsentAnswered;
use Illuminate\Support\Facades\Notification;

/**
 * Records the parent's answer from the emailed link. Agreeing activates
 * the account with the student's LRN as the first password, which the
 * student is prompted to change; declining keeps it from ever being used.
 * Either way the link stops working.
 */
class RecordParentConsent
{
    public function handle(StudentAccount $account, bool $agreed, string $parentName): void
    {
        $account->forceFill([
            'status' => $agreed ? StudentAccountStatus::Active : StudentAccountStatus::Declined,
            'password' => $agreed ? $account->student->lrn : null,
            'consent_given_by' => $parentName,
            'consent_responded_at' => now(),
            'consent_token' => null,
            'consent_expires_at' => null,
        ])->save();

        AuditLog::record(AuditAction::StudentConsentAnswered, $account, ['agreed' => $agreed]);

        Notification::send(
            User::query()->applicationReviewers()->get(),
            new StudentAccountConsentAnswered($account),
        );
    }
}
