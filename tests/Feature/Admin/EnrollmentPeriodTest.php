<?php

use App\Models\Curriculum;
use App\Models\EnrolleeUser;
use App\Models\Enrollment;
use App\Models\EnrollmentPeriod;
use App\Models\GradeLevel;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->travelTo(now('Asia/Manila')->setDate(2026, 10, 4)->setTime(9, 0));
    $this->admin = User::factory()->create(['role' => 'ADMIN']);
    $this->schoolYear = Enrollment::currentSchoolYear();
    GradeLevel::factory()->withCurriculum()->create();
});

test('an admin can set when enrollment opens and closes', function () {
    $this->actingAs($this->admin)
        ->put(route('admin.school-years.enrollment-period.update', $this->schoolYear), [
            'opens_on' => '2026-10-10',
            'closes_on' => '2026-11-30',
        ])
        ->assertRedirect(route('admin.grade-levels.index', ['school_year' => $this->schoolYear]))
        ->assertSessionHas('success', "Enrollment for {$this->schoolYear} is set from Oct 10, 2026 to Nov 30, 2026.");

    $period = EnrollmentPeriod::sole();

    expect($period->school_year)->toBe($this->schoolYear)
        ->and($period->opens_on->toDateString())->toBe('2026-10-10')
        ->and($period->closes_on->toDateString())->toBe('2026-11-30');
});

test('an admin can change the dates, which re-arms their reminders', function () {
    $period = EnrollmentPeriod::factory()->opensIn(2)->create(['school_year' => $this->schoolYear]);
    $period->forceFill(['opening_reminder_sent_at' => now(), 'closing_reminder_sent_at' => now()])->save();

    $this->actingAs($this->admin)
        ->put(route('admin.school-years.enrollment-period.update', $this->schoolYear), [
            'opens_on' => '2026-10-20',
            'closes_on' => '2026-12-15',
        ])
        ->assertSessionHasNoErrors();

    $period->refresh();

    expect(EnrollmentPeriod::count())->toBe(1)
        ->and($period->opens_on->toDateString())->toBe('2026-10-20')
        ->and($period->closes_on->toDateString())->toBe('2026-12-15')
        ->and($period->opening_reminder_sent_at)->toBeNull()
        ->and($period->closing_reminder_sent_at)->toBeNull()
        ->and($period->closed_notice_sent_at)->toBeNull();
});

test('dates already past when set are not reminded about', function () {
    $this->actingAs($this->admin)->put(route('admin.school-years.enrollment-period.update', $this->schoolYear), [
        'opens_on' => '2026-09-01',
        'closes_on' => '2026-09-30',
    ]);

    $period = EnrollmentPeriod::sole();

    expect($period->opening_reminder_sent_at)->not->toBeNull()
        ->and($period->closing_reminder_sent_at)->not->toBeNull()
        ->and($period->closed_notice_sent_at)->not->toBeNull();
});

test('the enrollment dates are validated', function (array $dates, array $errors) {
    $this->actingAs($this->admin)
        ->put(route('admin.school-years.enrollment-period.update', $this->schoolYear), $dates)
        ->assertSessionHasErrors($errors);

    expect(EnrollmentPeriod::count())->toBe(0);
})->with([
    'missing' => [[], ['opens_on', 'closes_on']],
    'not a date' => [['opens_on' => 'soon', 'closes_on' => '2026-11-30'], ['opens_on']],
    'closes before it opens' => [
        ['opens_on' => '2026-11-30', 'closes_on' => '2026-11-01'],
        ['closes_on' => 'Enrollment can\'t close before it opens.'],
    ],
]);

test('dates can only be set for a school year that has been set up', function () {
    $this->actingAs($this->admin)
        ->put(route('admin.school-years.enrollment-period.update', '2040-2041'), [
            'opens_on' => '2026-10-10',
            'closes_on' => '2026-11-30',
        ])
        ->assertNotFound();
});

test('an admin can remove the dates', function () {
    EnrollmentPeriod::factory()->create(['school_year' => $this->schoolYear]);

    $this->actingAs($this->admin)
        ->delete(route('admin.school-years.enrollment-period.destroy', $this->schoolYear))
        ->assertRedirect(route('admin.grade-levels.index', ['school_year' => $this->schoolYear]))
        ->assertSessionHas('success', "The enrollment dates for {$this->schoolYear} were removed.");

    expect(EnrollmentPeriod::count())->toBe(0);
});

test('only admins can change the enrollment dates', function () {
    $dates = ['opens_on' => '2026-10-10', 'closes_on' => '2026-11-30'];
    $route = route('admin.school-years.enrollment-period.update', $this->schoolYear);

    $this->put($route, $dates)->assertRedirect(route('login'));
    $this->actingAs(User::factory()->create(['role' => 'STAFF']))->put($route, $dates)->assertForbidden();
    $this->actingAs(User::factory()->create(['role' => 'STAFF']))
        ->delete(route('admin.school-years.enrollment-period.destroy', $this->schoolYear))
        ->assertForbidden();

    expect(EnrollmentPeriod::count())->toBe(0);
});

test('the grade levels page shows the selected year\'s enrollment dates', function () {
    EnrollmentPeriod::factory()->create([
        'school_year' => $this->schoolYear,
        'opens_on' => '2026-10-01',
        'closes_on' => '2026-11-30',
    ]);

    $this->actingAs($this->admin)
        ->get(route('admin.grade-levels.index', ['school_year' => $this->schoolYear]))
        ->assertInertia(fn (Assert $page) => $page
            ->where('enrollmentPeriod', ['opens_on' => '2026-10-01', 'closes_on' => '2026-11-30'])
            ->where('today', '2026-10-04'));
});

test('applications are only accepted within the enrollment period', function (int $opensInDays, int $closesInDays, bool $isOpen) {
    EnrollmentPeriod::factory()->create([
        'school_year' => $this->schoolYear,
        'opens_on' => EnrollmentPeriod::today()->addDays($opensInDays),
        'closes_on' => EnrollmentPeriod::today()->addDays($closesInDays),
    ]);

    expect(Curriculum::applicationSchoolYear())->toBe($isOpen ? $this->schoolYear : null);
})->with([
    'not open yet' => [1, 30, false],
    'opens today' => [0, 30, true],
    'closes today' => [-30, 0, true],
    'closed' => [-30, -1, false],
]);

test('a saved school year without dates stays open', function () {
    expect(Curriculum::applicationSchoolYear())->toBe($this->schoolYear);
});

test('next year\'s upcoming enrollment doesn\'t close this year\'s', function () {
    $nextSchoolYear = Curriculum::nextSchoolYear($this->schoolYear);
    Curriculum::factory()->create(['school_year' => $nextSchoolYear]);
    EnrollmentPeriod::factory()->opensIn(10)->create(['school_year' => $nextSchoolYear]);

    expect(Curriculum::applicationSchoolYear())->toBe($this->schoolYear);
});

test('parents cannot apply once enrollment has closed', function () {
    EnrollmentPeriod::factory()->create([
        'school_year' => $this->schoolYear,
        'opens_on' => EnrollmentPeriod::today()->subDays(30),
        'closes_on' => EnrollmentPeriod::today()->subDay(),
    ]);
    $enrollee = EnrolleeUser::factory()->create();

    $this->get(route('home'))
        ->assertInertia(fn (Assert $page) => $page->where('openSchoolYear', null));

    $this->actingAs($enrollee, 'enrollee')
        ->post(route('admission.store'), [])
        ->assertSessionHasErrors('school_year');
});
