<?php

use App\Actions\Enrollment\GenerateEnrollmentSummary;
use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\Student;
use App\Models\User;

/**
 * An enrollment of a boy or girl in the given grade level.
 *
 * @param  array<string, mixed>  $attributes
 */
function summaryEnrollment(GradeLevel $gradeLevel, string $sex, array $attributes = []): Enrollment
{
    return Enrollment::factory()->create([
        'student_id' => Student::factory()->state(['sex' => $sex]),
        'grade_level_id' => $gradeLevel->id,
        'school_year' => '2026-2027',
        'enrollment_status' => 'APPROVED',
        ...$attributes,
    ]);
}

test('guests cannot print the enrollment summary', function () {
    $this->get(route('admin.enrollment-summary.show'))->assertRedirect(route('login'));
});

test('admins and registrars can print the enrollment summary as a pdf', function (string $role) {
    $this->actingAs(User::factory()->create(['role' => $role]))
        ->get(route('admin.enrollment-summary.show', ['school_year' => '2026-2027']))
        ->assertOk()
        ->assertHeader('Content-Type', 'application/pdf')
        ->assertHeader('Content-Disposition', 'inline; filename=enrollment-summary-2026-2027.pdf');
})->with(['ADMIN', 'REGISTRAR']);

test('teachers and cashiers cannot print the enrollment summary', function (string $role) {
    $this->actingAs(User::factory()->create(['role' => $role]))
        ->get(route('admin.enrollment-summary.show'))
        ->assertForbidden();
})->with(['TEACHER', 'CASHIER']);

test('the school year must be a valid school year', function () {
    $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.enrollment-summary.show', ['school_year' => 'last year']))
        ->assertSessionHasErrors('school_year');
});

test('it counts approved boys and girls per level for the school year', function () {
    $nursery = GradeLevel::factory()->nursery()->create();
    GradeLevel::factory()->create(['name' => 'Pre-K 1', 'level_order' => 1]);
    $grade1 = GradeLevel::factory()->create(['name' => 'Grade 1', 'level_order' => 3]);
    $grade7 = GradeLevel::factory()->create(['name' => 'Grade 7', 'level_order' => 9]);

    summaryEnrollment($nursery, 'MALE');
    summaryEnrollment($nursery, 'FEMALE');
    summaryEnrollment($nursery, 'FEMALE');
    summaryEnrollment($grade1, 'MALE');
    summaryEnrollment($grade7, 'FEMALE');

    // None of these are enrolled for 2026-2027, so none are counted.
    summaryEnrollment($grade1, 'MALE', ['enrollment_status' => 'PENDING']);
    summaryEnrollment($grade1, 'MALE', ['enrollment_status' => 'REJECTED']);
    summaryEnrollment($grade1, 'MALE', ['cancelled_at' => now()]);
    summaryEnrollment($grade1, 'MALE', ['school_year' => '2025-2026']);
    summaryEnrollment($grade1, 'MALE')->forceFill(['archived_at' => now()])->save();

    $summary = app(GenerateEnrollmentSummary::class)->viewData('2026-2027');

    expect($summary['departments'])->toBe([
        ['name' => 'PRE-ELEMENTARY', 'levels' => [
            ['label' => 'LEVEL A', 'male' => 1, 'female' => 2, 'total' => 3],
            ['label' => 'LEVEL B', 'male' => 0, 'female' => 0, 'total' => 0],
        ]],
        ['name' => 'ELEMENTARY', 'levels' => [
            ['label' => 'LEVEL 1', 'male' => 1, 'female' => 0, 'total' => 1],
        ]],
        ['name' => 'JUNIOR HIGHSCHOOL', 'levels' => [
            ['label' => 'LEVEL 7', 'male' => 0, 'female' => 1, 'total' => 1],
        ]],
    ])
        ->and($summary['totals'])->toBe(['male' => 2, 'female' => 3, 'total' => 5])
        ->and($summary['schoolYear'])->toBe('2026-2027');
});

test('it defaults to the current school year', function () {
    // August 2027 falls in SY 2027-2028; a later year's applications don't change that.
    $this->travelTo('2027-08-01');
    summaryEnrollment(GradeLevel::factory()->create(), 'MALE', ['school_year' => '2028-2029']);

    $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.enrollment-summary.show'))
        ->assertOk()
        ->assertHeader('Content-Disposition', 'inline; filename=enrollment-summary-2027-2028.pdf');
});
