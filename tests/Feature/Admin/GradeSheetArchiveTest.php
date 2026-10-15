<?php

use App\Models\Enrollment;
use App\Models\GradeSheet;
use App\Models\StudentGrade;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('teachers archive a grade sheet instead of deleting it', function () {
    $gradeSheet = GradeSheet::factory()->create();
    StudentGrade::factory()->for($gradeSheet)->create(['term_1' => 90]);

    $this->actingAs($gradeSheet->teacher)
        ->post(route('admin.grade-sheets.archive.store', $gradeSheet))
        ->assertRedirect(route('admin.grade-sheets.index'));

    $gradeSheet->refresh();

    expect($gradeSheet->isArchived())->toBeTrue()
        ->and($gradeSheet->archived_by)->toBe($gradeSheet->teacher_id)
        // Nothing is lost.
        ->and($gradeSheet->studentGrades()->count())->toBe(1);
});

test('grade sheets can no longer be deleted', function () {
    $gradeSheet = GradeSheet::factory()->create();

    $this->actingAs($gradeSheet->teacher)
        ->delete("/admin/grade-sheets/{$gradeSheet->id}")
        ->assertMethodNotAllowed();

    expect($gradeSheet->fresh())->not->toBeNull();
});

test('archived sheets leave the list and show under the archive', function () {
    $teacher = User::factory()->teacher()->create();
    $inUse = GradeSheet::factory()->for($teacher, 'teacher')->create();
    $archived = GradeSheet::factory()->for($teacher, 'teacher')->archived()->create();
    // Another teacher's archived sheet stays out of sight.
    GradeSheet::factory()->archived()->create();

    $this->actingAs($teacher)
        ->get(route('admin.grade-sheets.index', ['school_year' => '']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('gradeSheets.data', 1)
            ->where('gradeSheets.data.0.id', $inUse->id)
            ->where('filters.archived', false)
            ->where('archivedCount', 1));

    $this->actingAs($teacher)
        ->get(route('admin.grade-sheets.index', ['school_year' => '', 'archived' => 1]))
        ->assertInertia(fn (Assert $page) => $page
            ->has('gradeSheets.data', 1)
            ->where('gradeSheets.data.0.id', $archived->id)
            ->whereNot('gradeSheets.data.0.archived_at', null)
            ->where('filters.archived', true));
});

test('archived sheets can be opened and printed but not edited', function () {
    $gradeSheet = GradeSheet::factory()->archived()->create();
    $studentGrade = StudentGrade::factory()->for($gradeSheet)->create();
    $this->actingAs($gradeSheet->teacher);

    $this->get(route('admin.grade-sheets.show', $gradeSheet))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->whereNot('gradeSheet.archived_at', null)
            ->where('ungradedStudents', []));
    $this->get(route('admin.grade-sheets.print.show', $gradeSheet))->assertOk();

    $this->put(route('admin.grade-sheets.grades.update', $gradeSheet), [
        'grades' => [['id' => $studentGrade->id, 'term_1' => 80]],
    ])->assertForbidden();
    $this->put(route('admin.grade-sheets.update', $gradeSheet), ['schedule_days' => ['MON']])->assertForbidden();
    $this->delete(route('admin.student-grades.destroy', $studentGrade))->assertForbidden();
});

test('a restored sheet is back in use with its grades', function () {
    $gradeSheet = GradeSheet::factory()->archived()->create();
    StudentGrade::factory()->for($gradeSheet)->create();

    $this->actingAs($gradeSheet->teacher)
        ->delete(route('admin.grade-sheets.archive.destroy', $gradeSheet))
        ->assertRedirect(route('admin.grade-sheets.show', $gradeSheet));

    $gradeSheet->refresh();

    expect($gradeSheet->isArchived())->toBeFalse()
        ->and($gradeSheet->archived_by)->toBeNull()
        ->and($gradeSheet->studentGrades()->count())->toBe(1);
});

test('admins can archive and restore any teacher\'s sheet', function () {
    $gradeSheet = GradeSheet::factory()->create();
    $admin = User::factory()->admin()->create();
    $this->actingAs($admin);

    $this->post(route('admin.grade-sheets.archive.store', $gradeSheet))->assertRedirect();
    expect($gradeSheet->fresh()->archived_by)->toBe($admin->id);

    $this->delete(route('admin.grade-sheets.archive.destroy', $gradeSheet))->assertRedirect();
    expect($gradeSheet->fresh()->isArchived())->toBeFalse();
});

test('teachers cannot restore another teacher\'s sheet', function () {
    $gradeSheet = GradeSheet::factory()->archived()->create();

    $this->actingAs(User::factory()->teacher()->create())
        ->delete(route('admin.grade-sheets.archive.destroy', $gradeSheet))
        ->assertForbidden();

    expect($gradeSheet->fresh()->isArchived())->toBeTrue();
});

test('archived sheets\' grades stop counting for students until restored', function () {
    $enrollment = Enrollment::factory()->create(['enrollment_status' => 'APPROVED']);
    $gradeSheet = GradeSheet::factory()->archived()->create();
    StudentGrade::factory()->for($gradeSheet)->create(['enrollment_id' => $enrollment->id, 'term_1' => 90, 'term_2' => 90, 'term_3' => 90]);

    expect($enrollment->gradeReport())->toBe([]);

    $gradeSheet->restoreFromArchive();

    expect($enrollment->gradeReport())->toHaveCount(1);
});

test('the create page marks a sheet the teacher archived', function () {
    $gradeSheet = GradeSheet::factory()->archived()->create();
    $gradeSheet->subject->curriculum->update(['is_draft' => false]);

    $this->actingAs($gradeSheet->teacher)
        ->get(route('admin.grade-sheets.create'))
        ->assertInertia(fn (Assert $page) => $page->where('subjects.0.grade_sheets.0.archived', true));
});

test('making a second sheet for an archived one points to restoring it', function () {
    $gradeSheet = GradeSheet::factory()->archived()->create();

    $this->actingAs($gradeSheet->teacher)
        ->post(route('admin.grade-sheets.store'), ['subject_id' => $gradeSheet->subject_id])
        ->assertSessionHasErrors(['subject_id' => "This teacher already has a grade sheet for this subject ({$gradeSheet->number}, archived). Restore it from the archive instead."]);
});
