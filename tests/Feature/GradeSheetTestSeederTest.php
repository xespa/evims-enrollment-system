<?php

use App\Models\Curriculum;
use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\GradeSheet;
use App\Models\Subject;
use Database\Seeders\GradeSheetTestSeeder;

test('it seeds eight approved students who can be added to each grade sheet', function () {
    $curriculum = Curriculum::factory()->create([
        'grade_level_id' => GradeLevel::factory()->nursery(),
        'school_year' => '2026-2027',
    ]);
    $subjects = Subject::factory()->count(3)->create(['curriculum_id' => $curriculum->id]);
    $gradeSheet = GradeSheet::factory()->create(['subject_id' => $subjects->first()->id]);
    // A level with no grade sheet gets no students.
    Curriculum::factory()->create(['school_year' => '2026-2027']);

    $this->seed(GradeSheetTestSeeder::class);

    $enrollments = Enrollment::with('student', 'subjects')->get();

    expect($enrollments)->toHaveCount(8)
        ->and($enrollments->every(fn (Enrollment $enrollment) => $enrollment->enrollment_status === 'APPROVED'
            && $enrollment->grade_level_id === $curriculum->grade_level_id
            && $enrollment->school_year === '2026-2027'
            && $enrollment->student_type === 'NO_LRN'
            && $enrollment->student->lrn === null
            && $enrollment->subjects->count() === 3))->toBeTrue()
        ->and($gradeSheet->ungradedStudents())->toHaveCount(8);
});

test('it seeds nothing without a grade sheet', function () {
    Curriculum::factory()->create(['school_year' => '2026-2027']);

    $this->seed(GradeSheetTestSeeder::class);

    expect(Enrollment::count())->toBe(0);
});
