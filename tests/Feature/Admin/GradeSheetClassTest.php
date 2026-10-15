<?php

use App\Models\Enrollment;
use App\Models\GradeSheet;
use App\Models\StudentGrade;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('the grade sheet offers every student taking the subject who is not on it yet', function () {
    $gradeSheet = studentGradeSheet();
    $first = gradableEnrollment($gradeSheet);
    $second = gradableEnrollment($gradeSheet);
    $alreadyAdded = gradableEnrollment($gradeSheet);
    StudentGrade::factory()->for($gradeSheet)->create(['enrollment_id' => $alreadyAdded->id]);
    gradableEnrollment($gradeSheet, ['enrollment_status' => 'PENDING']);

    $this->actingAs($gradeSheet->teacher)
        ->get(route('admin.grade-sheets.show', $gradeSheet))
        ->assertInertia(fn (Assert $page) => $page
            ->has('ungradedStudents', 2)
            ->where('ungradedStudents', fn ($students) => collect($students)->pluck('enrollment_id')->sort()->values()->all() === collect([$first->id, $second->id])->sort()->values()->all()));
});

test('a teacher adds the whole class at once and goes on to enter their grades', function () {
    $gradeSheet = studentGradeSheet();
    $enrollments = collect(range(1, 5))->map(fn () => gradableEnrollment($gradeSheet));

    $this->actingAs($gradeSheet->teacher)
        ->post(route('admin.grade-sheets.students.store', $gradeSheet), [
            'enrollment_ids' => $enrollments->pluck('id')->all(),
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('admin.grade-sheets.show', $gradeSheet));

    expect($gradeSheet->studentGrades()->pluck('enrollment_id')->sort()->values()->all())
        ->toBe($enrollments->pluck('id')->sort()->values()->all())
        ->and($gradeSheet->studentGrades()->whereNotNull('term_1')->count())->toBe(0);
});

test('a teacher can add just some of the class', function () {
    $gradeSheet = studentGradeSheet();
    $chosen = gradableEnrollment($gradeSheet);
    gradableEnrollment($gradeSheet);

    $this->actingAs($gradeSheet->teacher)
        ->post(route('admin.grade-sheets.students.store', $gradeSheet), ['enrollment_ids' => [$chosen->id]])
        ->assertSessionHasNoErrors();

    expect($gradeSheet->studentGrades()->pluck('enrollment_id')->all())->toBe([$chosen->id]);
});

test('adding students is validated', function (Closure $enrollmentIds, string $error) {
    $gradeSheet = studentGradeSheet();
    $ids = $enrollmentIds($gradeSheet);
    $rowsBefore = $gradeSheet->studentGrades()->count();

    $this->actingAs($gradeSheet->teacher)
        ->post(route('admin.grade-sheets.students.store', $gradeSheet), ['enrollment_ids' => $ids])
        ->assertSessionHasErrors($error);

    expect($gradeSheet->studentGrades()->count())->toBe($rowsBefore);
})->with([
    'nobody chosen' => [fn () => [], 'enrollment_ids'],
    'not taking the subject' => [fn () => [Enrollment::factory()->create(['enrollment_status' => 'APPROVED'])->id], 'enrollment_ids.0'],
    'already on the sheet' => [function ($gradeSheet) {
        $enrollment = gradableEnrollment($gradeSheet);
        StudentGrade::factory()->for($gradeSheet)->create(['enrollment_id' => $enrollment->id]);

        return [$enrollment->id];
    }, 'enrollment_ids.0'],
    'the same student twice' => [function ($gradeSheet) {
        $id = gradableEnrollment($gradeSheet)->id;

        return [$id, $id];
    }, 'enrollment_ids.0'],
]);

test('none are added when any chosen student is invalid', function () {
    $gradeSheet = studentGradeSheet();
    $valid = gradableEnrollment($gradeSheet);
    $notTakingSubject = Enrollment::factory()->create(['enrollment_status' => 'APPROVED']);

    $this->actingAs($gradeSheet->teacher)
        ->post(route('admin.grade-sheets.students.store', $gradeSheet), ['enrollment_ids' => [$valid->id, $notTakingSubject->id]])
        ->assertSessionHasErrors('enrollment_ids.1');

    expect($gradeSheet->studentGrades()->count())->toBe(0);
});

test('the grades page lists everyone on the sheet', function () {
    $gradeSheet = studentGradeSheet();
    StudentGrade::factory()->for($gradeSheet)->count(3)->ungraded()->create();

    $this->actingAs($gradeSheet->teacher)
        ->get(route('admin.grade-sheets.grades.edit', $gradeSheet))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/GradeSheetGrades/Edit')
            ->where('gradeSheet.id', $gradeSheet->id)
            ->has('studentGrades', 3));
});

