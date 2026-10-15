<?php

use App\Actions\GradeSheets\SendGradesToNextApplication;
use App\Models\Curriculum;
use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\Section;
use App\Models\Subject;
use App\Models\User;
use Database\Seeders\ReturningStudentsSeeder;

beforeEach(function () {
    // October 2026 falls in S.Y. 2026-2027.
    $this->travelTo('2026-10-15');
    $this->gradeFour = GradeLevel::factory()->create(['name' => 'Grade 4', 'level_order' => 7]);
    $this->gradeFive = GradeLevel::factory()->create(['name' => 'Grade 5', 'level_order' => 8]);
    $this->nextYear = Curriculum::factory()->for($this->gradeFive)->create(['school_year' => '2026-2027']);
    Subject::factory()->count(2)->for($this->nextYear)->create();
});

/**
 * @param  array<string, mixed>  $attributes
 */
function lastYearStudent(GradeLevel $gradeLevel, array $attributes = []): Enrollment
{
    return Enrollment::factory()->withDocuments()->create([
        'grade_level_id' => $gradeLevel->id,
        'school_year' => '2025-2026',
        'enrollment_status' => 'APPROVED',
        'age' => 9,
        ...$attributes,
    ]);
}

test('last year\'s students apply for this year one grade level up', function () {
    $lastYear = lastYearStudent($this->gradeFour);

    $this->seed(ReturningStudentsSeeder::class);

    $application = Enrollment::where('school_year', '2026-2027')->with(['subjects', 'officeVerification', 'academicHistory'])->sole();

    expect($application->student_id)->toBe($lastYear->student_id)
        ->and($application->grade_level_id)->toBe($this->gradeFive->id)
        ->and($application->enrollment_status)->toBe('PENDING')
        ->and($application->enrollee_user_id)->toBe($lastYear->enrollee_user_id)
        ->and($application->age)->toBe(10)
        ->and($application->subjects)->toHaveCount(2)
        ->and($application->academicHistory->last_grade_level_completed)->toBe('Grade 4')
        ->and($application->officeVerification->form_138_path)->toBeNull()
        ->and($application->officeVerification->birth_certificate_path)->not->toBeNull()
        ->and($application->isReturning())->toBeTrue()
        ->and($lastYear->nextApplication()?->id)->toBe($application->id);
});

test('they show up on Send Grades for an admin', function () {
    lastYearStudent($this->gradeFour);

    $this->seed(ReturningStudentsSeeder::class);

    expect(SendGradesToNextApplication::candidatesQuery(User::factory()->admin()->create(), '2025-2026')->count())->toBe(1);
});

test('students who already applied, weren\'t approved, or completed the highest grade are skipped', function () {
    $alreadyApplied = lastYearStudent($this->gradeFour);
    Enrollment::factory()->create(['student_id' => $alreadyApplied->student_id, 'school_year' => '2026-2027', 'grade_level_id' => $this->gradeFive->id]);
    lastYearStudent($this->gradeFour, ['enrollment_status' => 'REJECTED']);
    lastYearStudent($this->gradeFive);

    $this->seed(ReturningStudentsSeeder::class);

    expect(Enrollment::where('school_year', '2026-2027')->count())->toBe(1);
});

test('a full grade level takes no more', function () {
    Section::factory()->for($this->nextYear)->create(['name' => 'A', 'slots' => 1]);
    lastYearStudent($this->gradeFour);
    lastYearStudent($this->gradeFour);

    $this->seed(ReturningStudentsSeeder::class);

    expect(Enrollment::where('school_year', '2026-2027')->count())->toBe(1)
        ->and($this->nextYear->isFull())->toBeTrue();
});
