<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Testing\AssertableInertia as Assert;

test('guests cannot view the admin settings pages', function () {
    $this->get(route('admin.settings.profile.edit'))->assertRedirect(route('login'));
    $this->get(route('admin.settings.security.edit'))->assertRedirect(route('login'));
});

test('every staff role can view their own settings pages', function (string $role) {
    $staff = User::factory()->create(['role' => $role]);

    $this->actingAs($staff)
        ->get(route('admin.settings.profile.edit'))
        ->assertOk();

    $this->actingAs($staff)
        ->withSession(['auth.password_confirmed_at' => time()])
        ->get(route('admin.settings.security.edit'))
        ->assertOk();
})->with(['REGISTRAR', 'TEACHER', 'CASHIER']);

test('the security settings page asks for the password again first', function () {
    $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.settings.security.edit'))
        ->assertRedirect(route('password.confirm'));
});

test('only admins can delete their own account', function () {
    $teacher = User::factory()->teacher()->create();

    $this->actingAs($teacher)
        ->delete(route('admin.settings.destroy'), ['password' => 'password'])
        ->assertForbidden();

    expect($teacher->fresh())->not->toBeNull();
});

test('the only administrator cannot delete their account', function () {
    $admin = User::factory()->admin()->create();
    User::factory()->admin()->deactivated()->create();

    $this->actingAs($admin)
        ->from(route('admin.settings.profile.edit'))
        ->delete(route('admin.settings.destroy'), ['password' => 'password'])
        ->assertSessionHasErrors('password')
        ->assertRedirect(route('admin.settings.profile.edit'));

    expect($admin->fresh())->not->toBeNull();
});

test('admins can view the profile settings page', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);

    $this->actingAs($admin)
        ->get(route('admin.settings.profile.edit'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Admin/Settings/Profile'));
});

test('admins can view the security settings page', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);

    $this->actingAs($admin)
        ->withSession(['auth.password_confirmed_at' => time()])
        ->get(route('admin.settings.security.edit'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Settings/Security')
            ->where('passwordRules', Password::defaults()->toPasswordRulesString())
        );
});

test('admins can update their profile without leaving the admin panel', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);

    $response = $this
        ->actingAs($admin)
        ->from(route('admin.settings.profile.edit'))
        ->patch(route('admin.settings.profile.update'), [
            'name' => 'Updated Admin',
            'email' => 'updated-admin@example.com',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('admin.settings.profile.edit'));

    expect($admin->refresh()->name)->toBe('Updated Admin');
    expect($admin->email)->toBe('updated-admin@example.com');
});

test('admins can update their password', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);

    $response = $this
        ->actingAs($admin)
        ->from(route('admin.settings.security.edit'))
        ->put(route('admin.settings.password.update'), [
            'current_password' => 'password',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('admin.settings.security.edit'));

    expect(Hash::check('new-password', $admin->refresh()->password))->toBeTrue();
});

test('admins can delete their account with the correct password', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    User::factory()->admin()->create();

    $response = $this
        ->actingAs($admin)
        ->delete(route('admin.settings.destroy'), [
            'password' => 'password',
        ]);

    $response->assertSessionHasNoErrors()->assertRedirect(route('home'));

    $this->assertGuest();
    expect($admin->fresh())->toBeNull();
});

test('admin account deletion requires the correct password', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);

    $response = $this
        ->actingAs($admin)
        ->from(route('admin.settings.profile.edit'))
        ->delete(route('admin.settings.destroy'), [
            'password' => 'wrong-password',
        ]);

    $response
        ->assertSessionHasErrors('password')
        ->assertRedirect(route('admin.settings.profile.edit'));

    expect($admin->fresh())->not->toBeNull();
});
