<?php

namespace Database\Factories;

use App\Enums\AccountRejectionReason;
use App\Enums\AccountStatus;
use App\Enums\AccountType;
use App\Models\EnrolleeUser;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

class EnrolleeUserFactory extends Factory
{
    protected $model = EnrolleeUser::class;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'account_type' => AccountType::ParentGuardian,
            'email_verified_at' => now(),
            'password' => Hash::make('password'),
            'valid_id_path' => 'valid-ids/'.fake()->uuid().'.jpg',
            'account_status' => AccountStatus::Approved,
            'reviewed_at' => now(),
        ];
    }

    public function unverified(): static
    {
        return $this->state(['email_verified_at' => null]);
    }

    /**
     * An account still waiting for an admin to review it.
     */
    public function pending(): static
    {
        return $this->state([
            'account_status' => AccountStatus::Pending,
            'reviewed_at' => null,
        ]);
    }

    /**
     * @param  array<int, AccountRejectionReason>  $reasons
     */
    public function rejected(array $reasons = [AccountRejectionReason::BlurryId], ?string $note = null): static
    {
        return $this->state([
            'account_status' => AccountStatus::Rejected,
            'rejection_reasons' => $reasons,
            'rejection_reason' => $note,
        ]);
    }
}
