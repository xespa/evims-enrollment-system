<?php

use App\Enums\AuditAction;
use App\Models\AuditLog;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use PragmaRX\Google2FA\Google2FA;

test('admins and registrars must set up two-factor before using the panel', function (string $role) {
    $staff = User::factory()->withoutTwoFactor()->create(['role' => $role]);

    $this->actingAs($staff)
        ->get(route('admin.students.index'))
        ->assertRedirect(route('admin.settings.security.edit'));
})->with(['ADMIN', 'REGISTRAR']);

test('two-factor is optional for teachers and cashiers', function (string $role) {
    $staff = User::factory()->withoutTwoFactor()->create(['role' => $role]);

    $this->actingAs($staff)
        ->get(route('admin.students.index'))
        ->assertOk();
})->with(['TEACHER', 'CASHIER']);

test('staff without required two-factor can still reach their settings', function () {
    $admin = User::factory()->admin()->withoutTwoFactor()->create();

    $this->actingAs($admin)->get(route('admin.settings.profile.edit'))->assertOk();

    $this->actingAs($admin)
        ->withSession(['auth.password_confirmed_at' => time()])
        ->get(route('admin.settings.security.edit'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('twoFactor.isRequired', true)
            ->where('twoFactor.isEnabled', false)
            ->where('twoFactor.isPending', false)
        );
});

test('background requests are refused until two-factor is set up', function () {
    $this->actingAs(User::factory()->admin()->withoutTwoFactor()->create())
        ->getJson(route('admin.notifications.index'))
        ->assertForbidden();
});

test('staff can turn on two-factor by scanning the code and confirming it', function () {
    $admin = User::factory()->admin()->withoutTwoFactor()->create();
    $this->actingAs($admin)->withSession(['auth.password_confirmed_at' => time()]);

    $this->post(route('two-factor.enable'))->assertRedirect();

    $this->get(route('admin.settings.security.edit'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('twoFactor.isPending', true)
            ->where('twoFactor.qrCodeSvg', fn (string $svg) => str_contains($svg, '<svg'))
            ->where('twoFactor.setupKey', decrypt($admin->refresh()->two_factor_secret))
        );

    $code = (new Google2FA)->getCurrentOtp(decrypt($admin->two_factor_secret));

    $this->post(route('two-factor.confirm'), ['code' => $code])->assertSessionHasNoErrors();

    expect($admin->refresh()->hasEnabledTwoFactorAuthentication())->toBeTrue();
    expect(AuditLog::query()->where('action', AuditAction::TwoFactorEnabled)->where('user_id', $admin->id)->exists())->toBeTrue();

    $this->get(route('admin.students.index'))->assertOk();
});

test('a wrong confirmation code leaves two-factor off', function () {
    $admin = User::factory()->admin()->withoutTwoFactor()->create();
    $this->actingAs($admin)->withSession(['auth.password_confirmed_at' => time()]);

    $this->post(route('two-factor.enable'));
    $this->post(route('two-factor.confirm'), ['code' => '000000'])
        ->assertSessionHasErrorsIn('confirmTwoFactorAuthentication', 'code');

    expect($admin->refresh()->hasEnabledTwoFactorAuthentication())->toBeFalse();
});

test('recovery codes are only sent when asked for', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->withSession(['auth.password_confirmed_at' => time()])
        ->get(route('admin.settings.security.edit'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('twoFactor.isEnabled', true)
            ->missing('recoveryCodes')
            ->reloadOnly('recoveryCodes', fn (Assert $reload) => $reload->has('recoveryCodes', 8))
        );
});

test('recovery codes are shown right after they are regenerated', function () {
    $admin = User::factory()->admin()->create();
    $this->actingAs($admin)->withSession(['auth.password_confirmed_at' => time()]);

    $this->from(route('admin.settings.security.edit'))
        ->post(route('two-factor.regenerate-recovery-codes'))
        ->assertRedirect(route('admin.settings.security.edit'));

    $this->get(route('admin.settings.security.edit'))
        ->assertInertia(fn (Assert $page) => $page->has('recoveryCodes', 8));

    expect(AuditLog::query()->where('action', AuditAction::RecoveryCodesRegenerated)->exists())->toBeTrue();
});

test('managing two-factor needs a recently confirmed password', function () {
    $this->actingAs(User::factory()->teacher()->withoutTwoFactor()->create())
        ->post(route('two-factor.enable'))
        ->assertRedirect(route('password.confirm'));
});
