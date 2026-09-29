<?php

namespace Database\Factories;

use App\Models\GradeLevel;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<GradeLevel>
 */
class GradeLevelFactory extends Factory
{
    protected $model = GradeLevel::class;

    public function definition(): array
    {
        return [
            'name' => fake()->unique()->randomElement([
                'Kinder', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4',
                'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10',
            ]),
            'level_order' => fake()->unique()->numberBetween(0, 10),
            'registration_fee' => 1725,
            'miscellaneous_fee' => fake()->randomElement([5175, 6125, 6325]),
            'monthly_tuition' => fake()->randomElement([1380, 1725, 2070]),
            'monthly_laboratory_fee' => fake()->randomElement([0, 590, 690]),
            'books_fee' => fake()->randomFloat(2, 5000, 9000),
        ];
    }

    /**
     * A grade level billed exactly the given total, all as a one-time fee.
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
