<?php

use App\Enums\AccountType;
use App\Models\EnrolleeUser;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('the login page lists every role, families first', function () {
    $this->get(route('login'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('auth/login')
            ->where('roles.0', ['value' => 'STUDENT', 'label' => 'Student', 'isStaff' => false])
            ->where('roles.1', ['value' => 'PARENT_GUARDIAN', 'label' => 'Parent / Guardian', 'isStaff' => false])
            ->where('roles.5', ['value' => 'ADMIN', 'label' => 'Administrator', 'isStaff' => true])
            ->has('roles', 6)
            ->where('selectedRole', null));
});

test('the login page preselects a role from the link', function () {
    $this->get(route('login', ['role' => 'STUDENT']))
        ->assertInertia(fn (Assert $page) => $page->where('selectedRole', 'STUDENT'));

    $this->get(route('login', ['role' => 'NOT_A_ROLE']))
        ->assertInertia(fn (Assert $page) => $page->where('selectedRole', null));
});

test('the old portal and student login addresses lead to the shared page', function () {
    $this->get(route('portal.login'))->assertRedirect(route('login', ['role' => 'PARENT_GUARDIAN']));
    $this->get(route('student.login'))->assertRedirect(route('login', ['role' => 'STUDENT']));
    $this->get(route('portal.register'))->assertRedirect(route('register', ['role' => 'PARENT_GUARDIAN']));
});

test('signed-in families and students are sent from the login page to their dashboards', function () {
    $this->actingAs(EnrolleeUser::factory()->create(), 'enrollee')
        ->get(route('login'))
        ->assertRedirect(route('portal.dashboard'));
});

test('staff must pick the role their account has', function () {
    $teacher = User::factory()->teacher()->withoutTwoFactor()->create();

    $this->post(route('login.store'), [
        'role' => 'CASHIER',
        'email' => $teacher->email,
        'password' => 'password',
    ])->assertSessionHasErrors(['email' => __('auth.failed')]);

    $this->assertGuest();

    $this->post(route('login.store'), [
        'role' => 'TEACHER',
        'email' => $teacher->email,
        'password' => 'password',
    ])->assertRedirect(route('admin.students.index'));

    $this->assertAuthenticatedAs($teacher);
});

test('staff sign in needs a role', function (?string $role) {
    $teacher = User::factory()->teacher()->withoutTwoFactor()->create();

    $this->post(route('login.store'), [
        'role' => $role,
        'email' => $teacher->email,
        'password' => 'password',
    ])->assertSessionHasErrors('role');

    $this->assertGuest();
})->with([
    'missing' => [null],
    'a family role' => ['PARENT_GUARDIAN'],
]);

test('staff accounts waiting on approval cannot sign in', function () {
    $teacher = User::factory()->teacher()->awaitingApproval()->create();

    $this->post(route('login.store'), [
        'role' => 'TEACHER',
        'email' => $teacher->email,
        'password' => 'password',
    ])->assertSessionHasErrors('email');

    expect(session('errors')->first('email'))->toContain('waiting for an administrator');
    $this->assertGuest();
});

test('rejected staff accounts cannot sign in', function () {
    $teacher = User::factory()->teacher()->rejected()->create();

    $this->post(route('login.store'), [
        'role' => 'TEACHER',
        'email' => $teacher->email,
        'password' => 'password',
    ])->assertSessionHasErrors('email');

    expect(session('errors')->first('email'))->toContain('was not approved');
    $this->assertGuest();
});

test('a portal account signs in only as its own account type', function () {
    $student = EnrolleeUser::factory()->create(['account_type' => AccountType::Student]);

    $this->post(route('portal.login.store'), [
        'account_type' => 'PARENT_GUARDIAN',
        'email' => $student->email,
        'password' => 'password',
    ])->assertSessionHasErrors('email');

    $this->assertGuest('enrollee');

    $this->post(route('portal.login.store'), [
        'account_type' => 'STUDENT',
        'email' => $student->email,
        'password' => 'password',
    ])->assertRedirect(route('portal.dashboard'));

    $this->assertAuthenticatedAs($student, 'enrollee');
});

test('portal sign in needs an account type', function () {
    $parent = EnrolleeUser::factory()->create();

    $this->post(route('portal.login.store'), [
        'email' => $parent->email,
        'password' => 'password',
    ])->assertSessionHasErrors('account_type');

    $this->assertGuest('enrollee');
});
