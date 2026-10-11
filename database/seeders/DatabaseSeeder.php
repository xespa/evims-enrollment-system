<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Model events stay on (no WithoutModelEvents): a curriculum works out its
 * billed total (tuition_fee) when it's saved, so muting them seeds ₱0 bills.
 */
class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->withoutTwoFactor()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        // Sets up two-factor on first sign-in.
        User::factory()->admin()->withoutTwoFactor()->create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
        ]);

        $this->call([
            StaffAccountSeeder::class,
            GradeLevelSeeder::class,
            SubjectSeeder::class,
        ]);
    }
}
