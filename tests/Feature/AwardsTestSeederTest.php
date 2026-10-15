<?php

use App\Actions\Awards\DetermineAcademicAwards;
use App\Enums\StudentAccountStatus;
use App\Models\Curriculum;
use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\GradeSheet;
use App\Models\Section;
use App\Models\StudentGrade;
use App\Models\Subject;
use App\Models\User;
use Database\Seeders\AwardsTestSeeder;

/**
 * A grade level's 2025-2026 curriculum with the given subjects.
 *
 * @param  list<string>  $subjects
 */
function awardsSeederCurriculum(string $gradeLevel, array $subjects = ['English', 'Mathematics', 'Science']): Curriculum
{
    $curriculum = Curriculum::factory()->create([
        'grade_level_id' => GradeLevel::factory()->create(['name' => $gradeLevel]),
        'school_year' => AwardsTestSeeder::SCHOOL_YEAR,
    ]);

    foreach ($subjects as $subject) {
        Subject::factory()->for($curriculum)->create(['name' => $subject]);
    }

    return $curriculum;
}

test('it puts five graded students with accounts in every section', function () {
    User::factory()->teacher()->create();
    $curriculum = awardsSeederCurriculum('Grade 5');
    Section::factory()->for($curriculum)->create(['name' => 'A', 'slots' => 15]);
    Section::factory()->for($curriculum)->create(['name' => 'B', 'slots' => 15]);

    $this->seed(AwardsTestSeeder::class);

    $enrollments = Enrollment::with(['student.account', 'subjects', 'studentGrades'])->get();

    expect($enrollments)->toHaveCount(10)
        ->and($enrollments->countBy('section_id')->values()->all())->toBe([5, 5])
        ->and(GradeSheet::count())->toBe(3)
        ->and($enrollments->every(fn (Enrollment $enrollment) => $enrollment->enrollment_status === 'APPROVED'
            && $enrollment->school_year === AwardsTestSeeder::SCHOOL_YEAR
            && $enrollment->subjects->count() === 3
            && $enrollment->studentGrades->count() === 3
            && $enrollment->student->account->status === StudentAccountStatus::Active
            && $enrollment->student->account->usesLrnAsPassword()))->toBeTrue();
});

test('every award standing shows up', function () {
    User::factory()->teacher()->create();
    $curriculum = awardsSeederCurriculum('Grade 4');
    Section::factory()->for($curriculum)->create(['name' => 'A', 'slots' => 15]);

    $this->seed(AwardsTestSeeder::class);

    $students = collect(app(DetermineAcademicAwards::class)->handle(AwardsTestSeeder::SCHOOL_YEAR)[0]['students']);

    expect($students)->toHaveCount(5)
        ->and($students->countBy('standing')->all())->toEqualCanonicalizing([
            DetermineAcademicAwards::STANDING_ACADEMIC_EXCELLENCE => 2,
            DetermineAcademicAwards::STANDING_NOT_QUALIFIED => 2,
            DetermineAcademicAwards::STANDING_INCOMPLETE => 1,
        ])
        ->and($students->pluck('reasons')->flatten()->implode(' '))->toContain('Final grade below 80')
        ->and($students->pluck('awards')->flatten(1)->pluck('label')->filter(fn (string $label) => str_starts_with($label, 'Excellence in')))->not->toBeEmpty();
});

test('grade levels without sections get A, B and C', function () {
    User::factory()->teacher()->create();
    $curriculum = awardsSeederCurriculum('Grade 8');

    $this->seed(AwardsTestSeeder::class);

    expect($curriculum->sections()->pluck('name')->all())->toBe(['A', 'B', 'C'])
        ->and(Enrollment::count())->toBe(15);
});

test('it reuses grade sheets and tops up sections without going over five', function () {
    $teacher = User::factory()->teacher()->create();
    $curriculum = awardsSeederCurriculum('Grade 6', ['English']);
    Section::factory()->for($curriculum)->create(['name' => 'A', 'slots' => 15]);
    $existingSheet = GradeSheet::factory()->create(['subject_id' => $curriculum->subjects()->first()->id, 'teacher_id' => $teacher->id]);

    $this->seed(AwardsTestSeeder::class);
    $this->seed(AwardsTestSeeder::class);

    expect(Enrollment::count())->toBe(5)
        ->and(GradeSheet::count())->toBe(1)
        ->and(StudentGrade::where('grade_sheet_id', $existingSheet->id)->count())->toBe(5);
});

test('it seeds nothing without a teacher', function () {
    $curriculum = awardsSeederCurriculum('Grade 4');
    Section::factory()->for($curriculum)->create(['name' => 'A', 'slots' => 15]);

    $this->seed(AwardsTestSeeder::class);

    expect(Enrollment::count())->toBe(0);
});
