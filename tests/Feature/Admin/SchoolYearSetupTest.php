<?php

use App\Models\Curriculum;
use App\Models\EnrolleeUser;
use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\Subject;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => 'ADMIN']);
});

test('setting up the next school year drafts a copy of every grade level\'s fees and subjects', function () {
    $gradeOne = GradeLevel::factory()->create(['name' => 'Grade 1', 'level_order' => 3]);
    $gradeTwo = GradeLevel::factory()->create(['name' => 'Grade 2', 'level_order' => 4]);
    $gradeOneNow = Curriculum::factory()->for($gradeOne)->totalFee(30000)->create(['school_year' => '2026-2027']);
    Curriculum::factory()->for($gradeTwo)->totalFee(32000)->create(['school_year' => '2026-2027']);
    Subject::factory()->for($gradeOneNow)->create(['name' => 'Mathematics', 'code' => 'MATH']);
    Subject::factory()->for($gradeOneNow)->create(['name' => 'Mother Tongue', 'code' => null]);

    $this->actingAs($this->admin)
        ->post(route('admin.school-years.store'), ['school_year' => '2027-2028'])
        ->assertRedirect(route('admin.grade-levels.index', ['school_year' => '2027-2028']))
        ->assertSessionHas('success', 'Draft of 2027-2028 created from 2026-2027. Review its fees and subjects, then save it to open enrollment.');

    $gradeOneNext = $gradeOne->curriculumFor('2027-2028');

    expect($gradeOneNext->is_draft)->toBeTrue()
        ->and(Curriculum::draftSchoolYear())->toBe('2027-2028')
        ->and((float) $gradeOneNext->tuition_fee)->toBe(30000.0)
        ->and($gradeOneNext->subjects()->orderBy('name')->get(['name', 'code'])->toArray())->toBe([
            ['name' => 'Mathematics', 'code' => 'MATH'],
            ['name' => 'Mother Tongue', 'code' => null],
        ])
        ->and((float) $gradeTwo->curriculumFor('2027-2028')->tuition_fee)->toBe(32000.0)
        // The copies are new rows: this year's curriculum keeps its own.
        ->and($gradeOneNow->subjects()->count())->toBe(2)
        ->and(Subject::count())->toBe(4);
});

test('editing the new year leaves the year it was copied from untouched', function () {
    $gradeLevel = GradeLevel::factory()->create();
    $thisYear = Curriculum::factory()->for($gradeLevel)->totalFee(30000)->create(['school_year' => '2026-2027']);
    Subject::factory()->for($thisYear)->create(['name' => 'Mother Tongue']);

    $this->actingAs($this->admin)->post(route('admin.school-years.store'), ['school_year' => '2027-2028']);
    $nextYear = $gradeLevel->curriculumFor('2027-2028');

    $this->actingAs($this->admin)->patch(route('admin.curricula.update', $nextYear), [
        'registration_fee' => 33000,
        'miscellaneous_fee' => 0,
        'monthly_tuition' => 0,
        'monthly_laboratory_fee' => 0,
        'books_fee' => 0,
    ]);
    $this->actingAs($this->admin)->delete(route('admin.subjects.destroy', $nextYear->subjects()->sole()));

    expect((float) $thisYear->fresh()->tuition_fee)->toBe(30000.0)
        ->and($thisYear->subjects()->pluck('name')->all())->toBe(['Mother Tongue'])
        ->and((float) $nextYear->fresh()->tuition_fee)->toBe(33000.0)
        ->and($nextYear->subjects()->count())->toBe(0);
});

test('only the year right after the latest one can be set up', function (string $schoolYear) {
    Curriculum::factory()->create(['school_year' => '2026-2027']);

    $this->actingAs($this->admin)
        ->post(route('admin.school-years.store'), ['school_year' => $schoolYear])
        ->assertSessionHasErrors(['school_year' => 'The next school year to set up is 2027-2028.']);

    expect(Curriculum::schoolYears())->toBe(['2026-2027']);
})->with([
    'already set up' => '2026-2027',
    'skips a year' => '2028-2029',
    'not a school year' => 'next year',
]);

test('the first school year starts empty when nothing is set up yet', function () {
    $gradeLevel = GradeLevel::factory()->create();
    $currentSchoolYear = Enrollment::currentSchoolYear();

    $this->actingAs($this->admin)
        ->post(route('admin.school-years.store'), ['school_year' => $currentSchoolYear])
        ->assertSessionHasNoErrors();

    $curriculum = $gradeLevel->curriculumFor($currentSchoolYear);

    expect($curriculum)->not->toBeNull()
        ->and((float) $curriculum->tuition_fee)->toBe(0.0)
        ->and($curriculum->subjects()->count())->toBe(0);
});

test('non-admin users cannot set up a school year', function () {
    $staff = User::factory()->create(['role' => 'STAFF']);

    $this->actingAs($staff)
        ->post(route('admin.school-years.store'), ['school_year' => Enrollment::currentSchoolYear()])
        ->assertForbidden();
});

