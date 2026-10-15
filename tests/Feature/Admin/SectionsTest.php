<?php

use App\Models\Curriculum;
use App\Models\EnrolleeUser;
use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\Section;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
});

/**
 * A grade level offered this school year, with sections of the given slots.
 *
 * @param  array<string, int>  $slots  Slots by section name.
 */
function gradeLevelWithSections(array $slots = ['A' => 2]): Curriculum
{
    $curriculum = GradeLevel::factory()->totalFee(30000)->create()->curricula()->first();
    Subject::factory()->for($curriculum)->create();

    foreach ($slots as $name => $count) {
        Section::factory()->for($curriculum)->create(['name' => $name, 'slots' => $count]);
    }

    return $curriculum->load('gradeLevel');
}

/**
 * An application for the curriculum's grade level and school year.
 *
 * @param  array<string, mixed>  $attributes
 */
function applicationFor(Curriculum $curriculum, array $attributes = []): Enrollment
{
    return Enrollment::factory()->create([
        'grade_level_id' => $curriculum->grade_level_id,
        'school_year' => $curriculum->school_year,
        'enrollment_status' => 'PENDING',
        ...$attributes,
    ]);
}

test('a new school year starts every grade level with sections A, B and C', function () {
    GradeLevel::factory()->create();

    $this->actingAs($this->admin)
        ->post(route('admin.school-years.store'), ['school_year' => Enrollment::currentSchoolYear()]);

    expect(Section::query()->orderBy('name')->get(['name', 'slots'])->toArray())->toBe([
        ['name' => 'A', 'slots' => Section::DEFAULT_SLOTS],
        ['name' => 'B', 'slots' => Section::DEFAULT_SLOTS],
        ['name' => 'C', 'slots' => Section::DEFAULT_SLOTS],
    ]);
});

test('the next school year copies last year\'s sections and slots', function () {
    $gradeLevel = GradeLevel::factory()->create();
    $thisYear = Curriculum::factory()->for($gradeLevel)->create(['school_year' => '2026-2027']);
    Section::factory()->for($thisYear)->create(['name' => 'Rizal', 'slots' => 25]);

    $this->actingAs($this->admin)
        ->post(route('admin.school-years.store'), ['school_year' => '2027-2028']);

    expect($gradeLevel->curriculumFor('2027-2028')->sections()->get(['name', 'slots'])->toArray())
        ->toBe([['name' => 'Rizal', 'slots' => 25]]);
});

test('school year setup shows each grade level\'s sections and slots taken', function () {
    $curriculum = gradeLevelWithSections(['A' => 30, 'B' => 25]);
    applicationFor($curriculum, ['section_id' => $curriculum->sections->first()->id, 'enrollment_status' => 'APPROVED']);
    applicationFor($curriculum);
    applicationFor($curriculum, ['enrollment_status' => 'REJECTED']);

    $this->actingAs($this->admin)
        ->get(route('admin.grade-levels.index', ['school_year' => $curriculum->school_year]))
        ->assertInertia(fn (Assert $page) => $page
            ->where('gradeLevels.0.curriculum.slots_taken', 2)
            ->has('gradeLevels.0.curriculum.sections', 2)
            ->where('gradeLevels.0.curriculum.sections.0.name', 'A')
            ->where('gradeLevels.0.curriculum.sections.0.slots', 30)
            ->where('gradeLevels.0.curriculum.sections.0.students_count', 1));
});

test('admins change slots, add sections and remove empty ones', function () {
    $curriculum = gradeLevelWithSections(['A' => 30, 'B' => 30]);
    [$sectionA, $sectionB] = $curriculum->sections;

    $this->actingAs($this->admin)
        ->put(route('admin.curricula.sections.update', $curriculum), ['sections' => [
            ['id' => $sectionA->id, 'name' => 'A', 'slots' => 35],
            ['id' => null, 'name' => 'C', 'slots' => 20],
        ]])
        ->assertRedirect()
        ->assertSessionHas('success', "{$curriculum->gradeLevel->name}'s {$curriculum->school_year} sections saved: 55 slots in all.");

    expect($curriculum->sections()->get(['name', 'slots'])->toArray())->toBe([
        ['name' => 'A', 'slots' => 35],
        ['name' => 'C', 'slots' => 20],
    ])->and(Section::find($sectionB->id))->toBeNull();
});

