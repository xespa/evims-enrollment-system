<?php

namespace App\Notifications;

use App\Enums\EnrollmentPeriodMilestone;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Reminds the admins that enrollment for a school year opens or closes
 * soon, or that it has ended.
 *
 * The dates are captured when the reminder is due rather than read off the
 * period, since the period may be changed before this queued notification
 * is sent.
 */
class EnrollmentPeriodReminder extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * @param  CarbonImmutable  $date  The opening date for OpeningSoon, otherwise the closing date.
     * @param  int  $daysLeft  Days from today until $date (0 when it's today).
     * @param  bool  $isDraft  Whether the school year still hasn't been saved.
     */
    public function __construct(
        public EnrollmentPeriodMilestone $milestone,
        public string $schoolYear,
        public CarbonImmutable $date,
        public int $daysLeft,
        public bool $isDraft = false,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(User $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(User $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("EVIMS: {$this->title()}")
            ->greeting("Hello {$notifiable->name},")
            ->line($this->message())
            ->action('Manage School Year', route('admin.grade-levels.index', ['school_year' => $this->schoolYear]));
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(User $notifiable): array
    {
        return [
            'type' => 'enrollment_period',
            'status' => $this->milestone->value,
            'school_year' => $this->schoolYear,
            'date' => $this->date->toDateString(),
            'title' => $this->title(),
            'message' => $this->message(),
            'url' => route('admin.grade-levels.index', ['school_year' => $this->schoolYear], false),
        ];
    }

    private function title(): string
    {
        return match ($this->milestone) {
            EnrollmentPeriodMilestone::OpeningSoon => "Enrollment for {$this->schoolYear} opens soon",
            EnrollmentPeriodMilestone::ClosingSoon => "Enrollment for {$this->schoolYear} closes soon",
            EnrollmentPeriodMilestone::Closed => "Enrollment for {$this->schoolYear} has ended",
        };
    }

    private function message(): string
    {
        $date = $this->date->format('F j, Y');

        return match ($this->milestone) {
            EnrollmentPeriodMilestone::OpeningSoon => "Enrollment for S.Y. {$this->schoolYear} opens {$this->relativeDay()}, {$date}."
                .($this->isDraft
                    ? ' It is still a draft — review and save it, or parents won\'t be able to apply.'
                    : ' Parents will be able to apply from then on.'),
            EnrollmentPeriodMilestone::ClosingSoon => "Enrollment for S.Y. {$this->schoolYear} closes {$this->relativeDay()}, {$date}. Extend the closing date if more time is needed.",
            EnrollmentPeriodMilestone::Closed => "Enrollment for S.Y. {$this->schoolYear} ended on {$date}. Parents can no longer apply for it.",
        };
    }

    private function relativeDay(): string
    {
        return match ($this->daysLeft) {
            0 => 'today',
            1 => 'tomorrow',
            default => "in {$this->daysLeft} days",
        };
    }
}
