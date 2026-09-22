<?php

use App\Models\Student;
use App\Models\User;

test('guests cannot assign an lrn', function () {
    $student = Student::factory()->create(['lrn' => null]);

    $this->patch(route('admin.students.assignLrn', $student), ['lrn' => '45250112345678'])
        ->assertRedirect(route('login'));
});

test('non-admin users cannot assign an lrn', function () {
    $staff = User::factory()->create(['role' => 'STAFF']);
    $student = Student::factory()->create(['lrn' => null]);

    $this->actingAs($staff)
        ->patch(route('admin.students.assignLrn', $student), ['lrn' => '45250112345678'])
        ->assertForbidden();
});

test('admins can assign an lrn to a student without one', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $student = Student::factory()->create(['lrn' => null]);

    $this->actingAs($admin)
        ->patch(route('admin.students.assignLrn', $student), ['lrn' => '45250112345678'])
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    expect($student->fresh()->lrn)->toBe('45250112345678');
});

test('the lrn must start with 452501 and be 14 digits', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $student = Student::factory()->create(['lrn' => null]);

    $this->actingAs($admin)
        ->patch(route('admin.students.assignLrn', $student), ['lrn' => '99999912345678'])
        ->assertSessionHasErrors('lrn');

    $this->actingAs($admin)
        ->patch(route('admin.students.assignLrn', $student), ['lrn' => '4525011234'])
        ->assertSessionHasErrors('lrn');

    expect($student->fresh()->lrn)->toBeNull();
});

test('the lrn must be unique', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    Student::factory()->create(['lrn' => '45250112345678']);
    $student = Student::factory()->create(['lrn' => null]);

    $this->actingAs($admin)
        ->patch(route('admin.students.assignLrn', $student), ['lrn' => '45250112345678'])
        ->assertSessionHasErrors('lrn');
});

test('a student who already has an lrn cannot be reassigned one', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $student = Student::factory()->create(['lrn' => '45250112345678']);

    $this->actingAs($admin)
        ->patch(route('admin.students.assignLrn', $student), ['lrn' => '45250187654321'])
        ->assertSessionHasErrors('lrn');

    expect($student->fresh()->lrn)->toBe('45250112345678');
});
