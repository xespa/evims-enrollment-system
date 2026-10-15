<?php

namespace Database\Factories;

use App\Models\GradeSheet;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<GradeSheet>
 */
class GradeSheetFactory extends Factory
{
    protected $model = GradeSheet::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'subject_id' => Subject::factory(),
            'teacher_id' => User::factory()->teacher(),
        ];
    }
}
