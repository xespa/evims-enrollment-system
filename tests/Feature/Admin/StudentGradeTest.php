<?php

use App\Models\Curriculum;
use App\Models\Enrollment;
use App\Models\GradeSheet;
use App\Models\StudentGrade;
use App\Models\Subject;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * A grade sheet for a 2026-2027 subject.
 */
function studentGradeSheet(): GradeSheet
{
    return GradeSheet::factory()->create([
        'subject_id' => Subject::factory()->state([
            'curriculum_id' => Curriculum::factory()->state(['school_year' => '2026-2027']),
        ]),
    ]);
}

/**
 * An application for the grade sheet's grade level and school year that
 * takes its subject, approved unless overridden.
 *
 * @param  array<string, mixed>  $attributes
 */
function gradableEnrollment(GradeSheet $gradeSheet, array $attributes = []): Enrollment
{
    $curriculum = $gradeSheet->subject->curriculum;

    $enrollment = Enrollment::factory()->create([
        'grade_level_id' => $curriculum->grade_level_id,
        'school_year' => $curriculum->school_year,
        'enrollment_status' => 'APPROVED',
        ...$attributes,
    ]);
    $enrollment->subjects()->attach($gradeSheet->subject_id);

    return $enrollment;
}

test('the create page lists only the students who can be graded on the sheet', function () {
    $gradeSheet = studentGradeSheet();
    $gradable = gradableEnrollment($gradeSheet);
    $alreadyGraded = gradableEnrollment($gradeSheet);
    StudentGrade::factory()->for($gradeSheet)->create(['enrollment_id' => $alreadyGraded->id]);

    gradableEnrollment($gradeSheet, ['enrollment_status' => 'PENDING']);
    gradableEnrollment($gradeSheet, ['cancelled_at' => now()]);
    gradableEnrollment($gradeSheet)->forceFill(['archived_at' => now()])->save();
    // Same grade level and year, but not taking this subject.
    Enrollment::factory()->create([
        'grade_level_id' => $gradeSheet->subject->curriculum->grade_level_id,
        'school_year' => '2026-2027',
        'enrollment_status' => 'APPROVED',
    ]);

    $this->actingAs($gradeSheet->teacher)
        ->get(route('admin.grade-sheets.student-grades.create', $gradeSheet))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/StudentGrades/Create')
            ->where('gradeSheet.id', $gradeSheet->id)
            ->has('students', 1)
            ->where('students.0.enrollment_id', $gradable->id)
            ->where('students.0.name', $gradable->student->full_name)
        );
});

test('a teacher adds a student with their term grades', function () {
    $gradeSheet = studentGradeSheet();
    $enrollment = gradableEnrollment($gradeSheet);

    $this->actingAs($gradeSheet->teacher)
        ->post(route('admin.grade-sheets.student-grades.store', $gradeSheet), [
            'enrollment_id' => $enrollment->id,
            'term_1' => '85.5',
            'term_2' => '90',
            'term_3' => '',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('admin.grade-sheets.show', $gradeSheet));

    $studentGrade = StudentGrade::sole();

    expect($studentGrade->grade_sheet_id)->toBe($gradeSheet->id)
        ->and($studentGrade->enrollment_id)->toBe($enrollment->id)
        ->and($studentGrade->term_1)->toBe('85.50')
        ->and($studentGrade->term_2)->toBe('90.00')
        ->and($studentGrade->term_3)->toBeNull();
});

test('save and add another comes back to add the next student', function () {
    $gradeSheet = studentGradeSheet();

    $this->actingAs($gradeSheet->teacher)
        ->post(route('admin.grade-sheets.student-grades.store', $gradeSheet), [
            'enrollment_id' => gradableEnrollment($gradeSheet)->id,
            'term_1' => '80',
            'add_another' => true,
        ])
        ->assertRedirect(route('admin.grade-sheets.student-grades.create', $gradeSheet));
});

test('adding a student is validated', function (Closure $payload, string $error) {
    $gradeSheet = studentGradeSheet();

    $this->actingAs($gradeSheet->teacher)
        ->post(route('admin.grade-sheets.student-grades.store', $gradeSheet), $payload($gradeSheet))
        ->assertSessionHasErrors($error);

    expect(StudentGrade::count())->toBe(0);
})->with([
    'no student' => [fn () => ['term_1' => '80'], 'enrollment_id'],
    'not enrolled in the subject' => [fn () => ['enrollment_id' => Enrollment::factory()->create(['enrollment_status' => 'APPROVED'])->id], 'enrollment_id'],
    'application not approved' => [fn (GradeSheet $gradeSheet) => ['enrollment_id' => gradableEnrollment($gradeSheet, ['enrollment_status' => 'PENDING'])->id], 'enrollment_id'],
    'grade over 100' => [fn (GradeSheet $gradeSheet) => ['enrollment_id' => gradableEnrollment($gradeSheet)->id, 'term_1' => '101'], 'term_1'],
    'negative grade' => [fn (GradeSheet $gradeSheet) => ['enrollment_id' => gradableEnrollment($gradeSheet)->id, 'term_2' => '-1'], 'term_2'],
    'too many decimals' => [fn (GradeSheet $gradeSheet) => ['enrollment_id' => gradableEnrollment($gradeSheet)->id, 'term_3' => '85.555'], 'term_3'],
    'not a number' => [fn (GradeSheet $gradeSheet) => ['enrollment_id' => gradableEnrollment($gradeSheet)->id, 'term_1' => 'A'], 'term_1'],
]);

test('a student can only be on a grade sheet once', function () {
    $gradeSheet = studentGradeSheet();
    $enrollment = gradableEnrollment($gradeSheet);
    StudentGrade::factory()->for($gradeSheet)->create(['enrollment_id' => $enrollment->id]);

    $this->actingAs($gradeSheet->teacher)
        ->post(route('admin.grade-sheets.student-grades.store', $gradeSheet), ['enrollment_id' => $enrollment->id])
        ->assertSessionHasErrors(['enrollment_id' => 'This student is already on the grade sheet.']);

    expect(StudentGrade::count())->toBe(1);
});

test('the edit page shows the student and their grades', function () {
    $studentGrade = StudentGrade::factory()->create(['term_1' => 81, 'term_2' => 82, 'term_3' => 83]);

    $this->actingAs($studentGrade->gradeSheet->teacher)
        ->get(route('admin.student-grades.edit', $studentGrade))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/StudentGrades/Edit')
            ->where('studentGrade.id', $studentGrade->id)
            ->where('studentGrade.term_2', '82.00')
            ->where('studentGrade.final_grade', 82)
            ->where('studentGrade.remarks', 'Passed')
        );
});

