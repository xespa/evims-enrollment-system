<?php

use App\Models\EnrolleeUser;
use App\Models\Enrollment;
use App\Models\Student;
use App\Models\StudentAccount;
use App\Models\User;

test('staff switching account are logged out and sent to the login page', function () {
    $this->actingAs(User::factory()->create())
        ->post(route('logout'), ['switch_account' => 1])
        ->assertRedirect(route('login'))
        ->assertSessionHas('status');

    $this->assertGuest();
});

test('a plain staff log out still goes to the website', function () {
    $this->actingAs(User::factory()->create())
        ->post(route('logout'))
        ->assertRedirect(route('home'))
        ->assertSessionMissing('status');
});

test('portal accounts switching account are logged out and sent to the login page', function () {
    $this->actingAs(EnrolleeUser::factory()->create(), 'enrollee')
        ->post(route('portal.logout'), ['switch_account' => 1])
        ->assertRedirect(route('login'))
        ->assertSessionHas('status');

    $this->assertGuest('enrollee');
});

test('students switching account land on the login page without the student role preselected', function () {
    $student = Student::factory()->create(['lrn' => '123456789012']);
    Enrollment::factory()->create(['student_id' => $student->id, 'enrollment_status' => 'APPROVED']);
    $account = StudentAccount::factory()->active()->create(['student_id' => $student->id]);

    $this->actingAs($account, 'student')
        ->post(route('student.logout'), ['switch_account' => 1])
        ->assertRedirect(route('login'))
        ->assertSessionHas('status');

    $this->assertGuest('student');
});

test('the login page shows why the person landed there', function () {
    $this->actingAs(EnrolleeUser::factory()->create(), 'enrollee')
        ->post(route('portal.logout'), ['switch_account' => 1]);

    $this->get(route('login'))
        ->assertInertia(fn ($page) => $page->where('status', fn (string $status) => str_contains($status, 'Log in with the account you want')));
});
