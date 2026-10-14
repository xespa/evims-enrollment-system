<?php

namespace App\Enums;

/**
 * How tuition is paid, stored as the billing contract's payment_channel.
 * Parents choose an online method from Pay Tuition; Counter is the default
 * until they do, and cash paid at the cashier is recorded by staff. Online
 * methods that aren't wired up yet are listed as "coming soon".
 */
enum PaymentMethod: string
{
    case Counter = 'COUNTER';
    case Gcash = 'GCASH';
    case Maya = 'MAYA';
    case Seabank = 'SEABANK';
    case Paypal = 'PAYPAL';

    public function label(): string
    {
        return match ($this) {
            self::Counter => 'Cash',
            self::Gcash => 'GCash',
            self::Maya => 'PayMaya',
            self::Seabank => 'SeaBank',
            self::Paypal => 'PayPal',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::Counter => 'Pay at the school cashier',
            self::Gcash => 'Pay online with your GCash account',
            self::Maya => 'Pay online with your Maya account',
            self::Seabank => 'Pay by SeaBank transfer',
            self::Paypal => 'Pay online with PayPal',
        };
    }

    /**
     * The provider's logo under public/, or null for cash.
     */
    public function logo(): ?string
    {
        return match ($this) {
            self::Counter => null,
            self::Gcash => '/images/payment-methods/gcash.svg',
            self::Maya => '/images/payment-methods/maya.svg',
            self::Seabank => '/images/payment-methods/seabank.svg',
            self::Paypal => '/images/payment-methods/paypal.svg',
        };
    }

    /**
     * Whether the parent picks this from Pay Tuition. Cash isn't picked;
     * the parent just pays at the cashier and staff record it.
     */
    public function isOnline(): bool
    {
        return $this !== self::Counter;
    }

    /**
     * Whether parents can choose this method yet.
     */
    public function isAvailable(): bool
    {
        return match ($this) {
            self::Counter, self::Gcash => true,
            self::Maya, self::Seabank, self::Paypal => false,
        };
    }

    /**
     * The methods a parent can choose from Pay Tuition right now.
     *
     * @return list<string>
     */
    public static function choosableValues(): array
    {
        return array_values(array_map(
            fn (self $method) => $method->value,
            array_filter(self::onlineCases(), fn (self $method) => $method->isAvailable()),
        ));
    }

    /**
     * Every online method, for the Pay Tuition chooser.
     *
     * @return list<array{value: string, label: string, description: string, logo: string|null, available: bool}>
     */
    public static function payTuitionOptions(): array
    {
        return array_map(fn (self $method) => [
            'value' => $method->value,
            'label' => $method->label(),
            'description' => $method->description(),
            'logo' => $method->logo(),
            'available' => $method->isAvailable(),
        ], self::onlineCases());
    }

    /**
     * @return list<self>
     */
    private static function onlineCases(): array
    {
        return array_values(array_filter(self::cases(), fn (self $method) => $method->isOnline()));
    }
}
