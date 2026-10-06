<?php

use App\Enums\AuditAction;
use App\Models\AuditLog;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use PragmaRX\Google2FA\Google2FA;

beforeEach(function () {
    $this->staff = User::factory()->registrar()->create();

    $this->post(route('login.store'), [
        'email' => $this->staff->email,
        'password' => 'password',
    ])->assertRedirect(route('two-factor.login'));
});

test('a correct password alone does not sign staff with two-factor in', function () {
    $this->assertGuest();

    $this->get(route('two-factor.login'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('auth/two-factor-challenge'));
});

test('the code from the authenticator app finishes signing in', function () {
    $code = (new Google2FA)->getCurrentOtp(decrypt($this->staff->two_factor_secret));

    $this->post(route('two-factor.login.store'), ['code' => $code])
        ->assertRedirect(route('admin.dashboard'));

    $this->assertAuthenticatedAs($this->staff);
    expect(AuditLog::query()->where('action', AuditAction::SignedIn)->where('user_id', $this->staff->id)->exists())->toBeTrue();
});

test('a recovery code works once in place of the app code', function () {
    $recoveryCode = $this->staff->recoveryCodes()[0];

    $this->post(route('two-factor.login.store'), ['recovery_code' => $recoveryCode])
        ->assertRedirect(route('admin.dashboard'));

    $this->assertAuthenticatedAs($this->staff);
    expect($this->staff->refresh()->recoveryCodes())->not->toContain($recoveryCode);
});

test('a wrong code is rejected', function () {
    $this->post(route('two-factor.login.store'), ['code' => '000000'])
        ->assertRedirect(route('two-factor.login'))
        ->assertSessionHasErrors('code');

    $this->assertGuest();
});

test('guessing codes is rate limited', function () {
    foreach (range(1, 5) as $attempt) {
        $this->post(route('two-factor.login.store'), ['code' => '000000']);
    }

    $this->post(route('two-factor.login.store'), ['code' => '000000'])->assertTooManyRequests();
});
