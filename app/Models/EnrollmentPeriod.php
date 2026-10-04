<?php

namespace App\Models;

use App\Enums\EnrollmentPeriodMilestone;
use Carbon\CarbonImmutable;
use Database\Factories\EnrollmentPeriodFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Date;

/**
 * The dates applications for one school year are accepted, both inclusive
 * and in the school's (Philippine) time. A saved school year without one
 * is open for as long as it's the newest saved year.
 *
 * @property int $id
 * @property string $school_year
 * @property CarbonImmutable $opens_on
 * @property CarbonImmutable $closes_on
 * @property CarbonImmutable|null $opening_reminder_sent_at
 * @property CarbonImmutable|null $closing_reminder_sent_at
 * @property CarbonImmutable|null $closed_notice_sent_at
 */
class EnrollmentPeriod extends Model
{
    /** @use HasFactory<EnrollmentPeriodFactory> */
    use HasFactory;

    public const TIMEZONE = 'Asia/Manila';

    /**
     * How many days ahead the admins are reminded that enrollment opens
     * or closes.
     */
    public const REMINDER_DAYS_AHEAD = 3;

    protected $fillable = [
        'school_year',
        'opens_on',
        'closes_on',
    ];

    protected function casts(): array
    {
        return [
            'opens_on' => 'date:Y-m-d',
            'closes_on' => 'date:Y-m-d',
            'opening_reminder_sent_at' => 'datetime',
            'closing_reminder_sent_at' => 'datetime',
            'closed_notice_sent_at' => 'datetime',
        ];
    }

    /**
     * Moving a date re-arms its reminders, so the admins are reminded about
     * the new date. A date already past when it's set is treated as already
     * reminded about: no "opening soon" for a period that's already open.
     */
    protected static function booted(): void
    {
        static::saving(function (EnrollmentPeriod $period) {
            $today = self::today();

            if ($period->isDirty('opens_on')) {
                $period->opening_reminder_sent_at = $period->opens_on->lte($today) ? now() : null;
            }

            if ($period->isDirty('closes_on')) {
                $alreadyClosed = $period->closes_on->lt($today);

                $period->closing_reminder_sent_at = $alreadyClosed ? now() : null;
                $period->closed_notice_sent_at = $alreadyClosed ? now() : null;
            }
        });
    }

    /**
     * Today's date at the school, as midnight in the app's timezone so it
     * compares like the date-cast columns do.
     */
    public static function today(): CarbonImmutable
    {
        return Date::parse(now(self::TIMEZONE)->toDateString())->toImmutable();
    }

    /**
     * Periods that aren't accepting applications on the given date.
     *
     * @param  Builder<self>  $query
     */
    public function scopeClosedOn(Builder $query, CarbonImmutable $date): void
    {
        $query->where(fn (Builder $query) => $query
            ->whereDate('opens_on', '>', $date)
            ->orWhereDate('closes_on', '<', $date));
    }

    /**
     * Periods with the given reminder due today and not yet sent.
     *
     * @param  Builder<self>  $query
     */
    public function scopeDueFor(Builder $query, EnrollmentPeriodMilestone $milestone): void
    {
        $today = self::today();
        $reminderDate = $today->addDays(self::REMINDER_DAYS_AHEAD);

        $query->whereNull($milestone->sentAtColumn());

        match ($milestone) {
            EnrollmentPeriodMilestone::OpeningSoon => $query
                ->whereDate('opens_on', '>', $today)
                ->whereDate('opens_on', '<=', $reminderDate),
            EnrollmentPeriodMilestone::ClosingSoon => $query
                ->whereDate('opens_on', '<=', $today)
                ->whereDate('closes_on', '>=', $today)
                ->whereDate('closes_on', '<=', $reminderDate),
            EnrollmentPeriodMilestone::Closed => $query
                ->whereDate('closes_on', '<', $today),
        };
    }

    /**
     * Whole days from today until the given date (0 when it's today).
     */
    public function daysUntil(CarbonImmutable $date): int
    {
        return (int) self::today()->diffInDays($date->startOfDay(), absolute: false);
    }
}
