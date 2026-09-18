<?php

use App\Models\Enrollment;
use App\Models\Student;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests cannot view the admin students list', function () {
    $this->get(route('admin.students.index'))->assertRedirect(route('login'));
});

test('non-admin users cannot view the admin students list', function () {
    $staff = User::factory()->create(['role' => 'STAFF']);

    $this->actingAs($staff)
        ->get(route('admin.students.index'))
        ->assertForbidden();
});

test('admins can view the students list with their latest enrollment', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);

    $student = Student::factory()->create(['last_name' => 'Santos', 'first_name' => 'Maria']);
    $enrollment = Enrollment::factory()->create([
        'student_id' => $student->id,
        'school_year' => '2026-2027',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.students.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Students/Index')
            ->has('students.data', 1)
            ->where('students.data.0.id', $student->id)
            ->where('students.data.0.latest_enrollment.id', $enrollment->id)
            ->where('students.data.0.latest_enrollment.grade_level.id', $enrollment->grade_level_id)
        );
});

test('admins can search students by name or lrn', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);

    Student::factory()->create(['last_name' => 'Cruz', 'first_name' => 'Juan']);
    Student::factory()->create(['last_name' => 'Reyes', 'first_name' => 'Ana']);

    $this->actingAs($admin)
        ->get(route('admin.students.index', ['search' => 'Cruz']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('students.data', 1)
            ->where('students.data.0.last_name', 'Cruz')
        );
});