test('a teacher saves the whole class\'s grades at once', function () {
    $gradeSheet = studentGradeSheet();
    [$first, $second] = StudentGrade::factory()->for($gradeSheet)->count(2)->ungraded()->create();

    $this->actingAs($gradeSheet->teacher)
        ->put(route('admin.grade-sheets.grades.update', $gradeSheet), [
            'grades' => [
                ['id' => $first->id, 'term_1' => '80', 'term_2' => '85.5', 'term_3' => '90'],
                ['id' => $second->id, 'term_1' => '70', 'term_2' => '', 'term_3' => null],
            ],
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('admin.grade-sheets.show', $gradeSheet));

    $first->refresh();
    $second->refresh();

    expect([$first->term_1, $first->term_2, $first->term_3])->toBe(['80.00', '85.50', '90.00'])
        ->and($first->finalGrade())->toBe(85.17)
        ->and([$second->term_1, $second->term_2, $second->term_3])->toBe(['70.00', null, null]);
});

test('saving the class\'s grades is validated row by row, saving nothing on error', function () {
    $gradeSheet = studentGradeSheet();
    [$first, $second] = StudentGrade::factory()->for($gradeSheet)->count(2)->ungraded()->create();

    $this->actingAs($gradeSheet->teacher)
        ->put(route('admin.grade-sheets.grades.update', $gradeSheet), [
            'grades' => [
                ['id' => $first->id, 'term_1' => '88'],
                ['id' => $second->id, 'term_1' => '150'],
            ],
        ])
        ->assertSessionHasErrors('grades.1.term_1');

    expect($first->fresh()->term_1)->toBeNull();
});

test('rows from another grade sheet cannot be saved through this one', function () {
    $gradeSheet = studentGradeSheet();
    $otherRow = StudentGrade::factory()->ungraded()->create();

    $this->actingAs($gradeSheet->teacher)
        ->put(route('admin.grade-sheets.grades.update', $gradeSheet), [
            'grades' => [['id' => $otherRow->id, 'term_1' => '99']],
        ])
        ->assertSessionHasErrors('grades.0.id');

    expect($otherRow->fresh()->term_1)->toBeNull();
});

test('other teachers cannot add students or enter grades on the sheet', function () {
    $gradeSheet = studentGradeSheet();
    $row = StudentGrade::factory()->for($gradeSheet)->ungraded()->create();
    $this->actingAs(User::factory()->teacher()->create());

    $this->post(route('admin.grade-sheets.students.store', $gradeSheet), ['enrollment_ids' => [gradableEnrollment($gradeSheet)->id]])->assertForbidden();
    $this->get(route('admin.grade-sheets.grades.edit', $gradeSheet))->assertForbidden();
    $this->put(route('admin.grade-sheets.grades.update', $gradeSheet), ['grades' => [['id' => $row->id, 'term_1' => '99']]])->assertForbidden();

    expect($row->fresh()->term_1)->toBeNull()
        ->and($gradeSheet->studentGrades()->count())->toBe(1);
});

test('registrars and cashiers cannot use class grade entry', function (string $role) {
    $gradeSheet = studentGradeSheet();

    $this->actingAs(User::factory()->create(['role' => $role]))
        ->get(route('admin.grade-sheets.grades.edit', $gradeSheet))
        ->assertForbidden();
})->with(['REGISTRAR', 'CASHIER']);

test('saving only the changed rows from the grade sheet table leaves the rest alone', function () {
    $gradeSheet = studentGradeSheet();
    [$changed, $untouched] = StudentGrade::factory()->for($gradeSheet)->count(2)->create(['term_1' => 80, 'term_2' => 81, 'term_3' => 82]);

    $this->actingAs($gradeSheet->teacher)
        ->put(route('admin.grade-sheets.grades.update', $gradeSheet), [
            'grades' => [['id' => $changed->id, 'term_1' => '80', 'term_2' => '95', 'term_3' => '82']],
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('admin.grade-sheets.show', $gradeSheet));

    expect($changed->fresh()->term_2)->toBe('95.00')
        ->and([$untouched->fresh()->term_1, $untouched->fresh()->term_2, $untouched->fresh()->term_3])->toBe(['80.00', '81.00', '82.00']);
});

test('a new grade sheet starts with every student taking the subject', function () {
    $teacher = User::factory()->teacher()->create();
    $gradeSheetForEnrollments = studentGradeSheet();
    $subject = $gradeSheetForEnrollments->subject;
    $enrolled = collect(range(1, 3))->map(fn () => gradableEnrollment($gradeSheetForEnrollments));
    gradableEnrollment($gradeSheetForEnrollments, ['enrollment_status' => 'PENDING']);

    $this->actingAs($teacher)
        ->post(route('admin.grade-sheets.store'), ['subject_id' => $subject->id])
        ->assertSessionHasNoErrors()
        ->assertSessionHas('success', fn (string $message) => str_contains($message, 'created with 3 students'));

    $gradeSheet = GradeSheet::where('teacher_id', $teacher->id)->sole();

    expect($gradeSheet->studentGrades()->pluck('enrollment_id')->sort()->values()->all())
        ->toBe($enrolled->pluck('id')->sort()->values()->all())
        ->and($gradeSheet->studentGrades()->whereNotNull('term_1')->exists())->toBeFalse();
});

test('the teacher can choose to add the students later', function () {
    $teacher = User::factory()->teacher()->create();
    $existing = studentGradeSheet();
    gradableEnrollment($existing);

    $this->actingAs($teacher)
        ->post(route('admin.grade-sheets.store'), ['subject_id' => $existing->subject_id, 'add_students' => false])
        ->assertSessionHasNoErrors();

    expect(GradeSheet::where('teacher_id', $teacher->id)->sole()->studentGrades()->count())->toBe(0);
});

test('the create page shows how many students each subject would start with', function () {
    $gradeSheet = studentGradeSheet();
    gradableEnrollment($gradeSheet);
    gradableEnrollment($gradeSheet);
    gradableEnrollment($gradeSheet, ['enrollment_status' => 'PENDING']);
    gradableEnrollment($gradeSheet)->forceFill(['archived_at' => now()])->save();

    $this->actingAs(User::factory()->teacher()->create())
        ->get(route('admin.grade-sheets.create'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('subjects.0.id', $gradeSheet->subject_id)
            ->where('subjects.0.enrolled_students_count', 2));
});

test('the teacher\'s subjects show how many students take each one', function () {
    $teacher = User::factory()->teacher()->create();
    $withStudents = studentGradeSheet();
    gradableEnrollment($withStudents);
    gradableEnrollment($withStudents);
    gradableEnrollment($withStudents, ['enrollment_status' => 'PENDING']);
    $teacher->taughtSubjects()->attach($withStudents->subject_id);

    $this->actingAs($teacher)
        ->get(route('admin.grade-sheets.index', ['school_year' => '']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('mySubjects.0.id', $withStudents->subject_id)
            ->where('mySubjects.0.enrolled_students_count', 2));
});

test('the create page lists the chosen subject\'s students to check', function () {
    $gradeSheet = studentGradeSheet();
    $first = gradableEnrollment($gradeSheet);
    $second = gradableEnrollment($gradeSheet);
    gradableEnrollment($gradeSheet, ['enrollment_status' => 'PENDING']);

    $this->actingAs(User::factory()->teacher()->create())
        ->get(route('admin.grade-sheets.create', ['subject_id' => $gradeSheet->subject_id]))
        ->assertInertia(fn (Assert $page) => $page
            ->has('enrolledStudents', 2)
            ->where('enrolledStudents', fn ($students) => collect($students)->pluck('enrollment_id')->sort()->values()->all()
                === collect([$first->id, $second->id])->sort()->values()->all()));

    $this->get(route('admin.grade-sheets.create'))
        ->assertInertia(fn (Assert $page) => $page->where('enrolledStudents', null));
});

test('only the students the teacher kept ticked are added', function () {
    $teacher = User::factory()->teacher()->create();
    $existing = studentGradeSheet();
    $kept = gradableEnrollment($existing);
    gradableEnrollment($existing);

    $this->actingAs($teacher)
        ->post(route('admin.grade-sheets.store'), [
            'subject_id' => $existing->subject_id,
            'enrollment_ids' => [$kept->id],
        ])
        ->assertSessionHasNoErrors()
        ->assertSessionHas('success', fn (string $message) => str_contains($message, 'created with 1 student'));

    expect(GradeSheet::where('teacher_id', $teacher->id)->sole()->studentGrades()->pluck('enrollment_id')->all())
        ->toBe([$kept->id]);
});

test('unticking everyone starts the sheet empty', function () {
    $teacher = User::factory()->teacher()->create();
    $existing = studentGradeSheet();
    gradableEnrollment($existing);

    $this->actingAs($teacher)
        ->post(route('admin.grade-sheets.store'), ['subject_id' => $existing->subject_id, 'enrollment_ids' => []])
        ->assertSessionHasNoErrors();

    expect(GradeSheet::where('teacher_id', $teacher->id)->sole()->studentGrades()->count())->toBe(0);
});

test('students not taking the subject cannot be put on a new sheet', function () {
    $teacher = User::factory()->teacher()->create();
    $existing = studentGradeSheet();
    $otherClass = Enrollment::factory()->create(['enrollment_status' => 'APPROVED']);

    $this->actingAs($teacher)
        ->post(route('admin.grade-sheets.store'), [
            'subject_id' => $existing->subject_id,
            'enrollment_ids' => [$otherClass->id],
        ])
        ->assertSessionHasErrors(['enrollment_ids.0' => 'One of the chosen students isn’t taking this subject.']);

    expect(GradeSheet::where('teacher_id', $teacher->id)->exists())->toBeFalse();
});
