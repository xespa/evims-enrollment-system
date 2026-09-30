<?php

use App\Models\GradeLevel;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('the total fee is derived from the fee breakdown', function () {
    $gradeLevel = GradeLevel::factory()->create([
        'registration_fee' => 1725,
        'miscellaneous_fee' => 6125,
        'monthly_tuition' => 1380,
        'monthly_laboratory_fee' => 590,
        'books_fee' => 8841,
        'tuition_fee' => 1,
    ]);

    expect((float) $gradeLevel->fresh()->tuition_fee)->toBe(36391.0);
});

test('admins can update a grade level fee breakdown', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $gradeLevel = GradeLevel::factory()->create();

    $this->actingAs($admin)
        ->patch(route('admin.grade-levels.update', $gradeLevel), [
            'registration_fee' => 1725,
            'miscellaneous_fee' => 5175,
            'monthly_tuition' => 1725,
            'monthly_laboratory_fee' => 0,
            'books_fee' => 5251,
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $gradeLevel->refresh();

    expect((float) $gradeLevel->monthly_tuition)->toBe(1725.0)
        ->and((float) $gradeLevel->books_fee)->toBe(5251.0)
        ->and((float) $gradeLevel->tuition_fee)->toBe(29401.0);
});

test('fee breakdown values are required and cannot be negative', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $gradeLevel = GradeLevel::factory()->create();

    $this->actingAs($admin)
        ->patch(route('admin.grade-levels.update', $gradeLevel), [
            'registration_fee' => -1,
            'miscellaneous_fee' => 5175,
            'monthly_tuition' => 1725,
            'monthly_laboratory_fee' => 0,
        ])
        ->assertSessionHasErrors(['registration_fee', 'books_fee']);
});

test('non-admin users cannot update grade level fees', function () {
    $staff = User::factory()->create(['role' => 'STAFF']);
    $gradeLevel = GradeLevel::factory()->create();

    $this->actingAs($staff)
        ->patch(route('admin.grade-levels.update', $gradeLevel), ['registration_fee' => 0])
        ->assertForbidden();
});

test('the enrollment form receives each grade level fee breakdown and total', function () {
    $gradeLevel = GradeLevel::factory()->create([
        'registration_fee' => 1725,
        'miscellaneous_fee' => 6325,
        'monthly_tuition' => 2070,
        'monthly_laboratory_fee' => 690,
        'books_fee' => 5099,
    ]);

    $this->get(route('admission.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Enrollment/Create')
            ->where('gradeLevels.0.id', $gradeLevel->id)
            ->where('gradeLevels.0.registration_fee', '1725.00')
            ->where('gradeLevels.0.miscellaneous_fee', '6325.00')
            ->where('gradeLevels.0.monthly_tuition', '2070.00')
            ->where('gradeLevels.0.monthly_laboratory_fee', '690.00')
            ->where('gradeLevels.0.books_fee', '5099.00')
            ->where('gradeLevels.0.tuition_fee', '40749.00')
        );
});
