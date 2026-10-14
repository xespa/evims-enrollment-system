<?php

namespace Database\Factories;

use App\Enums\StudentAccountStatus;
use App\Models\Student;
use App\Models\StudentAccount;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StudentAccount>
 */
class StudentAccountFactory extends Factory
{
    /**
     * An account still waiting on the parent's consent.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'student_id' => Student::factory()->state(fn () => ['lrn' => fake()->unique()->numerify('############')]),
            'status' => StudentAccountStatus::AwaitingConsent,
            'consent_email' => fake()->safeEmail(),
            'consent_requested_at' => now(),
            'consent_expires_at' => now()->addDays(StudentAccount::CONSENT_LINK_DAYS),
        ];
    }

    /**
     * Consented to, with the given first password.
     */
    public function active(string $password = 'password'): static
    {
        return $this->state(fn () => [
            'status' => StudentAccountStatus::Active,
            'password' => $password,
            'consent_given_by' => fake()->name(),
            'consent_responded_at' => now(),
            'consent_expires_at' => null,
        ]);
    }

    public function declined(): static
    {
        return $this->state(fn () => [
            'status' => StudentAccountStatus::Declined,
            'consent_given_by' => fake()->name(),
            'consent_responded_at' => now(),
            'consent_expires_at' => null,
        ]);
    }
}
