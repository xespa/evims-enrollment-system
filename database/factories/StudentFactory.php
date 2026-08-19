<?php

namespace Database\Factories;

use App\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Student>
 */
class StudentFactory extends Factory
{
    protected $model = Student::class;

    public function definition(): array
    {
        return [
            'lrn' => fake()->unique()->numerify('##############'),
            'psa_birth_cert_no' => fake()->numerify('###-####-#####'),
            'last_name' => fake()->lastName(),
            'first_name' => fake()->firstName(),
            'middle_name' => fake()->lastName(),
            'extension_name' => null,
            'date_of_birth' => fake()->dateTimeBetween('-15 years', '-5 years'),
            'sex' => fake()->randomElement(['MALE', 'FEMALE']),
        ];
    }
}
