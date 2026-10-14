<?php

namespace App\Listeners;

use App\Models\EnrolleeUser;
use App\Models\User;
use App\Notifications\ConfirmEmailReminder;
use App\Notifications\EmailConfirmed;
use App\Notifications\EnrolleeAccountAwaitingReview;
use Illuminate\Auth\Events\Verified;
use Illuminate\Support\Facades\Notification;

/**
 * Once a portal account confirms its email, clears the "Confirm your email"
 * reminder from the bell and says it's done, and tells the admins when the
 * account is ready to review.
 */
class NotifyEnrolleeEmailConfirmed
{
    public function handle(Verified $event): void
    {
        $enrollee = $event->user;

        if (! $enrollee instanceof EnrolleeUser) {
            return;
        }

        $enrollee->unreadNotifications()
            ->where('data->type', ConfirmEmailReminder::TYPE)
            ->update(['read_at' => now()]);

        $enrollee->notify(new EmailConfirmed);

        // Only now can the account be approved, so this is when admins hear
        // of it — unless a student's parent still has to confirm it, in
        // which case they hear once the parent does.
        if ($enrollee->isReadyForReview()) {
            Notification::send(User::query()->applicationReviewers()->get(), new EnrolleeAccountAwaitingReview($enrollee));
        }
    }
}
