<?php

namespace App\Console\Commands;

use App\Enums\EnrollmentPeriodMilestone;
use App\Models\Curriculum;
use App\Models\EnrollmentPeriod;
use App\Models\User;
use App\Notifications\EnrollmentPeriodReminder;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

/**
 * Runs daily: reminds the admins of enrollment periods opening or closing
 * within EnrollmentPeriod::REMINDER_DAYS_AHEAD days, and of ones that just
 * ended. Each reminder is sent once per date, however often this runs.
 */
#[Signature('enrollment:send-period-reminders')]
#[Description('Remind admins that enrollment is opening, closing, or has ended')]
class SendEnrollmentPeriodReminders extends Command
{
    public function handle(): int
    {
        $admins = User::query()->where('role', 'ADMIN')->get();

        foreach (EnrollmentPeriodMilestone::cases() as $milestone) {
            $periods = EnrollmentPeriod::query()->dueFor($milestone)->get();

            foreach ($periods as $period) {
                $this->remind($admins, $period, $milestone);
            }
        }

        return self::SUCCESS;
    }

    /**
     * Marks the reminder sent before sending it, both in one transaction,
     * so an overlapping run can't send it twice.
     *
     * @param  Collection<int, User>  $admins
     */
    private function remind(Collection $admins, EnrollmentPeriod $period, EnrollmentPeriodMilestone $milestone): void
    {
        $column = $milestone->sentAtColumn();

        DB::transaction(function () use ($admins, $period, $milestone, $column) {
            $claimed = EnrollmentPeriod::query()
                ->whereKey($period->id)
                ->whereNull($column)
                ->update([$column => now()]);

            if ($claimed === 0) {
                return;
            }

            $date = $milestone === EnrollmentPeriodMilestone::OpeningSoon ? $period->opens_on : $period->closes_on;

            Notification::send($admins, new EnrollmentPeriodReminder(
                milestone: $milestone,
                schoolYear: $period->school_year,
                date: $date,
                daysLeft: $period->daysUntil($date),
                isDraft: Curriculum::draftSchoolYear() === $period->school_year,
            ));

            $this->info("Sent {$milestone->value} reminder for {$period->school_year}.");
        });
    }
}
