<?php

namespace App\Enums;

/**
 * The points in an enrollment period the admins are reminded about.
 */
enum EnrollmentPeriodMilestone: string
{
    case OpeningSoon = 'OPENING_SOON';
    case ClosingSoon = 'CLOSING_SOON';
    case Closed = 'CLOSED';

    /**
     * The enrollment_periods column recording that this reminder was sent.
     */
    public function sentAtColumn(): string
    {
        return match ($this) {
            self::OpeningSoon => 'opening_reminder_sent_at',
            self::ClosingSoon => 'closing_reminder_sent_at',
            self::Closed => 'closed_notice_sent_at',
        };
    }
}
