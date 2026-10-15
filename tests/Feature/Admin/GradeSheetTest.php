<?php

use App\Models\Curriculum;
use App\Models\GradeSheet;
use App\Models\StudentGrade;
use App\Models\Subject;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * A subject in a published 2026-2027 curriculum.
 *
 * @param  array<string, mixed>  $curriculum
 */
function gradeSheetSubject(array $curriculum = []): Subject
{
    return Subject::factory()->create([
        'curriculum_id' => Curriculum::factory()->state(['school_year' => '2026-2027', ...$curriculum]),
    ]);
}

test('guests cannot open grade sheets', function () {
    $this->get(route('admin.grade-sheets.index'))->assertRedirect(route('login'));
});

test('registrars and cashiers cannot open grade sheets', function (string $role) {
    $gradeSheet = GradeSheet::factory()->create();

    $this->actingAs(User::factory()->create(['role' => $role]))
        ->get(route('admin.grade-sheets.show', $gradeSheet))
        ->assertForbidden();
})->with(['REGISTRAR', 'CASHIER']);

test('teachers only see their own grade sheets', function () {
    $teacher = User::factory()->teacher()->create();
    $own = GradeSheet::factory()->for($teacher, 'teacher')->create();
    GradeSheet::factory()->create();

    $this->actingAs($teacher)
        ->get(route('admin.grade-sheets.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/GradeSheets/Index')
            ->has('gradeSheets.data', 1)
            ->where('gradeSheets.data.0.id', $own->id)
            ->where('gradeSheets.data.0.number', $own->number)
        );
});

test('admins see every teacher\'s grade sheets, filtered by school year', function () {
    GradeSheet::factory()->create(['subject_id' => gradeSheetSubject()]);
    GradeSheet::factory()->create(['subject_id' => gradeSheetSubject(['school_year' => '2025-2026'])]);

    $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.grade-sheets.index', ['school_year' => '2026-2027']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('gradeSheets.data', 1)
            ->where('gradeSheets.data.0.school_year', '2026-2027')
        );
});

test('the create page offers published subjects and fixes a teacher\'s own name', function () {
    $teacher = User::factory()->teacher()->create();
    $subject = gradeSheetSubject();
    gradeSheetSubject(['school_year' => '2027-2028', 'is_draft' => true]);

    $this->actingAs($teacher)
        ->get(route('admin.grade-sheets.create'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/GradeSheets/Create')
            ->has('subjects', 1)
            ->where('subjects.0.id', $subject->id)
            ->where('schoolYears', ['2026-2027'])
            ->where('currentTeacher.id', $teacher->id)
            ->where('teachers', [])
        );
});

test('admins choose from the active teachers', function () {
    $teacher = User::factory()->teacher()->create();
    User::factory()->teacher()->deactivated()->create();
    User::factory()->registrar()->create();

    $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.grade-sheets.create'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('currentTeacher', null)
            ->has('teachers', 1)
            ->where('teachers.0.id', $teacher->id)
        );
});

test('a teacher creates a grade sheet for themselves and goes on to add students', function () {
    $teacher = User::factory()->teacher()->create();
    $otherTeacher = User::factory()->teacher()->create();
    $subject = gradeSheetSubject();

    $response = $this->actingAs($teacher)
        ->post(route('admin.grade-sheets.store'), [
            'subject_id' => $subject->id,
            // Ignored: a teacher's sheet is always their own.
            'teacher_id' => $otherTeacher->id,
        ]);

    $gradeSheet = GradeSheet::sole();

    $response->assertSessionHasNoErrors()
        ->assertRedirect(route('admin.grade-sheets.student-grades.create', $gradeSheet));

    expect($gradeSheet->teacher_id)->toBe($teacher->id)
        ->and($gradeSheet->subject_id)->toBe($subject->id)
        ->and($gradeSheet->number)->toBe('GS-'.str_pad((string) $gradeSheet->id, 5, '0', STR_PAD_LEFT));
});

test('an admin creates a grade sheet for a teacher', function () {
    $teacher = User::factory()->teacher()->create();

    $this->actingAs(User::factory()->admin()->create())
        ->post(route('admin.grade-sheets.store'), [
            'subject_id' => gradeSheetSubject()->id,
            'teacher_id' => $teacher->id,
        ])
        ->assertSessionHasNoErrors();

    expect(GradeSheet::sole()->teacher_id)->toBe($teacher->id);
});

