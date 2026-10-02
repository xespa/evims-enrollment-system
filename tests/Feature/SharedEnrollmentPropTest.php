<?php

use App\Models\Curriculum;
use App\Models\EnrolleeUser;
use App\Models\Enrollment;
use App\Models\GradeLevel;
use Inertia\Testing\AssertableInertia as Assert;

test('every page tells the navbar which school year enrollment is open for', function () {
    $gradeLevel = GradeLevel::factory()->create();
    [$start] = explode('-', Enrollment::currentSchoolYear());
    $nextSchoolYear = ($start + 1).'-'.($start + 2);
    Curriculum::factory()->for($gradeLevel)->create(['school_year' => $nextSchoolYear]);

    $this->get(route('site.about'))
        ->assertInertia(fn (Assert $page) => $page->where('enrollment.openSchoolYear', $nextSchoolYear));
});

test('the navbar is told when enrollment is closed', function () {
    $this->get(route('site.contact'))
        ->assertInertia(fn (Assert $page) => $page->where('enrollment.openSchoolYear', null));
});

test('a draft school year does not count as open', function () {
    $gradeLevel = GradeLevel::factory()->create();
    [$start] = explode('-', Enrollment::currentSchoolYear());
    Curriculum::factory()->for($gradeLevel)->create([
        'school_year' => ($start + 1).'-'.($start + 2),
        'is_draft' => true,
    ]);

    $this->get(route('site.about'))
        ->assertInertia(fn (Assert $page) => $page->where('enrollment.openSchoolYear', null));
});

test('the navbar knows the signed-in account\'s email and approval state', function () {
    $enrollee = EnrolleeUser::factory()->pending()->unverified()->create();

    $this->actingAs($enrollee, 'enrollee')
        ->get(route('site.about'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('auth.enrollee.account_status', 'PENDING')
            ->where('auth.enrollee.email_verified_at', null)
            ->missing('auth.enrollee.valid_id_path'));
});
