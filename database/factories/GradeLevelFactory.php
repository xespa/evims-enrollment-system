<?php

namespace Database\Factories;

use App\Models\Curriculum;
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
                'Nursery', 'Pre-K 1', 'Pre-K 2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4',
                'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10',
            ]),
            'level_order' => fake()->unique()->numberBetween(0, 12),
        ];
    }

    /**
     * Also sets the grade level up for a school year (the current one by
     * default), with the given fees overriding the factory's defaults.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function withCurriculum(array $attributes = []): static
    {
        return $this->afterCreating(fn (GradeLevel $gradeLevel) => Curriculum::factory()
            ->for($gradeLevel)
            ->create($attributes));
    }

    /**
     * Set up for the current school year and billed exactly the given
     * total, all as a one-time fee.
     */
    public function totalFee(float $total): static
    {
        return $this->afterCreating(fn (GradeLevel $gradeLevel) => Curriculum::factory()
            ->for($gradeLevel)
            ->totalFee($total)
            ->create());
    }
}
