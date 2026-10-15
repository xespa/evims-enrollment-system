<?php

namespace Database\Seeders;

use App\Models\Curriculum;
use App\Models\EnrolleeUser;
use App\Models\Enrollment;
use App\Models\GradeSheet;
use App\Models\Student;
use Illuminate\Database\Seeder;

/**
 * Approved students for trying out grade sheets: eight in each grade level
 * that already has a grade sheet, enrolled in every subject of that level's
 * curriculum so they can be added to any of its sheets. Run it on its own;
 * it isn't part of DatabaseSeeder.
 */
class GradeSheetTestSeeder extends Seeder
{
    private const STUDENTS_PER_LEVEL = 8;

    public function run(): void
    {
        $curricula = Curriculum::query()
            ->whereIn('id', GradeSheet::query()
                ->join('subjects', 'subjects.id', '=', 'grade_sheets.subject_id')
                ->select('subjects.curriculum_id'))
            ->with(['gradeLevel', 'subjects'])
            ->get();

        if ($curricula->isEmpty()) {
            $this->command->error('No grade sheets yet. Create one from Admin → Grade Sheets first, then run this again.');

            return;
        }

        foreach ($curricula as $curriculum) {
            foreach (range(1, self::STUDENTS_PER_LEVEL) as $index) {
                $this->approvedEnrollment($curriculum);
            }

            $this->command->info('Seeded '.self::STUDENTS_PER_LEVEL." approved students in {$curriculum->gradeLevel->name}, SY {$curriculum->school_year}.");
        }
    }

    private function approvedEnrollment(Curriculum $curriculum): Enrollment
    {
        // Nursery is everyone's first year, so they have no LRN yet.
        $isNursery = $curriculum->gradeLevel->name === 'Nursery';

        $student = Student::factory()->create($isNursery ? ['lrn' => null] : []);
        $parent = EnrolleeUser::factory()->create(['name' => fake()->firstName().' '.$student->last_name]);

        $enrollment = Enrollment::factory()->withDocuments()->create([
            'student_id' => $student->id,
            'grade_level_id' => $curriculum->grade_level_id,
            'school_year' => $curriculum->school_year,
            'student_type' => $isNursery ? 'NO_LRN' : 'WITH_LRN',
            'enrollee_user_id' => $parent->id,
            'email' => $parent->email,
            'enrollment_status' => 'APPROVED',
        ]);

        $enrollment->subjects()->attach($curriculum->subjects->pluck('id'));

        return $enrollment;
    }
}
