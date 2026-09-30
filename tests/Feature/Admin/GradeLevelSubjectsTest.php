<?php

use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\Subject;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('non-admin users cannot manage grade level subjects', function () {
    $staff = User::factory()->create(['role' => 'STAFF']);
    $gradeLevel = GradeLevel::factory()->create();
    $subject = Subject::factory()->for($gradeLevel)->create();

    $this->actingAs($staff)->get(route('admin.grade-levels.show', $gradeLevel))->assertForbidden();
    $this->actingAs($staff)->post(route('admin.grade-levels.subjects.store', $gradeLevel), ['name' => 'Science'])->assertForbidden();
    $this->actingAs($staff)->patch(route('admin.subjects.update', $subject), ['name' => 'Science'])->assertForbidden();
    $this->actingAs($staff)->delete(route('admin.subjects.destroy', $subject))->assertForbidden();
});

test('the grade levels page lists each grade level with its own subjects', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $gradeLevel = GradeLevel::factory()->create(['level_order' => 1]);
    $otherGradeLevel = GradeLevel::factory()->create(['level_order' => 2]);
    Subject::factory()->for($gradeLevel)->create(['name' => 'Mathematics', 'code' => 'MATH']);
    Subject::factory()->for($gradeLevel)->create(['name' => 'English']);
    Subject::factory()->for($otherGradeLevel)->create(['name' => 'Science']);

    $this->actingAs($admin)
        ->get(route('admin.grade-levels.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/GradeLevels/Index')
            ->where('manageGradeLevelId', null)
            ->where('gradeLevels.0.id', $gradeLevel->id)
            ->has('gradeLevels.0.subjects', 2)
            ->where('gradeLevels.0.subjects.0.name', 'English')
            ->where('gradeLevels.0.subjects.1.name', 'Mathematics')
            ->where('gradeLevels.0.subjects.1.code', 'MATH')
            ->where('gradeLevels.0.subjects.0.enrollments_count', 0)
            ->has('gradeLevels.1.subjects', 1)
            ->where('gradeLevels.1.subjects.0.name', 'Science')
        );
});

test('the grade levels page can open straight to a grade level\'s subjects', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $gradeLevel = GradeLevel::factory()->create();

    $this->actingAs($admin)
        ->get(route('admin.grade-levels.index', ['manage' => $gradeLevel->id]))
        ->assertInertia(fn (Assert $page) => $page->where('manageGradeLevelId', $gradeLevel->id));
});

test('the old per-grade subjects page redirects to its subjects modal', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $gradeLevel = GradeLevel::factory()->create();

    $this->actingAs($admin)
        ->get(route('admin.grade-levels.show', $gradeLevel))
        ->assertRedirect(route('admin.grade-levels.index', ['manage' => $gradeLevel->id]));
});

test('admins can add a subject to a grade level', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $gradeLevel = GradeLevel::factory()->create();

    $this->actingAs($admin)
        ->post(route('admin.grade-levels.subjects.store', $gradeLevel), ['name' => 'Science', 'code' => 'SCI'])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect($gradeLevel->subjects()->where('name', 'Science')->where('code', 'SCI')->exists())->toBeTrue();
});

test('subject names must be unique within a grade level', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $gradeLevel = GradeLevel::factory()->create();
    Subject::factory()->for($gradeLevel)->create(['name' => 'Science']);
    $otherGradeLevel = GradeLevel::factory()->create();

    $this->actingAs($admin)
        ->post(route('admin.grade-levels.subjects.store', $gradeLevel), ['name' => 'Science'])
        ->assertSessionHasErrors('name');

    $this->actingAs($admin)
        ->post(route('admin.grade-levels.subjects.store', $otherGradeLevel), ['name' => 'Science'])
        ->assertSessionHasNoErrors();
});

test('admins can update a subject', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $subject = Subject::factory()->create(['name' => 'Math', 'code' => 'M']);

    $this->actingAs($admin)
        ->patch(route('admin.subjects.update', $subject), ['name' => 'Mathematics', 'code' => 'MATH'])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect($subject->fresh())
        ->name->toBe('Mathematics')
        ->code->toBe('MATH');
});

test('updating a subject may keep its own name', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $subject = Subject::factory()->create(['name' => 'Science', 'code' => 'SCI']);

    $this->actingAs($admin)
        ->patch(route('admin.subjects.update', $subject), ['name' => 'Science', 'code' => null])
        ->assertSessionHasNoErrors();

    expect($subject->fresh()->code)->toBeNull();
});

test('admins can remove an unused subject', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $subject = Subject::factory()->create();

    $this->actingAs($admin)
        ->delete(route('admin.subjects.destroy', $subject))
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect(Subject::find($subject->id))->toBeNull();
});

test('subjects already used by enrollments cannot be removed', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $enrollment = Enrollment::factory()->create();
    $subject = Subject::factory()->create(['grade_level_id' => $enrollment->grade_level_id]);
    $enrollment->subjects()->attach($subject);

    $this->actingAs($admin)
        ->delete(route('admin.subjects.destroy', $subject))
        ->assertSessionHasErrors('subject');

    expect(Subject::find($subject->id))->not->toBeNull();
});
