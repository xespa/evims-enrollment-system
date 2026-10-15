<?php

namespace App\Enums;

/**
 * Whose details the family gives in the admission form's Parent / Guardian
 * step: the child's father and mother, or a guardian the child lives with.
 */
enum ParentInfoType: string
{
    case Parents = 'PARENTS';
    case Guardian = 'GUARDIAN';

    public function label(): string
    {
        return match ($this) {
            self::Parents => 'Parents',
            self::Guardian => 'Guardian',
        };
    }
}
