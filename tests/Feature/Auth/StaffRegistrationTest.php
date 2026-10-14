<?php

use App\Enums\AccountStatus;
use App\Enums\AuditAction;
use App\Enums\UserRole;
use App\Models\AuditLog;
use App\Models\EnrolleeUser;
use App\Models\User;
use App\Notifications\StaffAccountAwaitingApproval;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    Notification::fake();
});

/**
 * @return array<string, mixed>
 */
function staffSignUp(array $overrides = []): array
{
    return [
        'role' => 'TEACHER',
        'name' => 'Tess Teacher',
        'email' => 'tess@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'terms' => '1',
        ...$overrides,
    ];
}

test('the sign-up page offers every role except administrator', function () {
    $this->get(route('register', ['role' => 'CASHIER']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('auth/register')
            ->has('roles', 5)
            ->where('roles.4', ['value' => 'REGISTRAR', 'label' => 'Registrar', 'isStaff' => true])
            ->where('selectedRole', 'CASHIER'));
});

test('staff can ask for an account, which waits for an admin', function () {
    $admin = User::factory()->admin()->create();
    $pendingAdmin = User::factory()->admin()->awaitingApproval()->create();

    $this->post(route('staff-registrations.store'), staffSignUp(['email' => 'Tess@Example.com']))
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('login', ['role' => 'TEACHER']))
        ->assertSessionHas('status');

    $tess = User::query()->where('email', 'tess@example.com')->sole();

    expect($tess->role)->toBe(UserRole::Teacher)
        ->and($tess->account_status)->toBe(AccountStatus::Pending);
    $this->assertGuest();

    Notification::assertSentTo($admin, StaffAccountAwaitingApproval::class);
    Notification::assertNotSentTo($pendingAdmin, StaffAccountAwaitingApproval::class);

    expect(AuditLog::query()->where('action', AuditAction::StaffSignUpRequested)->sole()->user_id)->toBe($tess->id);
});

test('nobody can sign up as an administrator or a family role here', function (string $role) {
    $this->post(route('staff-registrations.store'), staffSignUp(['role' => $role]))
        ->assertSessionHasErrors('role');

    expect(User::query()->where('email', 'tess@example.com')->exists())->toBeFalse();
})->with(['ADMIN', 'PARENT_GUARDIAN', 'STUDENT']);

test('staff sign-ups are validated', function (array $input, string $field) {
    User::factory()->create(['email' => 'taken@example.com']);

    $this->post(route('staff-registrations.store'), staffSignUp($input))
        ->assertSessionHasErrors($field);
})->with([
    'email already used' => [['email' => 'taken@example.com'], 'email'],
    'passwords differ' => [['password_confirmation' => 'something-else'], 'password'],
    'terms not accepted' => [['terms' => null], 'terms'],
    'no name' => [['name' => ''], 'name'],
]);

test('signed-in portal accounts cannot open the sign-up page', function () {
    $this->actingAs(EnrolleeUser::factory()->create(), 'enrollee')
        ->get(route('register'))
        ->assertRedirect(route('portal.dashboard'));
});

test('staff waiting on approval get no staff notifications', function () {
    User::factory()->registrar()->awaitingApproval()->create();

    expect(User::query()->applicationReviewers()->count())->toBe(0);
});