test('creating a grade sheet is validated', function (Closure $payload, string $error) {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('admin.grade-sheets.store'), $payload($admin))
        ->assertSessionHasErrors($error);

    expect(GradeSheet::count())->toBe(0);
})->with([
    'no subject' => [fn () => ['teacher_id' => User::factory()->teacher()->create()->id], 'subject_id'],
    'unknown subject' => [fn () => ['subject_id' => 999, 'teacher_id' => User::factory()->teacher()->create()->id], 'subject_id'],
    'no teacher' => [fn () => ['subject_id' => gradeSheetSubject()->id], 'teacher_id'],
    'not a teacher' => [fn (User $admin) => ['subject_id' => gradeSheetSubject()->id, 'teacher_id' => $admin->id], 'teacher_id'],
]);

test('a teacher can only have one grade sheet per subject', function () {
    $gradeSheet = GradeSheet::factory()->create();

    $this->actingAs($gradeSheet->teacher)
        ->post(route('admin.grade-sheets.store'), ['subject_id' => $gradeSheet->subject_id])
        ->assertSessionHasErrors(['subject_id' => 'This teacher already has a grade sheet for this subject.']);
});

test('registrars and cashiers cannot create grade sheets', function (string $role) {
    $this->actingAs(User::factory()->create(['role' => $role]))
        ->post(route('admin.grade-sheets.store'), ['subject_id' => gradeSheetSubject()->id])
        ->assertForbidden();
})->with(['REGISTRAR', 'CASHIER']);

test('the grade sheet shows its details and each student\'s grades', function () {
    $gradeSheet = GradeSheet::factory()->create(['subject_id' => gradeSheetSubject()]);
    StudentGrade::factory()->for($gradeSheet)->create(['term_1' => 80, 'term_2' => 85, 'term_3' => 90]);
    StudentGrade::factory()->for($gradeSheet)->create(['term_1' => 70, 'term_2' => 72, 'term_3' => 74]);
    StudentGrade::factory()->for($gradeSheet)->create(['term_1' => 88, 'term_2' => null, 'term_3' => null]);

    $this->actingAs($gradeSheet->teacher)
        ->get(route('admin.grade-sheets.show', $gradeSheet))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/GradeSheets/Show')
            ->where('gradeSheet.number', $gradeSheet->number)
            ->where('gradeSheet.school_year', '2026-2027')
            ->where('gradeSheet.teacher', $gradeSheet->teacher->name)
            ->has('studentGrades', 3)
        );

    expect($gradeSheet->studentGrades()->get()->map(fn (StudentGrade $row) => [$row->finalGrade(), $row->remarks()])->all())
        ->toEqualCanonicalizing([[85.0, 'Passed'], [72.0, 'Failed'], [null, null]]);
});

test('teachers cannot open, print or delete another teacher\'s grade sheet', function () {
    $gradeSheet = GradeSheet::factory()->create();
    $this->actingAs(User::factory()->teacher()->create());

    $this->get(route('admin.grade-sheets.show', $gradeSheet))->assertForbidden();
    $this->get(route('admin.grade-sheets.print.show', $gradeSheet))->assertForbidden();
    $this->delete(route('admin.grade-sheets.destroy', $gradeSheet))->assertForbidden();

    expect($gradeSheet->fresh())->not->toBeNull();
});

test('the grade sheet prints as a pdf', function () {
    $gradeSheet = GradeSheet::factory()->create();
    StudentGrade::factory()->for($gradeSheet)->create();

    $this->actingAs($gradeSheet->teacher)
        ->get(route('admin.grade-sheets.print.show', $gradeSheet))
        ->assertOk()
        ->assertHeader('Content-Type', 'application/pdf')
        ->assertHeader('Content-Disposition', "inline; filename=grade-sheet-{$gradeSheet->number}.pdf");
});

test('admins can open and print any grade sheet', function () {
    $gradeSheet = GradeSheet::factory()->create();
    $this->actingAs(User::factory()->admin()->create());

    $this->get(route('admin.grade-sheets.show', $gradeSheet))->assertOk();
    $this->get(route('admin.grade-sheets.print.show', $gradeSheet))->assertOk();
});

test('deleting a grade sheet deletes its student grades', function () {
    $gradeSheet = GradeSheet::factory()->create();
    StudentGrade::factory()->for($gradeSheet)->create();

    $this->actingAs($gradeSheet->teacher)
        ->delete(route('admin.grade-sheets.destroy', $gradeSheet))
        ->assertRedirect(route('admin.grade-sheets.index'));

    expect(GradeSheet::count())->toBe(0)
        ->and(StudentGrade::count())->toBe(0);
});
