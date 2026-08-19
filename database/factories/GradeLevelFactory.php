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
            'tuition_fee' => fake()->randomFloat(2, 15000, 60000),
        ];
    }
}
