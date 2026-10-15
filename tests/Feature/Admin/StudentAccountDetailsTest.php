<?php

use App\Enums\AuditAction;
use App\Models\AuditLog;
use App\Models\GradeLevel;
use App\Models\StudentAccount;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * An active account whose password is still the student's LRN.
 */
function activeStudentAccount(): StudentAccount
{
    $account = StudentAccount::factory()->active()->create();
    $account->forceFill(['password' => $account->student->lrn])->save();

    return $account;
}

test('admins and registrars can see a student account', function (string $role) {
    $account = activeStudentAccount();

    $this->actingAs(User::factory()->create(['role' => $role]))
        ->get(route('admin.student-accounts.show', $account))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/StudentAccounts/Show')
            ->where('account.id', $account->id)
            ->where('account.status', 'ACTIVE')
            ->where('account.consent_email', $account->consent_email)
            ->where('account.password_status.value', 'STARTING')
            ->where('student.lrn', $account->student->lrn)
            ->where('temporaryPassword', null)
            ->missing('account.password'));
})->with(['ADMIN', 'REGISTRAR']);

test('the account page never sends the password hash', function () {
    $account = activeStudentAccount();

    $response = $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.student-accounts.show', $account));

    expect($response->getContent())->not->toContain($account->fresh()->password);
});

test('teachers and cashiers cannot see student accounts or reset passwords', function (string $role) {
    $account = activeStudentAccount();
    $this->actingAs(User::factory()->create(['role' => $role]));

    $this->get(route('admin.student-accounts.show', $account))->assertForbidden();
    $this->put(route('admin.student-accounts.password.update', $account), ['method' => 'LRN'])->assertForbidden();
})->with(['TEACHER', 'CASHIER']);

test('the password status says whether the student changed it', function () {
    $account = StudentAccount::factory()->active('a-password-only-they-know')->create();

    $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.student-accounts.show', $account))
        ->assertInertia(fn (Assert $page) => $page->where('account.password_status.value', 'CHANGED'));
});

test('accounts that are not active yet have no password status', function () {
    $account = StudentAccount::factory()->create();

    $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.student-accounts.show', $account))
        ->assertInertia(fn (Assert $page) => $page->where('account.password_status', null));
});

test('a password can be reset to the student\'s LRN', function () {
    $account = StudentAccount::factory()->active('forgotten-password')->create();
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->put(route('admin.student-accounts.password.update', $account), ['method' => 'LRN'])
        ->assertRedirect(route('admin.student-accounts.show', $account))
        ->assertSessionMissing('temporaryPassword');

    $account->refresh();

    expect(Hash::check($account->student->lrn, $account->password))->toBeTrue()
        ->and(Hash::check('forgotten-password', $account->password))->toBeFalse()
        ->and($account->must_change_password)->toBeTrue();

    $entry = AuditLog::sole();
    expect($entry->action)->toBe(AuditAction::StudentPasswordReset)
        ->and($entry->user_id)->toBe($admin->id)
        ->and($entry->subject_id)->toBe($account->id)
        ->and($entry->properties)->toBe(['method' => 'LRN']);
});

test('a temporary password is shown once and never stored readable', function () {
    $account = activeStudentAccount();
    $registrar = User::factory()->registrar()->create();

    $this->actingAs($registrar)
        ->put(route('admin.student-accounts.password.update', $account), ['method' => 'TEMPORARY'])
        ->assertRedirect(route('admin.student-accounts.show', $account));

    $temporaryPassword = session('temporaryPassword');
    $account->refresh();

    expect($temporaryPassword)->toBeString()->toHaveLength(10)
        ->and(Hash::check($temporaryPassword, $account->password))->toBeTrue()
        ->and($account->must_change_password)->toBeTrue()
        ->and(AuditLog::sole()->properties)->toBe(['method' => 'TEMPORARY']);

    // Shown on the page right after the reset…
    $this->get(route('admin.student-accounts.show', $account))
        ->assertInertia(fn (Assert $page) => $page
            ->where('temporaryPassword', $temporaryPassword)
            ->where('account.password_status.value', 'RESET')
            ->has('passwordResets', 1));

    // …and gone on the next visit.
    $this->get(route('admin.student-accounts.show', $account))
        ->assertInertia(fn (Assert $page) => $page->where('temporaryPassword', null));
});

test('only an active account\'s password can be reset', function () {
    $account = StudentAccount::factory()->consentGiven()->create();

    $this->actingAs(User::factory()->admin()->create())
        ->put(route('admin.student-accounts.password.update', $account), ['method' => 'LRN'])
        ->assertSessionHasErrors('password');

    expect(AuditLog::count())->toBe(0);
});

test('the reset method must be LRN or temporary', function (?string $method) {
    $account = activeStudentAccount();
    $passwordBefore = $account->password;

    $this->actingAs(User::factory()->admin()->create())
        ->put(route('admin.student-accounts.password.update', $account), ['method' => $method])
        ->assertSessionHasErrors('method');

    expect($account->fresh()->password)->toBe($passwordBefore);
})->with([
    'missing' => [null],
    'unknown' => ['SHOW_ME'],
]);

test('after a reset the student must choose a new password, which clears the flag', function () {
    $account = activeStudentAccount();
    $account->forceFill(['must_change_password' => true])->save();

    $this->actingAs($account, 'student')
        ->get(route('student.dashboard'))
        ->assertInertia(fn (Assert $page) => $page->where('mustChangePassword', true));

    $this->actingAs($account, 'student')
        ->put(route('student.password.update'), [
            'current_password' => $account->student->lrn,
            'password' => 'a-brand-new-password',
            'password_confirmation' => 'a-brand-new-password',
        ])
        ->assertSessionHasNoErrors();

    expect($account->fresh()->must_change_password)->toBeFalse();
});

test('the student accounts list links each account', function () {
    $account = activeStudentAccount();
    $account->student->enrollments()->create([
        'grade_level_id' => GradeLevel::factory()->create()->id,
        'school_year' => '2026-2027',
        'student_type' => 'WITH_LRN',
        'date_of_application' => now(),
        'age' => 10,
        'session_time_preference' => 'MORNING_SESSION',
        'enrollment_status' => 'APPROVED',
    ]);

    $this->actingAs(User::factory()->registrar()->create())
        ->get(route('admin.student-accounts.index'))
        ->assertInertia(fn (Assert $page) => $page->where('students.data.0.account.id', $account->id));
});

test('an N/A extension name is left out of the student\'s name', function (?string $extensionName, string $name) {
    $account = activeStudentAccount();
    $account->student->update([
        'last_name' => 'Español',
        'first_name' => 'Mark Christian',
        'middle_name' => 'Santos',
        'extension_name' => $extensionName,
    ]);

    $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.student-accounts.show', $account))
        ->assertInertia(fn (Assert $page) => $page->where('student.name', $name));
})->with([
    'N/A' => ['N/A', 'Español, Mark Christian Santos'],
    'lowercase n/a' => ['n/a', 'Español, Mark Christian Santos'],
    'none given' => [null, 'Español, Mark Christian Santos'],
    'a real extension' => ['Jr.', 'Español, Mark Christian Santos Jr.'],
]);
