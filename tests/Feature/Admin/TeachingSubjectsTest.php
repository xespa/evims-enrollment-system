<?php

use App\Models\Curriculum;
use App\Models\GradeSheet;
use App\Models\Subject;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * A subject in a published (or draft) 2026-2027 curriculum.
 */
function teachableSubject(string $name = 'Mathematics', bool $isDraft = false): Subject
{
    return Subject::factory()->create([
        'name' => $name,
        'curriculum_id' => Curriculum::factory()->state(['school_year' => '2026-2027', 'is_draft' => $isDraft]),
    ]);
}

test('teachers see published subjects to choose from, with the ones they teach ticked', function () {
    $teacher = User::factory()->teacher()->create();
    $taught = teachableSubject('Mathematics');
    teachableSubject('English');
    teachableSubject('Draft Subject', isDraft: true);
    $teacher->taughtSubjects()->attach($taught);

    $this->actingAs($teacher)
        ->get(route('admin.settings.subjects.edit'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Settings/Subjects')
            ->has('schoolYears', 1)
            ->where('schoolYears.0.school_year', '2026-2027')
            ->has('schoolYears.0.grade_levels', 2)
            ->where('selectedSubjectIds', [$taught->id]));
});

test('teachers save the subjects they teach', function () {
    $teacher = User::factory()->teacher()->create();
    $math = teachableSubject('Mathematics');
    $english = teachableSubject('English');
    $dropped = teachableSubject('Science');
    $teacher->taughtSubjects()->attach($dropped);

    $this->actingAs($teacher)
        ->put(route('admin.settings.subjects.update'), ['subject_ids' => [$math->id, $english->id]])
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    expect($teacher->taughtSubjects()->pluck('subjects.id')->sort()->values()->all())
        ->toBe(collect([$math->id, $english->id])->sort()->values()->all());
});

test('teachers can clear their subjects', function () {
    $teacher = User::factory()->teacher()->create();
    $teacher->taughtSubjects()->attach(teachableSubject());

    $this->actingAs($teacher)
        ->put(route('admin.settings.subjects.update'), ['subject_ids' => []])
        ->assertSessionHasNoErrors();

    expect($teacher->taughtSubjects()->count())->toBe(0);
});

test('only subjects of published school years can be chosen', function (Closure $subjectId) {
    $teacher = User::factory()->teacher()->create();

    $this->actingAs($teacher)
        ->put(route('admin.settings.subjects.update'), ['subject_ids' => [$subjectId()]])
        ->assertSessionHasErrors('subject_ids.0');

    expect($teacher->taughtSubjects()->count())->toBe(0);
})->with([
    'draft school year' => [fn () => teachableSubject('Draft', isDraft: true)->id],
    'unknown subject' => [fn () => 999],
]);

test('the subjects list is required, even when empty', function () {
    $this->actingAs(User::factory()->teacher()->create())
        ->put(route('admin.settings.subjects.update'), [])
        ->assertSessionHasErrors('subject_ids');
});

test('only teachers keep a list of subjects', function (string $role) {
    $this->actingAs(User::factory()->create(['role' => $role]))
        ->get(route('admin.settings.subjects.edit'))
        ->assertForbidden();

    $this->put(route('admin.settings.subjects.update'), ['subject_ids' => [teachableSubject()->id]])
        ->assertForbidden();
})->with(['ADMIN', 'REGISTRAR', 'CASHIER']);

test('the grade sheets page lists the teacher\'s subjects with their grade sheet', function () {
    $teacher = User::factory()->teacher()->create();
    $withSheet = teachableSubject('Mathematics');
    $withoutSheet = teachableSubject('English');
    $teacher->taughtSubjects()->attach([$withSheet->id, $withoutSheet->id]);
    $gradeSheet = GradeSheet::factory()->create(['subject_id' => $withSheet->id, 'teacher_id' => $teacher->id]);

    $this->actingAs($teacher)
        ->get(route('admin.grade-sheets.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('mySubjects', 2)
            ->where('mySubjects', fn ($subjects) => collect($subjects)->pluck('grade_sheet_id', 'id')->sortKeys()->all()
                === collect([$withSheet->id => $gradeSheet->id, $withoutSheet->id => null])->sortKeys()->all()));
});

test('admins have no subjects panel on the grade sheets page', function () {
    $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.grade-sheets.index'))
        ->assertInertia(fn (Assert $page) => $page->where('mySubjects', null));
});

test('the create page knows who teaches each subject and which one was picked', function () {
    $teacher = User::factory()->teacher()->create();
    $subject = teachableSubject();
    $teacher->taughtSubjects()->attach($subject);

    $this->actingAs($teacher)
        ->get(route('admin.grade-sheets.create', ['subject_id' => $subject->id]))
        ->assertInertia(fn (Assert $page) => $page
            ->where('selectedSubjectId', $subject->id)
            ->where('subjects.0.teacher_ids', [$teacher->id]));
});

test('a grade sheet records who prepared it', function () {
    $admin = User::factory()->admin()->create(['name' => 'Principal Reyes']);
    $teacher = User::factory()->teacher()->create();

    $this->actingAs($admin)
        ->post(route('admin.grade-sheets.store'), [
            'subject_id' => teachableSubject()->id,
            'teacher_id' => $teacher->id,
        ])
        ->assertSessionHasNoErrors();

    $gradeSheet = GradeSheet::sole();

    expect($gradeSheet->created_by)->toBe($admin->id);

    $this->get(route('admin.grade-sheets.show', $gradeSheet))
        ->assertInertia(fn (Assert $page) => $page->where('gradeSheet.prepared_by', 'Principal Reyes'));
});
