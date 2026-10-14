<?php

namespace Database\Factories;

use App\Enums\AccountStatus;
use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Fortify\Contracts\TwoFactorAuthenticationProvider;
use Laravel\Fortify\RecoveryCode;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'role' => UserRole::Cashier,
            'account_status' => AccountStatus::Approved,
            'remember_token' => Str::random(10),
            // A fully set-up account; see withoutTwoFactor().
            ...$this->confirmedTwoFactorAttributes(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function confirmedTwoFactorAttributes(): array
    {
        return [
            'two_factor_secret' => encrypt(app(TwoFactorAuthenticationProvider::class)->generateSecretKey()),
            'two_factor_recovery_codes' => encrypt(json_encode(Collection::times(8, fn () => RecoveryCode::generate())->all())),
            'two_factor_confirmed_at' => now(),
        ];
    }

    public function admin(): static
    {
        return $this->state(fn (array $attributes) => ['role' => UserRole::Admin]);
    }

    public function registrar(): static
    {
        return $this->state(fn (array $attributes) => ['role' => UserRole::Registrar]);
    }

    public function teacher(): static
    {
        return $this->state(fn (array $attributes) => ['role' => UserRole::Teacher]);
    }

    public function cashier(): static
    {
        return $this->state(fn (array $attributes) => ['role' => UserRole::Cashier]);
    }

    public function deactivated(): static
    {
        return $this->state(fn (array $attributes) => ['deactivated_at' => now()]);
    }

    /**
     * Signed up from the sign-up page and waiting for an admin to approve it.
     */
    public function awaitingApproval(): static
    {
        return $this->withoutTwoFactor()->state(fn (array $attributes) => ['account_status' => AccountStatus::Pending]);
    }

    /**
     * Signed up from the sign-up page and turned down by an admin.
     */
    public function rejected(): static
    {
        return $this->withoutTwoFactor()->state(fn (array $attributes) => ['account_status' => AccountStatus::Rejected]);
    }

    /**
     * Invited by an admin, but hasn't set a password yet.
     */
    public function invited(): static
    {
        return $this->withoutTwoFactor()->state(fn (array $attributes) => [
            'invited_at' => now(),
            'email_verified_at' => null,
        ]);
    }

    /**
     * Hasn't set up two-factor authentication yet.
     */
    public function withoutTwoFactor(): static
    {
        return $this->state(fn (array $attributes) => [
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ]);
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    /**
     * Indicate that the model has two-factor authentication configured.
     */
    public function withTwoFactor(): static
    {
        return $this->state(fn (array $attributes) => $this->confirmedTwoFactorAttributes());
    }
}
