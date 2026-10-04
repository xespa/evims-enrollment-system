<?php

use App\Models\Curriculum;
use App\Models\Enrollment;
use App\Models\EnrollmentPeriod;
use App\Models\Event;
use App\Models\GradeLevel;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

test('the home page shows the school year enrollment is open for', function () {
    $gradeLevel = GradeLevel::factory()->withCurriculum()->create(['name' => 'Grade 1', 'level_order' => 1]);
    [$start] = explode('-', Enrollment::currentSchoolYear());
    $nextSchoolYear = ($start + 1).'-'.($start + 2);
    Curriculum::factory()->for($gradeLevel)->create(['school_year' => $nextSchoolYear]);

    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Site/Home')
            ->where('enrollmentStatus', [
                'school_year' => $nextSchoolYear,
                'status' => 'open',
                'opens_on' => null,
                'closes_on' => null,
            ])
            ->where('gradeLevels.0.name', 'Grade 1')
        );
});

test('the home page says enrollment opens soon when no school year is set up', function () {
    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('enrollmentStatus', null));
});

test('the home page shows whether the school year\'s enrollment is open, upcoming or closed', function (int $opensInDays, int $closesInDays, string $status) {
    $this->travelTo(Carbon::parse('2026-10-04 09:00', 'Asia/Manila'));
    GradeLevel::factory()->withCurriculum()->create();
    $period = EnrollmentPeriod::factory()->create([
        'school_year' => Enrollment::currentSchoolYear(),
        'opens_on' => EnrollmentPeriod::today()->addDays($opensInDays),
        'closes_on' => EnrollmentPeriod::today()->addDays($closesInDays),
    ]);

    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('enrollmentStatus', [
            'school_year' => Enrollment::currentSchoolYear(),
            'status' => $status,
            'opens_on' => $period->opens_on->toDateString(),
            'closes_on' => $period->closes_on->toDateString(),
        ]));
})->with([
    'open' => [-10, 20, 'open'],
    'not open yet' => [5, 30, 'upcoming'],
    'closed' => [-30, -1, 'closed'],
]);

test('the home page banner image is in place', function () {
    expect(public_path('images/evims-banner.jpg'))->toBeFile();
});

test('the about page renders', function () {
    $this->get(route('site.about'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Site/About'));
});

test('each academics page renders', function (string $routeName, string $component) {
    $this->get(route($routeName))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component($component));
})->with([
    'pre-elementary' => ['site.academics.pre-elementary', 'Site/Academics/PreElementary'],
    'lower elementary' => ['site.academics.lower-elementary', 'Site/Academics/LowerElementary'],
    'upper elementary' => ['site.academics.upper-elementary', 'Site/Academics/UpperElementary'],
    'high school' => ['site.academics.high-school', 'Site/Academics/HighSchool'],
]);

test('the events page shows every posted event, however old, newest date first', function () {
    $this->travelTo(Carbon::parse('2026-10-15 10:00', 'Asia/Manila'));

    Event::create(['title' => 'Intramurals', 'event_date' => '2026-10-20']);
    Event::create(['title' => 'Foundation Day', 'event_date' => '2026-06-10']);
    Event::create(['title' => 'Christmas Program', 'event_date' => '2026-12-18']);
    Event::create(['title' => 'Science Fair 2025', 'event_date' => '2025-02-01']);

    $this->get(route('site.events'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Site/Events')
            ->has('events', 4)
            ->where('events.0.title', 'Christmas Program')
            ->where('events.1.title', 'Intramurals')
            ->where('events.2.title', 'Foundation Day')
            ->where('events.3.title', 'Science Fair 2025')
        );
});

test('the contact page renders', function () {
    $this->get(route('site.contact'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Site/Contact'));
});

test('each student services page renders', function (string $routeName, string $component) {
    $this->get(route($routeName))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component($component));
})->with([
    'guidance & counseling' => ['site.student-services.guidance-counseling', 'Site/StudentServices/GuidanceCounseling'],
    'health services' => ['site.student-services.health-services', 'Site/StudentServices/HealthServices'],
    'library' => ['site.student-services.library', 'Site/StudentServices/Library'],
]);
