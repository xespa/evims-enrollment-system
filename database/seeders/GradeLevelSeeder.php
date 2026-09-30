<?php

namespace Database\Seeders;

use App\Models\Curriculum;
use App\Models\Enrollment;
use App\Models\GradeLevel;
use Illuminate\Database\Seeder;
use Illuminate\Support\Arr;

class GradeLevelSeeder extends Seeder
{
    /**
     * The grade levels, set up for the current school year with the
     * S.Y. 2026-2027 fee schedule. The billed total (tuition_fee) is derived
     * from these on save — see Curriculum::computeTotalFee().
     */
    public function run(): void
    {
        $preElementary = ['registration_fee' => 1725, 'miscellaneous_fee' => 5175, 'monthly_tuition' => 1725, 'monthly_laboratory_fee' => 0];
        $elementary = ['registration_fee' => 1725, 'miscellaneous_fee' => 6325, 'monthly_tuition' => 2070, 'monthly_laboratory_fee' => 690];
        $juniorHigh = ['registration_fee' => 1725, 'miscellaneous_fee' => 6125, 'monthly_tuition' => 1380, 'monthly_laboratory_fee' => 590];

        $levels = [
            ['name' => 'Nursery', 'level_order' => 0, ...$preElementary, 'books_fee' => 5251],
            ['name' => 'Pre-K 1', 'level_order' => 1, ...$preElementary, 'books_fee' => 5251],
            ['name' => 'Pre-K 2', 'level_order' => 2, ...$preElementary, 'books_fee' => 5251],
            ['name' => 'Grade 1', 'level_order' => 3, ...$elementary, 'books_fee' => 5099],
            ['name' => 'Grade 2', 'level_order' => 4, ...$elementary, 'books_fee' => 6194],
            ['name' => 'Grade 3', 'level_order' => 5, ...$elementary, 'books_fee' => 7105],
            ['name' => 'Grade 4', 'level_order' => 6, ...$elementary, 'books_fee' => 8041],
            ['name' => 'Grade 5', 'level_order' => 7, ...$elementary, 'books_fee' => 8661],
            ['name' => 'Grade 6', 'level_order' => 8, ...$elementary, 'books_fee' => 8621],
            ['name' => 'Grade 7', 'level_order' => 9, ...$juniorHigh, 'books_fee' => 8841],
            ['name' => 'Grade 8', 'level_order' => 10, ...$juniorHigh, 'books_fee' => 8841],
            ['name' => 'Grade 9', 'level_order' => 11, ...$juniorHigh, 'books_fee' => 8841],
            ['name' => 'Grade 10', 'level_order' => 12, ...$juniorHigh, 'books_fee' => 8841],
        ];

        $schoolYear = Enrollment::currentSchoolYear();

        foreach ($levels as $level) {
            $gradeLevel = GradeLevel::create(Arr::only($level, ['name', 'level_order']));

            $gradeLevel->curricula()->create([
                'school_year' => $schoolYear,
                ...Arr::only($level, Curriculum::FEE_FIELDS),
            ]);
        }
    }
}
