<?php

namespace App\Enums;

/**
 * Who a portal account belongs to, as chosen when registering.
 */
enum AccountType: string
{
    case ParentGuardian = 'PARENT_GUARDIAN';
    case Student = 'STUDENT';

    public function label(): string
    {
        return match ($this) {
            self::ParentGuardian => 'Parent / Guardian',
            self::Student => 'Student',
        };
    }
}
