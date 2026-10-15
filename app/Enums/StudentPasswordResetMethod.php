<?php

namespace App\Enums;

/**
 * What staff set a student's forgotten password to.
 */
enum StudentPasswordResetMethod: string
{
    /** Back to the starting password, the student's LRN. */
    case Lrn = 'LRN';

    /** A random one-time password, shown to staff once to pass on. */
    case Temporary = 'TEMPORARY';

    public function label(): string
    {
        return match ($this) {
            self::Lrn => 'reset to their LRN',
            self::Temporary => 'set a temporary password',
        };
    }
}
