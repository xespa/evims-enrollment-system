<?php

namespace Database\Factories;

use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Enrollment>
 */
class EnrollmentFactory extends Factory
{
    protected $model = Enrollment::class;

    public function definition(): array
    {
        return [
            'student_id' => Student::factory(),
            'grade_level_id' => GradeLevel::factory(),
            'school_year' => '2026-2027',
            'student_type' => fake()->randomElement(['NO_LRN', 'WITH_LRN', 'RETURNEE']),
            'date_of_application' => now(),
            'age' => fake()->numberBetween(5, 16),
            'session_time_preference' => fake()->randomElement(['MORNING_SESSION', 'AFTERNOON_SESSION', 'SCHOOL_SERVICE']),
            'enrollment_status' => 'PENDING',
        ];
    }
}
