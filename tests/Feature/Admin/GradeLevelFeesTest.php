<?php

use App\Models\Curriculum;
use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('the total fee is derived from the fee breakdown', function () {
    $curriculum = Curriculum::factory()->create([
        'registration_fee' => 1725,
        'miscellaneous_fee' => 6125,
        'monthly_tuition' => 1380,
        'monthly_laboratory_fee' => 590,
        'books_fee' => 8841,
        'tuition_fee' => 1,
    ]);

    expect((float) $curriculum->fresh()->tuition_fee)->toBe(36391.0);
});

test('admins can update a school year\'s fee breakdown for a grade level', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $curriculum = Curriculum::factory()->create();

    $this->actingAs($admin)
        ->patch(route('admin.curricula.update', $curriculum), [
            'registration_fee' => 1725,
            'miscellaneous_fee' => 5175,
            'monthly_tuition' => 1725,
            'monthly_laboratory_fee' => 0,
            'books_fee' => 5251,
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $curriculum->refresh();

    expect((float) $curriculum->monthly_tuition)->toBe(1725.0)
        ->and((float) $curriculum->books_fee)->toBe(5251.0)
        ->and((float) $curriculum->tuition_fee)->toBe(29401.0);
});

test('updating one school year\'s fees leaves other years alone', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $gradeLevel = GradeLevel::factory()->create();
    $thisYear = Curriculum::factory()->for($gradeLevel)->totalFee(30000)->create(['school_year' => '2026-2027']);
    $nextYear = Curriculum::factory()->for($gradeLevel)->totalFee(30000)->create(['school_year' => '2027-2028']);

    $this->actingAs($admin)->patch(route('admin.curricula.update', $nextYear), [
        'registration_fee' => 35000,
        'miscellaneous_fee' => 0,
        'monthly_tuition' => 0,
        'monthly_laboratory_fee' => 0,
        'books_fee' => 0,
    ]);

    expect((float) $nextYear->fresh()->tuition_fee)->toBe(35000.0)
        ->and((float) $thisYear->fresh()->tuition_fee)->toBe(30000.0);
});

test('fee breakdown values are required and cannot be negative', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $curriculum = Curriculum::factory()->create();

    $this->actingAs($admin)
        ->patch(route('admin.curricula.update', $curriculum), [
            'registration_fee' => -1,
            'miscellaneous_fee' => 5175,
            'monthly_tuition' => 1725,
            'monthly_laboratory_fee' => 0,
        ])
        ->assertSessionHasErrors(['registration_fee', 'books_fee']);
});

test('non-admin users cannot update fees', function () {
    $staff = User::factory()->create(['role' => 'STAFF']);
    $curriculum = Curriculum::factory()->create();

    $this->actingAs($staff)
        ->patch(route('admin.curricula.update', $curriculum), ['registration_fee' => 0])
        ->assertForbidden();
});

test('the enrollment form receives each open school year\'s fee breakdown and total', function () {
    $gradeLevel = GradeLevel::factory()->withCurriculum([
        'registration_fee' => 1725,
        'miscellaneous_fee' => 6325,
        'monthly_tuition' => 2070,
        'monthly_laboratory_fee' => 690,
        'books_fee' => 5099,
    ])->create();

    $schoolYear = Enrollment::currentSchoolYear();
    $key = "curricula.{$schoolYear}.{$gradeLevel->id}";

    $this->get(route('admission.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Enrollment/Create')
            ->where('gradeLevels.0.id', $gradeLevel->id)
            ->where("{$key}.registration_fee", '1725.00')
            ->where("{$key}.miscellaneous_fee", '6325.00')
            ->where("{$key}.monthly_tuition", '2070.00')
            ->where("{$key}.monthly_laboratory_fee", '690.00')
            ->where("{$key}.books_fee", '5099.00')
            ->where("{$key}.tuition_fee", '40749.00')
        );
});

test('the enrollment form only offers the newest set-up school year', function () {
    $gradeLevel = GradeLevel::factory()->create();
    [$start] = explode('-', Enrollment::currentSchoolYear());
    $year = fn (int $offset) => ($start + $offset).'-'.($start + $offset + 1);

    foreach ([-2, -1, 0, 1] as $offset) {
        Curriculum::factory()->for($gradeLevel)->create(['school_year' => $year($offset)]);
    }

    $this->get(route('admission.create'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('curricula', 1)
            ->has("curricula.{$year(1)}")
        );
});

test('the enrollment form offers last school year while nothing newer is set up', function () {
    $gradeLevel = GradeLevel::factory()->create();
    [$start] = explode('-', Enrollment::currentSchoolYear());
    $year = fn (int $offset) => ($start + $offset).'-'.($start + $offset + 1);

    foreach ([-2, -1] as $offset) {
        Curriculum::factory()->for($gradeLevel)->create(['school_year' => $year($offset)]);
    }

    $this->get(route('admission.create'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('curricula', 1)
            ->has("curricula.{$year(-1)}")
        );
});

test('the enrollment form offers no school year once they are all too old', function () {
    $gradeLevel = GradeLevel::factory()->create();
    [$start] = explode('-', Enrollment::currentSchoolYear());
    Curriculum::factory()->for($gradeLevel)->create(['school_year' => ($start - 2).'-'.($start - 1)]);

    $this->get(route('admission.create'))
        ->assertInertia(fn (Assert $page) => $page->where('curricula', []));
});
