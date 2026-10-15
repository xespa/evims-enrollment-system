<?php

namespace Database\Factories;

use App\Models\Enrollment;
use App\Models\GradeSheet;
use App\Models\StudentGrade;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StudentGrade>
 */
class StudentGradeFactory extends Factory
{
    protected $model = StudentGrade::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'grade_sheet_id' => GradeSheet::factory(),
            'enrollment_id' => Enrollment::factory()->state(['enrollment_status' => 'APPROVED']),
            'term_1' => fake()->randomFloat(2, 70, 99),
            'term_2' => fake()->randomFloat(2, 70, 99),
            'term_3' => fake()->randomFloat(2, 70, 99),
        ];
    }

    /**
     * Added to the sheet, with no grades entered yet.
     */
    public function ungraded(): static
    {
        return $this->state(fn (array $attributes) => [
            'term_1' => null,
            'term_2' => null,
            'term_3' => null,
        ]);
    }
}
