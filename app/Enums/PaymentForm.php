<?php

namespace App\Enums;

/**
 * How a counter payment was tendered, as ticked on the paper
 * acknowledgement receipt.
 */
enum PaymentForm: string
{
    case Cash = 'CASH';
    case Check = 'CHECK';

    public function label(): string
    {
        return match ($this) {
            self::Cash => 'Cash',
            self::Check => 'Check',
        };
    }
}
