<?php

namespace Database\Seeders\Concerns;

use App\Models\Curriculum;
use App\Models\EnrolleeUser;
use App\Models\Enrollment;
use App\Models\Section;
use App\Models\Student;
use App\Models\StudentAccount;

/**
 * Approved students placed in a section, each with a parent account and an
 * active student account whose first password is their LRN, as for the
 * accounts staff create. Nursery students get a school-issued LRN, since
 * they have no DepEd one yet.
 */
trait SeedsStudentsWithAccounts
{
    /**
     * The prefix of LRNs the school issues itself (see StudentController::assignLrn()).
     */
    private const SCHOOL_LRN_PREFIX = '452501';

    /**
     * Enrolls a new student in the section's grade level and school year,
     * in every subject of its curriculum.
     */
    protected function seedStudentInSection(Curriculum $curriculum, Section $section): Enrollment
    {
        $isNursery = $curriculum->gradeLevel->name === 'Nursery';

        $student = Student::factory()->create(['lrn' => $this->uniqueLrn($isNursery)]);
        /** @var EnrolleeUser $parent */
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
        $enrollment->section()->associate($section)->save();

        StudentAccount::factory()->active((string) $student->lrn)->create([
            'student_id' => $student->id,
            'consent_email' => $parent->email,
            'consent_given_by' => $parent->name,
        ]);

        return $enrollment->setRelation('student', $student);
    }

    /**
     * A 14-digit school-issued LRN, or a 12-digit DepEd one, nobody has yet.
     */
    private function uniqueLrn(bool $isSchoolIssued): string
    {
        do {
            $lrn = $isSchoolIssued
                ? self::SCHOOL_LRN_PREFIX.fake()->numerify('########')
                : fake()->numerify('1#####').fake()->numerify('######');
        } while (Student::query()->where('lrn', $lrn)->exists());

        return $lrn;
    }
}