test('a section can\'t drop below, or be removed with, the students placed in it', function () {
    $curriculum = gradeLevelWithSections(['A' => 30, 'B' => 30]);
    [$sectionA, $sectionB] = $curriculum->sections;
    applicationFor($curriculum, ['section_id' => $sectionA->id, 'enrollment_status' => 'APPROVED']);
    applicationFor($curriculum, ['section_id' => $sectionA->id, 'enrollment_status' => 'APPROVED']);
    applicationFor($curriculum, ['section_id' => $sectionB->id, 'enrollment_status' => 'APPROVED']);

    $this->actingAs($this->admin)
        ->put(route('admin.curricula.sections.update', $curriculum), ['sections' => [
            ['id' => $sectionA->id, 'name' => 'A', 'slots' => 1],
        ]])
        ->assertSessionHasErrors([
            'sections.0.slots' => 'Section A already has 2 students, so it needs at least 2 slots.',
            'sections' => 'Section B still has students, so it can\'t be removed. Move them to another section first.',
        ]);

    expect($sectionA->fresh()->slots)->toBe(30);
});

test('section names must be filled in and different', function () {
    $curriculum = gradeLevelWithSections([]);

    $this->actingAs($this->admin)
        ->put(route('admin.curricula.sections.update', $curriculum), ['sections' => [
            ['name' => 'A', 'slots' => 30],
            ['name' => 'a', 'slots' => 30],
            ['name' => '', 'slots' => 0],
        ]])
        ->assertSessionHasErrors(['sections.1.name', 'sections.2.name', 'sections.2.slots']);

    expect(Section::count())->toBe(0);
});

test('only school managers can change sections', function () {
    $curriculum = gradeLevelWithSections(['A' => 30]);

    $this->actingAs(User::factory()->teacher()->create())
        ->put(route('admin.curricula.sections.update', $curriculum), ['sections' => [['name' => 'A', 'slots' => 1]]])
        ->assertForbidden();

    expect($curriculum->sections()->first()->slots)->toBe(30);
});

test('the admission form shows how many slots each grade level has left', function () {
    $curriculum = gradeLevelWithSections(['A' => 2, 'B' => 1]);
    applicationFor($curriculum);
    applicationFor($curriculum, ['cancelled_at' => now()]);

    $this->actingAs(EnrolleeUser::factory()->create(), 'enrollee')
        ->get(route('admission.create'))
        ->assertInertia(fn (Assert $page) => $page
            ->where("curricula.{$curriculum->school_year}.{$curriculum->grade_level_id}.slots", 3)
            ->where("curricula.{$curriculum->school_year}.{$curriculum->grade_level_id}.slots_taken", 1));
});

test('a grade level without sections has no limit', function () {
    $curriculum = gradeLevelWithSections([]);

    $this->actingAs(EnrolleeUser::factory()->create(), 'enrollee')
        ->get(route('admission.create'))
        ->assertInertia(fn (Assert $page) => $page
            ->where("curricula.{$curriculum->school_year}.{$curriculum->grade_level_id}.slots", null));

    expect($curriculum->isFull())->toBeFalse();
});

test('nobody can apply for a full grade level', function () {
    Storage::fake('public');
    $curriculum = gradeLevelWithSections(['A' => 1, 'B' => 1]);
    applicationFor($curriculum);
    applicationFor($curriculum, ['enrollment_status' => 'APPROVED']);

    $this->actingAs(EnrolleeUser::factory()->create(), 'enrollee')
        ->post(route('admission.store'), validEnrollmentPayload($curriculum->gradeLevel))
        ->assertSessionHasErrors(['grade_level_id' => "{$curriculum->gradeLevel->name} is full for S.Y. {$curriculum->school_year}: all 2 slots are taken. Please contact the school to ask about a waitlist."]);

    expect(Enrollment::count())->toBe(2);
});

