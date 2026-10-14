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
 * Records the parent's answer from the emailed link. Agreeing lets staff
 * create the account (see CreateStudentAccount); declining keeps it from
 * ever being created. Either way the link stops working.
 */
class RecordParentConsent
{
    public function handle(StudentAccount $account, bool $agreed, string $parentName): void
    {
        $account->forceFill([
            'status' => $agreed ? StudentAccountStatus::ConsentGiven : StudentAccountStatus::Declined,
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
