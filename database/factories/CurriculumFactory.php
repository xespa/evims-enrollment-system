<?php

namespace Database\Factories;

use App\Models\Curriculum;
use App\Models\Enrollment;
use App\Models\GradeLevel;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Curriculum>
 */
class CurriculumFactory extends Factory
{
    protected $model = Curriculum::class;

    public function definition(): array
    {
        return [
            'grade_level_id' => GradeLevel::factory(),
            'school_year' => Enrollment::currentSchoolYear(),
            'registration_fee' => 1725,
            'miscellaneous_fee' => fake()->randomElement([5175, 6125, 6325]),
            'monthly_tuition' => fake()->randomElement([1380, 1725, 2070]),
            'monthly_laboratory_fee' => fake()->randomElement([0, 590, 690]),
            'books_fee' => fake()->randomFloat(2, 5000, 9000),
        ];
    }

    /**
     * Billed exactly the given total, all as a one-time fee.
     */
    public function totalFee(float $total): static
    {
        return $this->state(fn () => [
            'registration_fee' => $total,
            'miscellaneous_fee' => 0,
            'monthly_tuition' => 0,
            'monthly_laboratory_fee' => 0,
            'books_fee' => 0,
        ]);
    }
}