test('a rejected, cancelled or archived application frees its slot', function () {
    Storage::fake('public');
    $curriculum = gradeLevelWithSections(['A' => 1]);
    applicationFor($curriculum, ['enrollment_status' => 'REJECTED']);
    applicationFor($curriculum, ['cancelled_at' => now()]);
    applicationFor($curriculum, ['archived_at' => now()]);

    expect($curriculum->isFull())->toBeFalse();

    $this->actingAs(EnrolleeUser::factory()->create(), 'enrollee')
        ->post(route('admission.store'), validEnrollmentPayload($curriculum->gradeLevel))
        ->assertSessionHasNoErrors();

    expect($curriculum->isFull())->toBeTrue();
});

test('staff place an approved student in a section', function () {
    $curriculum = gradeLevelWithSections(['A' => 30, 'B' => 30]);
    $sectionB = $curriculum->sections->last();
    $enrollment = applicationFor($curriculum, ['enrollment_status' => 'APPROVED']);

    $this->actingAs($this->admin)
        ->put(route('admin.enrollments.section.update', $enrollment), ['section_id' => $sectionB->id])
        ->assertRedirect()
        ->assertSessionHas('success', 'Placed in Section B.');

    expect($enrollment->fresh()->section_id)->toBe($sectionB->id);

    $this->actingAs($this->admin)
        ->get(route('admin.enrollments.show', $enrollment))
        ->assertInertia(fn (Assert $page) => $page
            ->where('enrollment.section.name', 'B')
            ->has('sections', 2)
            ->where('sections.1.students_count', 1));
});

test('a full section can\'t take another student', function () {
    $curriculum = gradeLevelWithSections(['A' => 1]);
    $sectionA = $curriculum->sections->first();
    applicationFor($curriculum, ['enrollment_status' => 'APPROVED', 'section_id' => $sectionA->id]);
    $enrollment = applicationFor($curriculum, ['enrollment_status' => 'APPROVED']);

    $this->actingAs($this->admin)
        ->put(route('admin.enrollments.section.update', $enrollment), ['section_id' => $sectionA->id])
        ->assertSessionHasErrors(['section_id' => 'Section A is full (1 of 1 slots taken). Choose another section or add slots to it.']);

    expect($enrollment->fresh()->section_id)->toBeNull();
});

test('students are only placed once approved, and only in their own grade level\'s sections', function () {
    $curriculum = gradeLevelWithSections(['A' => 30]);
    $otherSection = gradeLevelWithSections(['A' => 30])->sections->first();
    $pending = applicationFor($curriculum);
    $approved = applicationFor($curriculum, ['enrollment_status' => 'APPROVED']);
    $this->actingAs($this->admin);

    $this->put(route('admin.enrollments.section.update', $pending), ['section_id' => $curriculum->sections->first()->id])
        ->assertSessionHasErrors(['section_id' => 'Only approved students can be placed in a section.']);
    $this->put(route('admin.enrollments.section.update', $approved), ['section_id' => $otherSection->id])
        ->assertSessionHasErrors('section_id');

    expect($pending->fresh()->section_id)->toBeNull()
        ->and($approved->fresh()->section_id)->toBeNull();
});

test('teachers cannot place students in sections', function () {
    $curriculum = gradeLevelWithSections(['A' => 30]);
    $enrollment = applicationFor($curriculum, ['enrollment_status' => 'APPROVED']);

    $this->actingAs(User::factory()->teacher()->create())
        ->put(route('admin.enrollments.section.update', $enrollment), ['section_id' => $curriculum->sections->first()->id])
        ->assertForbidden();
});
