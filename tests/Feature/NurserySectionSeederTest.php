<?php

use App\Enums\StudentAccountStatus;
use App\Models\Curriculum;
use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\Section;
use App\Models\Subject;
use Database\Seeders\NurserySectionSeeder;

/**
 * Nursery's curriculum for this school year with sections A and B.
 */
function nurseryWithSections(int $slotsInA = 3): Section
{
    $curriculum = Curriculum::factory()->create([
        'grade_level_id' => GradeLevel::factory()->nursery(),
        'school_year' => Enrollment::currentSchoolYear(),
    ]);
    Subject::factory()->count(2)->create(['curriculum_id' => $curriculum->id]);
    Section::factory()->for($curriculum)->create(['name' => 'B', 'slots' => 10]);

    return Section::factory()->for($curriculum)->create(['name' => 'A', 'slots' => $slotsInA]);
}

test('it fills Nursery Section A with approved students who can sign in', function () {
    $sectionA = nurseryWithSections(3);

    $this->seed(NurserySectionSeeder::class);

    $enrollments = Enrollment::with(['student.account', 'subjects'])->get();

    expect($enrollments)->toHaveCount(3)
        ->and($enrollments->every(fn (Enrollment $enrollment) => $enrollment->enrollment_status === 'APPROVED'
            && $enrollment->section_id === $sectionA->id
            && $enrollment->enrollee_user_id !== null
            && $enrollment->subjects->count() === 2
            && str_starts_with((string) $enrollment->student->lrn, '452501')
            && strlen((string) $enrollment->student->lrn) === 14
            && $enrollment->student->account->status === StudentAccountStatus::Active
            && $enrollment->student->account->usesLrnAsPassword()))->toBeTrue();
});

test('the seeded students can sign in with their LRN', function () {
    nurseryWithSections(1);

    $this->seed(NurserySectionSeeder::class);

    $lrn = Enrollment::first()->student->lrn;

    $this->post(route('student.login.store'), ['lrn' => $lrn, 'password' => $lrn])
        ->assertRedirect(route('student.dashboard'));
});

test('it only fills the slots that are free', function () {
    $sectionA = nurseryWithSections(3);
    Enrollment::factory()->create([
        'grade_level_id' => $sectionA->curriculum->grade_level_id,
        'school_year' => $sectionA->curriculum->school_year,
        'enrollment_status' => 'APPROVED',
        'section_id' => $sectionA->id,
    ]);

    $this->seed(NurserySectionSeeder::class);

    expect($sectionA->students()->count())->toBe(3);

    // Running it again once full adds nobody.
    $this->seed(NurserySectionSeeder::class);

    expect(Enrollment::count())->toBe(3);
});

test('it seeds nothing without a Nursery Section A', function () {
    Curriculum::factory()->create([
        'grade_level_id' => GradeLevel::factory()->nursery(),
        'school_year' => Enrollment::currentSchoolYear(),
    ]);

    $this->seed(NurserySectionSeeder::class);

    expect(Enrollment::count())->toBe(0);
});