test('a teacher edits a student\'s grades', function () {
    $studentGrade = StudentGrade::factory()->ungraded()->create();

    $this->actingAs($studentGrade->gradeSheet->teacher)
        ->put(route('admin.student-grades.update', $studentGrade), [
            'term_1' => '75',
            'term_2' => '78.25',
            'term_3' => '80',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('admin.grade-sheets.show', $studentGrade->grade_sheet_id));

    $studentGrade->refresh();

    expect([$studentGrade->term_1, $studentGrade->term_2, $studentGrade->term_3])->toBe(['75.00', '78.25', '80.00'])
        ->and($studentGrade->finalGrade())->toBe(77.75);
});

test('editing grades is validated', function () {
    $studentGrade = StudentGrade::factory()->create(['term_1' => 80]);

    $this->actingAs($studentGrade->gradeSheet->teacher)
        ->put(route('admin.student-grades.update', $studentGrade), ['term_1' => '150'])
        ->assertSessionHasErrors('term_1');

    expect($studentGrade->fresh()->term_1)->toBe('80.00');
});

test('a teacher removes a student from the grade sheet', function () {
    $studentGrade = StudentGrade::factory()->create();

    $this->actingAs($studentGrade->gradeSheet->teacher)
        ->delete(route('admin.student-grades.destroy', $studentGrade))
        ->assertRedirect(route('admin.grade-sheets.show', $studentGrade->grade_sheet_id));

    expect(StudentGrade::count())->toBe(0);
});

test('teachers cannot change grades on another teacher\'s grade sheet', function () {
    $gradeSheet = studentGradeSheet();
    $studentGrade = StudentGrade::factory()->for($gradeSheet)->create(['term_1' => 80]);
    $this->actingAs(User::factory()->teacher()->create());

    $this->get(route('admin.grade-sheets.student-grades.create', $gradeSheet))->assertForbidden();
    $this->post(route('admin.grade-sheets.student-grades.store', $gradeSheet), ['enrollment_id' => gradableEnrollment($gradeSheet)->id])->assertForbidden();
    $this->get(route('admin.student-grades.edit', $studentGrade))->assertForbidden();
    $this->put(route('admin.student-grades.update', $studentGrade), ['term_1' => '99'])->assertForbidden();
    $this->delete(route('admin.student-grades.destroy', $studentGrade))->assertForbidden();

    expect($studentGrade->fresh()->term_1)->toBe('80.00')
        ->and(StudentGrade::count())->toBe(1);
});

test('admins can enter grades on any grade sheet', function () {
    $gradeSheet = studentGradeSheet();

    $this->actingAs(User::factory()->admin()->create())
        ->post(route('admin.grade-sheets.student-grades.store', $gradeSheet), [
            'enrollment_id' => gradableEnrollment($gradeSheet)->id,
            'term_1' => '90',
        ])
        ->assertSessionHasNoErrors();

    expect(StudentGrade::count())->toBe(1);
});

test('registrars and cashiers cannot enter grades', function (string $role) {
    $gradeSheet = studentGradeSheet();

    $this->actingAs(User::factory()->create(['role' => $role]))
        ->post(route('admin.grade-sheets.student-grades.store', $gradeSheet), [
            'enrollment_id' => gradableEnrollment($gradeSheet)->id,
        ])
        ->assertForbidden();
})->with(['REGISTRAR', 'CASHIER']);
