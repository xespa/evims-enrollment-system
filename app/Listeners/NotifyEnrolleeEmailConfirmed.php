<?php

namespace App\Listeners;

use App\Models\EnrolleeUser;
use App\Notifications\ConfirmEmailReminder;
use App\Notifications\EmailConfirmed;
use Illuminate\Auth\Events\Verified;

/**
 * Once a portal account confirms its email, clears the "Confirm your email"
 * reminder from the bell and says it's done.
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
    }
}
