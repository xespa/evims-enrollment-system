<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * One sign-in per staff role besides admin, for trying out what each role
 * can see. All use the password "password" and set up two-factor on first
 * sign-in. Safe to run again: accounts that already exist are left alone.
 */
class StaffAccountSeeder extends Seeder
{
    /**
     * @var list<array{role: UserRole, name: string, email: string}>
     */
    private const ACCOUNTS = [
        ['role' => UserRole::Cashier, 'name' => 'Cashier User', 'email' => 'cashier@example.com'],
        ['role' => UserRole::Teacher, 'name' => 'Teacher User', 'email' => 'teacher@example.com'],
        ['role' => UserRole::Registrar, 'name' => 'Registrar User', 'email' => 'registrar@example.com'],
    ];

    public function run(): void
    {
        foreach (self::ACCOUNTS as $account) {
            if (User::where('email', $account['email'])->exists()) {
                continue;
            }

            User::factory()->withoutTwoFactor()->create($account);
        }
    }
}
