<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;

test('guests cannot view the admin settings pages', function () {
    $this->get(route('admin.settings.profile.edit'))->assertRedirect(route('login'));
    $this->get(route('admin.settings.security.edit'))->assertRedirect(route('login'));
});

test('non-admin users cannot view the admin settings pages', function () {
    $staff = User::factory()->create(['role' => 'STAFF']);

    $this->actingAs($staff)
        ->get(route('admin.settings.profile.edit'))
        ->assertForbidden();

    $this->actingAs($staff)
        ->get(route('admin.settings.security.edit'))
        ->assertForbidden();
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
        ->get(route('admin.settings.security.edit'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Admin/Settings/Security'));
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
