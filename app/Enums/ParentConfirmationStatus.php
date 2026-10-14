<?php

namespace App\Enums;

/**
 * Where a student's portal account stands with the parent or guardian it
 * names. The school only reviews the account once the parent confirms it.
 */
enum ParentConfirmationStatus: string
{
    /** The confirmation email is out; waiting on the parent or guardian. */
    case Awaiting = 'AWAITING';

    case Confirmed = 'CONFIRMED';

    case Declined = 'DECLINED';

    public function label(): string
    {
        return match ($this) {
            self::Awaiting => 'Waiting for parent',
            self::Confirmed => 'Parent confirmed',
            self::Declined => 'Parent declined',
        };
    }
}
