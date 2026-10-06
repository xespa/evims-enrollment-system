<?php

use App\Models\Curriculum;
use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\Subject;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('non-admin users cannot manage subjects', function () {
    $staff = User::factory()->create(['role' => 'REGISTRAR']);
    $curriculum = Curriculum::factory()->create();
    $subject = Subject::factory()->for($curriculum)->create();

    $this->actingAs($staff)->get(route('admin.grade-levels.show', $curriculum->grade_level_id))->assertForbidden();
    $this->actingAs($staff)->post(route('admin.curricula.subjects.store', $curriculum), ['name' => 'Science'])->assertForbidden();
    $this->actingAs($staff)->patch(route('admin.subjects.update', $subject), ['name' => 'Science'])->assertForbidden();
    $this->actingAs($staff)->delete(route('admin.subjects.destroy', $subject))->assertForbidden();
});

test('the grade levels page lists each grade level with its own subjects', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $gradeLevel = GradeLevel::factory()->create(['level_order' => 1]);
    $otherGradeLevel = GradeLevel::factory()->create(['level_order' => 2]);
    $curriculum = Curriculum::factory()->for($gradeLevel)->create();
    $otherCurriculum = Curriculum::factory()->for($otherGradeLevel)->create();
    Subject::factory()->for($curriculum)->create(['name' => 'Mathematics', 'code' => 'MATH']);
    Subject::factory()->for($curriculum)->create(['name' => 'English']);
    Subject::factory()->for($otherCurriculum)->create(['name' => 'Science']);

    $this->actingAs($admin)
        ->get(route('admin.grade-levels.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/GradeLevels/Index')
            ->where('manageGradeLevelId', null)
            ->where('schoolYear', Enrollment::currentSchoolYear())
            ->where('gradeLevels.0.id', $gradeLevel->id)
            ->where('gradeLevels.0.curriculum.id', $curriculum->id)
            ->has('gradeLevels.0.curriculum.subjects', 2)
            ->where('gradeLevels.0.curriculum.subjects.0.name', 'English')
            ->where('gradeLevels.0.curriculum.subjects.1.name', 'Mathematics')
            ->where('gradeLevels.0.curriculum.subjects.1.code', 'MATH')
            ->where('gradeLevels.0.curriculum.subjects.0.enrollments_count', 0)
            ->has('gradeLevels.1.curriculum.subjects', 1)
            ->where('gradeLevels.1.curriculum.subjects.0.name', 'Science')
        );
});

test('the grade levels page shows the chosen school year', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $gradeLevel = GradeLevel::factory()->create();
    Subject::factory()->for(Curriculum::factory()->for($gradeLevel)->create(['school_year' => '2026-2027']))->create(['name' => 'Old Subject']);
    Subject::factory()->for(Curriculum::factory()->for($gradeLevel)->create(['school_year' => '2027-2028']))->create(['name' => 'New Subject']);

    $this->actingAs($admin)
        ->get(route('admin.grade-levels.index', ['school_year' => '2027-2028']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('schoolYear', '2027-2028')
            ->where('schoolYears', ['2026-2027', '2027-2028'])
            ->where('nextSchoolYear', '2028-2029')
            ->where('gradeLevels.0.curriculum.subjects.0.name', 'New Subject')
        );
});

test('a grade level not set up for the chosen year has no curriculum', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    GradeLevel::factory()->create();

    $this->actingAs($admin)
        ->get(route('admin.grade-levels.index'))
        ->assertInertia(fn (Assert $page) => $page->where('gradeLevels.0.curriculum', null));
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

test('admins can add a subject to a school year\'s curriculum', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $curriculum = Curriculum::factory()->create();

    $this->actingAs($admin)
        ->post(route('admin.curricula.subjects.store', $curriculum), ['name' => 'Science', 'code' => 'SCI'])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect($curriculum->subjects()->where('name', 'Science')->where('code', 'SCI')->exists())->toBeTrue();
});

test('subject names must be unique within a curriculum', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $gradeLevel = GradeLevel::factory()->create();
    $thisYear = Curriculum::factory()->for($gradeLevel)->create(['school_year' => '2026-2027']);
    $nextYear = Curriculum::factory()->for($gradeLevel)->create(['school_year' => '2027-2028']);
    Subject::factory()->for($thisYear)->create(['name' => 'Science']);

    $this->actingAs($admin)
        ->post(route('admin.curricula.subjects.store', $thisYear), ['name' => 'Science'])
        ->assertSessionHasErrors('name');

    $this->actingAs($admin)
        ->post(route('admin.curricula.subjects.store', $nextYear), ['name' => 'Science'])
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
    $subject = Subject::factory()->create();
    $enrollment->subjects()->attach($subject);

    $this->actingAs($admin)
        ->delete(route('admin.subjects.destroy', $subject))
        ->assertSessionHasErrors('subject');

    expect(Subject::find($subject->id))->not->toBeNull();
});

test('a used subject can still be dropped from next year\'s copy', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $gradeLevel = GradeLevel::factory()->create();
    $thisYear = Curriculum::factory()->for($gradeLevel)->create(['school_year' => '2026-2027']);
    $usedSubject = Subject::factory()->for($thisYear)->create(['name' => 'Mother Tongue']);
    Enrollment::factory()->create(['grade_level_id' => $gradeLevel->id, 'school_year' => '2026-2027'])
        ->subjects()->attach($usedSubject);

    $this->actingAs($admin)->post(route('admin.school-years.store'), ['school_year' => '2027-2028']);

    $nextYearsCopy = Subject::whereHas('curriculum', fn ($query) => $query->where('school_year', '2027-2028'))
        ->where('name', 'Mother Tongue')
        ->sole();

    $this->actingAs($admin)
        ->delete(route('admin.subjects.destroy', $nextYearsCopy))
        ->assertSessionHasNoErrors();

    expect(Subject::find($nextYearsCopy->id))->toBeNull()
        ->and(Subject::find($usedSubject->id))->not->toBeNull();
});
