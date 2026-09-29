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

    $this->actingAs($staff)->get(route('admin.gradeLevels.show', $gradeLevel))->assertForbidden();
    $this->actingAs($staff)->post(route('admin.subjects.store', $gradeLevel), ['name' => 'Science'])->assertForbidden();
    $this->actingAs($staff)->patch(route('admin.subjects.update', $subject), ['name' => 'Science'])->assertForbidden();
    $this->actingAs($staff)->delete(route('admin.subjects.destroy', $subject))->assertForbidden();
});

test('admins can view the subjects of a grade level', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $gradeLevel = GradeLevel::factory()->create();
    Subject::factory()->for($gradeLevel)->create(['name' => 'Mathematics']);
    Subject::factory()->for($gradeLevel)->create(['name' => 'English']);
    Subject::factory()->create(['name' => 'Other Grade Subject']);

    $this->actingAs($admin)
        ->get(route('admin.gradeLevels.show', $gradeLevel))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/GradeLevels/Show')
            ->where('gradeLevel.id', $gradeLevel->id)
            ->has('subjects', 2)
            ->where('subjects.0.name', 'English')
            ->where('subjects.1.name', 'Mathematics')
            ->where('subjects.0.enrollments_count', 0)
        );
});

test('admins can add a subject to a grade level', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $gradeLevel = GradeLevel::factory()->create();

    $this->actingAs($admin)
        ->post(route('admin.subjects.store', $gradeLevel), ['name' => 'Science', 'code' => 'SCI'])
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
        ->post(route('admin.subjects.store', $gradeLevel), ['name' => 'Science'])
        ->assertSessionHasErrors('name');

    $this->actingAs($admin)
        ->post(route('admin.subjects.store', $otherGradeLevel), ['name' => 'Science'])
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
