<?php

namespace Database\Factories;

use App\Models\Enrollment;
use App\Models\EnrollmentPeriod;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<EnrollmentPeriod>
 */
class EnrollmentPeriodFactory extends Factory
{
    protected $model = EnrollmentPeriod::class;

    /**
     * Open now, for the current school year.
     */
    public function definition(): array
    {
        return [
            'school_year' => Enrollment::currentSchoolYear(),
            'opens_on' => EnrollmentPeriod::today()->subDays(10),
            'closes_on' => EnrollmentPeriod::today()->addDays(30),
        ];
    }

    /**
     * Opens the given number of days from today.
     */
    public function opensIn(int $days): static
    {
        return $this->state(fn () => [
            'opens_on' => EnrollmentPeriod::today()->addDays($days),
            'closes_on' => EnrollmentPeriod::today()->addDays($days + 30),
        ]);
    }

    /**
     * Open now, closing the given number of days from today.
     */
    public function closesIn(int $days): static
    {
        return $this->state(fn () => [
            'opens_on' => EnrollmentPeriod::today()->subDays(30),
            'closes_on' => EnrollmentPeriod::today()->addDays($days),
        ]);
    }
}
