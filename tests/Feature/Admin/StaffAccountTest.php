<?php

use App\Enums\UserRole;
use App\Models\User;
use App\Notifications\StaffInvitation;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    Notification::fake();
    $this->admin = User::factory()->admin()->create(['name' => 'Ada Admin']);
});

/**
 * Acting as the admin with a recently confirmed password, as staff account
 * routes require.
 */
function asConfirmedAdmin(): mixed
{
    return test()->actingAs(test()->admin)->withSession(['auth.password_confirmed_at' => time()]);
}

test('admins see every staff account with its status', function () {
    User::factory()->teacher()->invited()->create(['name' => 'Ivy Invited']);
    User::factory()->cashier()->deactivated()->create(['name' => 'Dan Deactivated']);

    asConfirmedAdmin()
        ->get(route('admin.staff-accounts.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/StaffAccounts/Index')
            ->has('staffAccounts', 3)
            ->where('staffAccounts.0.name', 'Ada Admin')
            ->where('staffAccounts.0.status', 'active')
            ->where('staffAccounts.1.name', 'Ivy Invited')
            ->where('staffAccounts.1.status', 'invited')
            ->where('staffAccounts.1.role', 'TEACHER')
            ->where('staffAccounts.2.name', 'Dan Deactivated')
            ->where('staffAccounts.2.status', 'deactivated')
            ->has('roles', 4)
        );
});

test('the staff accounts page asks for the password again first', function () {
    $this->actingAs($this->admin)
        ->get(route('admin.staff-accounts.index'))
        ->assertRedirect(route('password.confirm'));
});

test('admins can invite a staff member, who gets an email to set their password', function () {
    asConfirmedAdmin()
        ->post(route('admin.staff-accounts.store'), [
            'name' => 'Rita Registrar',
            'email' => 'rita@example.com',
            'role' => 'REGISTRAR',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('admin.staff-accounts.index'));

    $rita = User::query()->where('email', 'rita@example.com')->firstOrFail();

    expect($rita->role)->toBe(UserRole::Registrar);
    expect($rita->hasPendingInvitation())->toBeTrue();
    expect(Hash::check('password', $rita->password))->toBeFalse();
    expect(DB::table('password_reset_tokens')->where('email', 'rita@example.com')->exists())->toBeTrue();
    Notification::assertSentTo($rita, StaffInvitation::class);
});

test('invitations are validated', function (array $input, string $field) {
    asConfirmedAdmin()
        ->post(route('admin.staff-accounts.store'), [
            'name' => 'New Staff',
            'email' => 'new@example.com',
            'role' => 'TEACHER',
            ...$input,
        ])
        ->assertSessionHasErrors($field);

    Notification::assertNothingSent();
})->with([
    'missing name' => [['name' => ''], 'name'],
    'bad email' => [['email' => 'not-an-email'], 'email'],
    'unknown role' => [['role' => 'STAFF'], 'role'],
    'taken email' => [fn () => ['email' => test()->admin->email], 'email'],
]);

test('admins can change a staff member\'s role', function () {
    $staff = User::factory()->cashier()->create();

    asConfirmedAdmin()
        ->patch(route('admin.staff-accounts.update', $staff), ['role' => 'REGISTRAR'])
        ->assertSessionHasNoErrors();

    expect($staff->refresh()->role)->toBe(UserRole::Registrar);
});

test('admins cannot change their own role', function () {
    asConfirmedAdmin()
        ->patch(route('admin.staff-accounts.update', $this->admin), ['role' => 'TEACHER'])
        ->assertSessionHasErrors('role');

    expect($this->admin->refresh()->role)->toBe(UserRole::Admin);
});

test('deactivating an account signs it out and blocks it', function () {
    $staff = User::factory()->registrar()->create(['remember_token' => 'old-token']);

    asConfirmedAdmin()
        ->post(route('admin.staff-accounts.deactivation.store', $staff))
        ->assertSessionHasNoErrors();

    $staff->refresh();
    expect($staff->isActive())->toBeFalse();
    expect($staff->remember_token)->not->toBe('old-token');

    $this->actingAs($staff)
        ->get(route('admin.students.index'))
        ->assertRedirect(route('login'));
    $this->assertGuest();
});

test('deactivating an invited account voids its invitation link', function () {
    $staff = User::factory()->teacher()->invited()->create();
    DB::table('password_reset_tokens')->insert(['email' => $staff->email, 'token' => 'hashed', 'created_at' => now()]);

    asConfirmedAdmin()->post(route('admin.staff-accounts.deactivation.store', $staff));

    expect(DB::table('password_reset_tokens')->where('email', $staff->email)->exists())->toBeFalse();
});

test('admins cannot deactivate themselves', function () {
    asConfirmedAdmin()
        ->post(route('admin.staff-accounts.deactivation.store', $this->admin))
        ->assertSessionHasErrors('staff_account');

    expect($this->admin->refresh()->isActive())->toBeTrue();
});

test('admins can reactivate an account', function () {
    $staff = User::factory()->teacher()->deactivated()->create();

    asConfirmedAdmin()
        ->delete(route('admin.staff-accounts.deactivation.destroy', $staff))
        ->assertSessionHasNoErrors();

    expect($staff->refresh()->isActive())->toBeTrue();
});

test('admins can resend a pending invitation', function () {
    $staff = User::factory()->teacher()->invited()->create();

    asConfirmedAdmin()
        ->post(route('admin.staff-accounts.invitation.store', $staff))
        ->assertSessionHasNoErrors();

    Notification::assertSentTo($staff, StaffInvitation::class);
});

test('invitations cannot be resent more than once a minute', function () {
    $staff = User::factory()->teacher()->invited()->create();

    asConfirmedAdmin()->post(route('admin.staff-accounts.invitation.store', $staff));
    asConfirmedAdmin()
        ->post(route('admin.staff-accounts.invitation.store', $staff))
        ->assertSessionHasErrors('staff_account');

    Notification::assertSentToTimes($staff, StaffInvitation::class, 1);
});

test('accounts that already set a password have no invitation to resend', function () {
    $staff = User::factory()->teacher()->create();

    asConfirmedAdmin()
        ->post(route('admin.staff-accounts.invitation.store', $staff))
        ->assertSessionHasErrors('staff_account');

    Notification::assertNothingSent();
});

test('only admins can manage staff accounts', function (string $role) {
    $staff = User::factory()->create(['role' => $role]);
    $other = User::factory()->teacher()->create();

    $this->actingAs($staff)->withSession(['auth.password_confirmed_at' => time()]);

    $this->get(route('admin.staff-accounts.index'))->assertForbidden();
    $this->post(route('admin.staff-accounts.store'), [
        'name' => 'Sneaky',
        'email' => 'sneaky@example.com',
        'role' => 'ADMIN',
    ])->assertForbidden();
    $this->patch(route('admin.staff-accounts.update', $other), ['role' => 'ADMIN'])->assertForbidden();
    $this->post(route('admin.staff-accounts.deactivation.store', $other))->assertForbidden();

    expect(User::query()->where('email', 'sneaky@example.com')->exists())->toBeFalse();
    expect($other->refresh()->role)->toBe(UserRole::Teacher);
})->with(['REGISTRAR', 'TEACHER', 'CASHIER']);

test('public registration is turned off', function () {
    expect(Route::has('register'))->toBeFalse();

    $this->post('/register', [
        'name' => 'Stranger',
        'email' => 'stranger@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ])->assertNotFound();

    expect(User::query()->where('email', 'stranger@example.com')->exists())->toBeFalse();
});
