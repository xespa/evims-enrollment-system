<?php

namespace Database\Factories;

use App\Models\Curriculum;
use App\Models\Section;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Section>
 */
class SectionFactory extends Factory
{
    protected $model = Section::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'curriculum_id' => Curriculum::factory(),
            'name' => fake()->unique()->randomLetter(),
            'slots' => Section::DEFAULT_SLOTS,
        ];
    }
}