test('saving the draft opens its school year for enrollment', function () {
    $gradeLevel = GradeLevel::factory()->create();
    Curriculum::factory()->for($gradeLevel)->create(['school_year' => '2026-2027']);
    $this->actingAs($this->admin)->post(route('admin.school-years.store'), ['school_year' => '2027-2028']);

    $this->actingAs($this->admin)
        ->patch(route('admin.school-years.update', '2027-2028'))
        ->assertRedirect(route('admin.grade-levels.index', ['school_year' => '2027-2028']))
        ->assertSessionHas('success', '2027-2028 is saved and open for enrollment.');

    expect($gradeLevel->curriculumFor('2027-2028')->is_draft)->toBeFalse()
        ->and(Curriculum::draftSchoolYear())->toBeNull();
});

test('cancelling the draft discards it and its subjects, and nothing else', function () {
    $gradeLevel = GradeLevel::factory()->create();
    $thisYear = Curriculum::factory()->for($gradeLevel)->create(['school_year' => '2026-2027']);
    Subject::factory()->for($thisYear)->create(['name' => 'Mathematics']);
    $this->actingAs($this->admin)->post(route('admin.school-years.store'), ['school_year' => '2027-2028']);

    expect(Subject::count())->toBe(2);

    $this->actingAs($this->admin)
        ->delete(route('admin.school-years.destroy', '2027-2028'))
        ->assertRedirect(route('admin.grade-levels.index'))
        ->assertSessionHas('success', 'Setting up 2027-2028 was cancelled. Nothing was changed.');

    expect(Curriculum::schoolYears())->toBe(['2026-2027'])
        ->and(Subject::count())->toBe(1)
        ->and($thisYear->subjects()->pluck('name')->all())->toBe(['Mathematics']);
});

test('the same year can be set up again after cancelling', function () {
    Curriculum::factory()->create(['school_year' => '2026-2027']);
    $this->actingAs($this->admin)->post(route('admin.school-years.store'), ['school_year' => '2027-2028']);
    $this->actingAs($this->admin)->delete(route('admin.school-years.destroy', '2027-2028'));

    $this->actingAs($this->admin)
        ->post(route('admin.school-years.store'), ['school_year' => '2027-2028'])
        ->assertSessionHasNoErrors();

    expect(Curriculum::draftSchoolYear())->toBe('2027-2028');
});

test('another year cannot be set up while a draft is pending', function () {
    Curriculum::factory()->create(['school_year' => '2026-2027']);
    $this->actingAs($this->admin)->post(route('admin.school-years.store'), ['school_year' => '2027-2028']);

    $this->actingAs($this->admin)
        ->post(route('admin.school-years.store'), ['school_year' => '2028-2029'])
        ->assertSessionHasErrors(['school_year' => 'Finish setting up 2027-2028 first: save it or cancel it.']);

    expect(Curriculum::schoolYears())->toBe(['2026-2027', '2027-2028']);
});

test('a saved school year cannot be cancelled or saved again', function (string $method, string $route) {
    Curriculum::factory()->create(['school_year' => '2026-2027']);

    $this->actingAs($this->admin)
        ->{$method}(route($route, '2026-2027'))
        ->assertNotFound();

    expect(Curriculum::schoolYears())->toBe(['2026-2027']);
})->with([
    'cancel' => ['delete', 'admin.school-years.destroy'],
    'save' => ['patch', 'admin.school-years.update'],
]);

test('a draft school year is not offered to applicants', function () {
    $gradeLevel = GradeLevel::factory()->withCurriculum()->create();
    [$start] = explode('-', Enrollment::currentSchoolYear());
    $draftYear = ($start + 1).'-'.($start + 2);
    $draft = Curriculum::factory()->for($gradeLevel)->create(['school_year' => $draftYear, 'is_draft' => true]);
    $draftSubject = Subject::factory()->for($draft)->create();

    $this->actingAs(EnrolleeUser::factory()->create(), 'enrollee')
        ->get(route('admission.create'))
        ->assertInertia(fn ($page) => $page
            ->has('curricula.'.Enrollment::currentSchoolYear())
            ->missing("curricula.{$draftYear}"));

    $this->actingAs(EnrolleeUser::factory()->create(), 'enrollee')
        ->post(route('admission.store'), validEnrollmentPayload($gradeLevel, [
            'school_year' => $draftYear,
            'subject_ids' => [$draftSubject->id],
        ]))
        ->assertSessionHasErrors('subject_ids.0');

    expect(Enrollment::count())->toBe(0);
});

test('the grade levels page shows which year is the draft', function () {
    Curriculum::factory()->create(['school_year' => '2026-2027']);
    $this->actingAs($this->admin)->post(route('admin.school-years.store'), ['school_year' => '2027-2028']);

    $this->actingAs($this->admin)
        ->get(route('admin.grade-levels.index', ['school_year' => '2027-2028']))
        ->assertInertia(fn ($page) => $page
            ->where('draftSchoolYear', '2027-2028')
            ->where('schoolYear', '2027-2028'));
});

test('non-admin users cannot save or cancel a draft', function () {
    Curriculum::factory()->create(['school_year' => '2027-2028', 'is_draft' => true]);
    $staff = User::factory()->create(['role' => 'STAFF']);

    $this->actingAs($staff)->patch(route('admin.school-years.update', '2027-2028'))->assertForbidden();
    $this->actingAs($staff)->delete(route('admin.school-years.destroy', '2027-2028'))->assertForbidden();

    expect(Curriculum::draftSchoolYear())->toBe('2027-2028');
});
