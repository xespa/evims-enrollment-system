<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->staff = User::factory()->teacher()->invited()->create(['name' => 'Tess Teacher']);
    $this->token = Password::broker('staff_invitations')->createToken($this->staff);
});

test('the invitation page shows a valid link', function () {
    $this->get(route('invitation.create', ['token' => $this->token, 'email' => $this->staff->email]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('auth/accept-invitation')
            ->where('isValid', true)
            ->where('name', 'Tess Teacher')
        );
});

test('the invitation page says when a link is invalid, without naming anyone', function () {
    $this->get(route('invitation.create', ['token' => 'wrong-token', 'email' => $this->staff->email]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('isValid', false)
            ->where('name', null)
        );
});

test('invited staff can set their password and then sign in', function () {
    $this->post(route('invitation.store'), [
        'token' => $this->token,
        'email' => $this->staff->email,
        'password' => 'a-strong-new-password',
        'password_confirmation' => 'a-strong-new-password',
    ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('login'));

    $this->staff->refresh();
    expect(Hash::check('a-strong-new-password', $this->staff->password))->toBeTrue();
    expect($this->staff->hasPendingInvitation())->toBeFalse();
    expect($this->staff->email_verified_at)->not->toBeNull();
    $this->assertGuest();
});

test('an invitation link only works once', function () {
    $input = [
        'token' => $this->token,
        'email' => $this->staff->email,
        'password' => 'a-strong-new-password',
        'password_confirmation' => 'a-strong-new-password',
    ];

    $this->post(route('invitation.store'), $input)->assertSessionHasNoErrors();
    $this->post(route('invitation.store'), [...$input, 'password' => 'another-password', 'password_confirmation' => 'another-password'])
        ->assertSessionHasErrors('email');

    expect(Hash::check('a-strong-new-password', $this->staff->refresh()->password))->toBeTrue();
});

test('an expired invitation link is rejected', function () {
    $this->travel(49)->hours();

    $this->post(route('invitation.store'), [
        'token' => $this->token,
        'email' => $this->staff->email,
        'password' => 'a-strong-new-password',
        'password_confirmation' => 'a-strong-new-password',
    ])->assertSessionHasErrors('email');

    expect($this->staff->refresh()->hasPendingInvitation())->toBeTrue();
});

test('the new password must be confirmed', function () {
    $this->post(route('invitation.store'), [
        'token' => $this->token,
        'email' => $this->staff->email,
        'password' => 'a-strong-new-password',
        'password_confirmation' => 'something-else',
    ])->assertSessionHasErrors('password');
});

test('a deactivated account cannot accept its invitation', function () {
    $this->staff->forceFill(['deactivated_at' => now()])->save();

    $this->post(route('invitation.store'), [
        'token' => $this->token,
        'email' => $this->staff->email,
        'password' => 'a-strong-new-password',
        'password_confirmation' => 'a-strong-new-password',
    ])->assertSessionHasErrors('email');

    expect($this->staff->refresh()->hasPendingInvitation())->toBeTrue();
});
