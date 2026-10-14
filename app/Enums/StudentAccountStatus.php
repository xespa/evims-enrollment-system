<?php

namespace App\Enums;

/**
 * Where a student's sign-in account stands. A student account is only
 * usable once the parent or guardian has consented to it.
 */
enum StudentAccountStatus: string
{
    /** The consent email is out; waiting on the parent or guardian. */
    case AwaitingConsent = 'AWAITING_CONSENT';

    /** The parent consented and set the first password; the student can sign in. */
    case Active = 'ACTIVE';

    /** The parent declined; the student can't sign in. */
    case Declined = 'DECLINED';

    public function label(): string
    {
        return match ($this) {
            self::AwaitingConsent => 'Awaiting parent consent',
            self::Active => 'Active',
            self::Declined => 'Consent declined',
        };
    }
}
