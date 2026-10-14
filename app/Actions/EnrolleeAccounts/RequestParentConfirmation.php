<?php

namespace App\Actions\EnrolleeAccounts;

use App\Models\EnrolleeUser;
use App\Notifications\ParentConfirmationRequested;
use Illuminate\Support\Facades\Notification;

/**
 * Emails a student's parent or guardian a one-time link to confirm (or
 * decline) the student's portal account. Sending again replaces the earlier
 * link. The school only reviews the account once the parent confirms.
 */
class RequestParentConfirmation
{
    public function handle(EnrolleeUser $student, string $parentEmail): void
    {
        $token = $student->issueParentConfirmationToken($parentEmail);

        // Sent right away rather than queued, so the plain token never sits
        // in the jobs table (only its hash is stored).
        Notification::route('mail', $parentEmail)
            ->notify(new ParentConfirmationRequested($student, $token));
    }
}
