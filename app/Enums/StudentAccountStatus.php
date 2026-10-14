<?php

namespace App\Enums;

/**
 * Where a student's sign-in account stands. A parent or guardian has to
 * consent first, then staff create the account; only then can it be used.
 */
enum StudentAccountStatus: string
{
    /** The consent email is out; waiting on the parent or guardian. */
    case AwaitingConsent = 'AWAITING_CONSENT';

    /** The parent consented; waiting for staff to create the account. */
    case ConsentGiven = 'CONSENT_GIVEN';

    /** Created by staff with the LRN as the first password; the student can sign in. */
    case Active = 'ACTIVE';

    /** The parent declined; the student can't sign in. */
    case Declined = 'DECLINED';

    public function label(): string
    {
        return match ($this) {
            self::AwaitingConsent => 'Awaiting parent consent',
            self::ConsentGiven => 'Consent given — ready to create',
            self::Active => 'Active',
            self::Declined => 'Consent declined',
        };
    }
}
