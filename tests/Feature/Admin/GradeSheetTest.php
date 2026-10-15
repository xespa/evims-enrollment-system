<?php

use App\Actions\GradeSheets\GenerateGradeSheet;
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

test('a teacher creates a grade sheet for themselves and goes on to its grades', function () {
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
        ->assertRedirect(route('admin.grade-sheets.show', $gradeSheet));

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

test('a grade sheet can be created with its class schedule', function () {
    $teacher = User::factory()->teacher()->create();

    $this->actingAs($teacher)
        ->post(route('admin.grade-sheets.store'), [
            'subject_id' => gradeSheetSubject()->id,
            'schedule_days' => ['MON', 'WED', 'FRI'],
            'start_time' => '08:00',
            'end_time' => '09:30',
        ])
        ->assertSessionHasNoErrors();

    $gradeSheet = GradeSheet::sole();

    expect($gradeSheet->schedule_days)->toBe(['MON', 'WED', 'FRI'])
        ->and($gradeSheet->scheduleLabel())->toBe('Mon, Wed, Fri · 8:00 AM – 9:30 AM');
});

test('the class schedule is validated', function (array $schedule, string $error) {
    $this->actingAs(User::factory()->teacher()->create())
        ->post(route('admin.grade-sheets.store'), ['subject_id' => gradeSheetSubject()->id, ...$schedule])
        ->assertSessionHasErrors($error);

    expect(GradeSheet::count())->toBe(0);
})->with([
    'ends before it starts' => [['start_time' => '10:00', 'end_time' => '09:00'], 'end_time'],
    'start without an end' => [['start_time' => '10:00'], 'end_time'],
    'end without a start' => [['end_time' => '10:00'], 'start_time'],
    'not a time' => [['start_time' => 'morning', 'end_time' => '10:00'], 'start_time'],
    'not a school day' => [['schedule_days' => ['SUN']], 'schedule_days.0'],
]);

test('the teacher can set or change the schedule of their grade sheet', function () {
    $gradeSheet = GradeSheet::factory()->create(['subject_id' => gradeSheetSubject()]);

    $this->actingAs($gradeSheet->teacher)
        ->patch(route('admin.grade-sheets.update', $gradeSheet), [
            'schedule_days' => ['TUE', 'THU'],
            'start_time' => '13:00',
            'end_time' => '14:00',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('admin.grade-sheets.show', $gradeSheet));

    $this->get(route('admin.grade-sheets.show', $gradeSheet))
        ->assertInertia(fn (Assert $page) => $page
            ->where('gradeSheet.schedule', 'Tue, Thu · 1:00 PM – 2:00 PM')
            ->where('gradeSheet.schedule_days', ['TUE', 'THU'])
            ->where('gradeSheet.start_time', '13:00')
            ->where('gradeSheet.end_time', '14:00'));
});

test('the subject and teacher cannot be changed with the schedule', function () {
    $gradeSheet = GradeSheet::factory()->create();
    $originalSubject = $gradeSheet->subject_id;

    $this->actingAs($gradeSheet->teacher)
        ->patch(route('admin.grade-sheets.update', $gradeSheet), [
            'subject_id' => Subject::factory()->create()->id,
            'teacher_id' => User::factory()->teacher()->create()->id,
        ]);

    $gradeSheet->refresh();
    expect($gradeSheet->subject_id)->toBe($originalSubject);
});

test('other teachers cannot change a grade sheet\'s schedule', function () {
    $gradeSheet = GradeSheet::factory()->create();

    $this->actingAs(User::factory()->teacher()->create())
        ->patch(route('admin.grade-sheets.update', $gradeSheet), ['schedule_days' => ['MON']])
        ->assertForbidden();

    expect($gradeSheet->fresh()->schedule_days)->toBeNull();
});

test('the printed grade sheet shows the teacher, subject, code, school year and schedule', function () {
    $subject = gradeSheetSubject();
    $subject->update(['name' => 'Mathematics', 'code' => 'MATH1']);
    $gradeSheet = GradeSheet::factory()->create([
        'subject_id' => $subject->id,
        'schedule_days' => ['MON', 'FRI'],
        'start_time' => '07:30',
        'end_time' => '08:30',
    ]);

    $html = view('pdf.grade-sheet', app(GenerateGradeSheet::class)->viewData($gradeSheet))->render();

    expect($html)->toContain($gradeSheet->teacher->name)
        ->toContain('Mathematics')
        ->toContain('MATH1')
        ->toContain('2026-2027')
        ->toContain('Mon, Fri · 7:30 AM – 8:30 AM');
});
