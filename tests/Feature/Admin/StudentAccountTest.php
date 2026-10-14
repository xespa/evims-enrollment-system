<?php

use App\Enums\AuditAction;
use App\Enums\StudentAccountStatus;
use App\Models\AuditLog;
use App\Models\EnrolleeUser;
use App\Models\Enrollment;
use App\Models\Student;
use App\Models\StudentAccount;
use App\Models\User;
use App\Notifications\StudentAccountCreated;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    Notification::fake();
    $this->registrar = User::factory()->registrar()->create();
});

/**
 * A student with an LRN and an approved application, optionally with a
 * sign-in account in the given factory state.
 */
function studentForAccount(?string $accountState = null, array $studentAttributes = []): Student
{
    $student = Student::factory()->create(['lrn' => '123456789012', 'first_name' => 'Juan', 'last_name' => 'Cruz', ...$studentAttributes]);
    Enrollment::factory()->create([
        'student_id' => $student->id,
        'enrollee_user_id' => EnrolleeUser::factory(),
        'enrollment_status' => 'APPROVED',
    ]);

    if ($accountState !== null) {
        $factory = StudentAccount::factory();
        $factory = $accountState === 'awaiting' ? $factory : $factory->{$accountState}();
        $factory->create(['student_id' => $student->id, 'consent_email' => 'parent@example.com']);
    }

    return $student;
}

test('staff can create the account once the parent has consented', function () {
    $student = studentForAccount('consentGiven');

    $this->actingAs($this->registrar)
        ->post(route('admin.students.account.store', $student))
        ->assertRedirect()
        ->assertSessionHasNoErrors()
        ->assertSessionHas('success');

    $account = $student->account->refresh();

    expect($account->status)->toBe(StudentAccountStatus::Active)
        // Bound to the LRN, which is also the first password.
        ->and(Hash::check('123456789012', $account->password))->toBeTrue();

    expect(AuditLog::query()->where('action', AuditAction::StudentAccountCreated)->sole()->user_id)->toBe($this->registrar->id);

    Notification::assertSentOnDemand(
        StudentAccountCreated::class,
        fn (StudentAccountCreated $notification, array $channels, AnonymousNotifiable $notifiable) => $notifiable->routes['mail'] === 'parent@example.com',
    );
});

test('the new account signs in with the LRN', function () {
    $student = studentForAccount('consentGiven');

    $this->actingAs($this->registrar)->post(route('admin.students.account.store', $student));
    auth()->logout();

    $this->post(route('student.login.store'), ['lrn' => '123456789012', 'password' => '123456789012'])
        ->assertRedirect(route('student.dashboard'));

    $this->assertAuthenticatedAs($student->account, 'student');
});

test('an account the parent has not agreed to cannot be signed in to or created', function (?string $state) {
    $student = studentForAccount($state);

    $this->actingAs($this->registrar)
        ->post(route('admin.students.account.store', $student))
        ->assertSessionHasErrors('account');

    expect($student->account?->refresh()->status)->not->toBe(StudentAccountStatus::Active);
    Notification::assertSentOnDemandTimes(StudentAccountCreated::class, 0);
})->with([
    'no request yet' => [null],
    'awaiting consent' => ['awaiting'],
    'declined' => ['declined'],
]);

test('an active account is not created again', function () {
    $student = studentForAccount('active');
    $password = $student->account->password;

    $this->actingAs($this->registrar)
        ->post(route('admin.students.account.store', $student))
        ->assertSessionHasErrors(['account' => 'This student already has an active account.']);

    expect($student->account->refresh()->password)->toBe($password);
});

test('consent is not asked again once the parent agreed', function () {
    $student = studentForAccount('consentGiven');

    $this->actingAs($this->registrar)
        ->post(route('admin.students.account-consent.store', $student))
        ->assertSessionHasErrors('account');

    expect($student->account->refresh()->status)->toBe(StudentAccountStatus::ConsentGiven);
});

test('only staff who review applications can create accounts', function (string $role) {
    $student = studentForAccount('consentGiven');

    $this->actingAs(User::factory()->create(['role' => $role]))
        ->post(route('admin.students.account.store', $student))
        ->assertForbidden();

    expect($student->account->refresh()->status)->toBe(StudentAccountStatus::ConsentGiven);
})->with(['TEACHER', 'CASHIER']);

test('guests are sent to the login page', function () {
    $student = studentForAccount('consentGiven');

    $this->post(route('admin.students.account.store', $student))->assertRedirect(route('login'));
    $this->get(route('admin.student-accounts.index'))->assertRedirect(route('login'));
});

test('the student accounts page lists students with an approved application', function () {
    studentForAccount('consentGiven');
    Student::factory()->create(['last_name' => 'Unapproved']);

    $this->actingAs($this->registrar)
        ->get(route('admin.student-accounts.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/StudentAccounts/Index')
            ->has('students.data', 1)
            ->where('students.data.0.name', 'Juan Cruz')
            ->where('students.data.0.lrn', '123456789012')
            ->where('students.data.0.account.status', 'CONSENT_GIVEN')
            ->where('filters.status', 'ALL')
            ->where('statuses', fn ($statuses) => collect($statuses)->firstWhere('value', 'CONSENT_GIVEN')['count'] === 1
                && collect($statuses)->firstWhere('value', 'ALL')['count'] === 1));
});

test('the student accounts page filters by status and searches by name or LRN', function () {
    studentForAccount('consentGiven');
    studentForAccount(null, ['lrn' => '999999999999', 'first_name' => 'Ana', 'last_name' => 'Reyes']);

    $this->actingAs($this->registrar)
        ->get(route('admin.student-accounts.index', ['status' => 'NONE']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('students.data', 1)
            ->where('students.data.0.name', 'Ana Reyes'));

    $this->actingAs($this->registrar)
        ->get(route('admin.student-accounts.index', ['status' => 'CONSENT_GIVEN']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('students.data', 1)
            ->where('students.data.0.name', 'Juan Cruz'));

    $this->actingAs($this->registrar)
        ->get(route('admin.student-accounts.index', ['search' => '99999']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('students.data', 1)
            ->where('students.data.0.name', 'Ana Reyes'));
});

test('the status filter is validated', function () {
    $this->actingAs($this->registrar)
        ->get(route('admin.student-accounts.index', ['status' => 'BOGUS']))
        ->assertSessionHasErrors('status');
});

test('only staff who review applications can open the student accounts page', function () {
    $this->actingAs(User::factory()->teacher()->create())
        ->get(route('admin.student-accounts.index'))
        ->assertForbidden();
});
