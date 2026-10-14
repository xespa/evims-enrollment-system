<?php

use App\Enums\AccountType;
use App\Models\EnrolleeUser;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    Notification::fake();
    Storage::fake('local');
});

/**
 * @return array<string, mixed>
 */
function registrationAs(?string $accountType): array
{
    return [
        'account_type' => $accountType,
        'name' => 'Ana Reyes',
        'email' => 'ana@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'valid_id' => UploadedFile::fake()->image('school-id.jpg'),
        'terms' => '1',
    ];
}

test('the register page offers student and parent/guardian', function () {
    $this->get(route('register'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('auth/register')
            ->where('roles.0', ['value' => 'STUDENT', 'label' => 'Student', 'isStaff' => false])
            ->where('roles.1', ['value' => 'PARENT_GUARDIAN', 'label' => 'Parent / Guardian', 'isStaff' => false]));
});

test('the chosen account type is saved', function (string $value, AccountType $expected) {
    $this->post(route('portal.register.store'), registrationAs($value))
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('portal.verification.notice'));

    expect(EnrolleeUser::sole()->account_type)->toBe($expected);
})->with([
    'parent / guardian' => ['PARENT_GUARDIAN', AccountType::ParentGuardian],
    'student' => ['STUDENT', AccountType::Student],
]);

test('an account type must be chosen', function (?string $value) {
    $this->post(route('portal.register.store'), registrationAs($value))
        ->assertSessionHasErrors('account_type');

    expect(EnrolleeUser::count())->toBe(0);
    expect(Storage::disk('local')->allFiles())->toBeEmpty();
})->with([
    'missing' => [null],
    'unknown' => ['TEACHER'],
]);

test('logged-in accounts cannot open the register page', function () {
    $this->actingAs(EnrolleeUser::factory()->create(), 'enrollee')
        ->get(route('portal.register'))
        ->assertRedirect(route('portal.dashboard'));
});

test('admins see each account\'s type when reviewing', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    EnrolleeUser::factory()->pending()->create(['account_type' => AccountType::Student]);

    $this->actingAs($admin)
        ->get(route('admin.enrollee-accounts.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('accounts.data.0.account_type', 'STUDENT'));
});

test('remember me keeps a portal login across sessions', function () {
    $enrollee = EnrolleeUser::factory()->create();

    $this->post(route('portal.login.store'), [
        'account_type' => 'PARENT_GUARDIAN',
        'email' => $enrollee->email,
        'password' => 'password',
        'remember' => 'on',
    ])->assertRedirect(route('portal.dashboard'));

    expect($enrollee->fresh()->remember_token)->not->toBeNull();
});
