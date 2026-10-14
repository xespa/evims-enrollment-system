<?php

use App\Enums\AuditAction;
use App\Enums\StudentAccountStatus;
use App\Models\AuditLog;
use App\Models\EnrolleeUser;
use App\Models\Enrollment;
use App\Models\Student;
use App\Models\StudentAccount;
use App\Models\User;
use App\Notifications\StudentAccountConsentRequested;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * A student with an LRN and an approved application from a parent's
 * portal account.
 *
 * @param  array<string, mixed>  $enrollmentAttributes
 */
function consentableEnrollment(array $enrollmentAttributes = []): Enrollment
{
    return Enrollment::factory()->create([
        'student_id' => Student::factory()->create(['lrn' => '123456789012']),
        'enrollee_user_id' => EnrolleeUser::factory()->create(['email' => 'parent@example.com']),
        'email' => 'application@example.com',
        'enrollment_status' => 'APPROVED',
        ...$enrollmentAttributes,
    ]);
}

beforeEach(function () {
    Notification::fake();
    $this->registrar = User::factory()->create(['role' => 'REGISTRAR']);
});

test('staff can ask the parent to consent to a student account', function () {
    $enrollment = consentableEnrollment();

    $this->actingAs($this->registrar)
        ->post(route('admin.students.account-consent.store', $enrollment->student))
        ->assertRedirect()
        ->assertSessionHasNoErrors()
        ->assertSessionHas('success', fn (string $message) => str_contains($message, 'parent@example.com'));

    $account = StudentAccount::sole();

    expect($account->student_id)->toBe($enrollment->student_id)
        ->and($account->status)->toBe(StudentAccountStatus::AwaitingConsent)
        ->and($account->password)->toBeNull()
        ->and($account->consent_email)->toBe('parent@example.com')
        ->and($account->consent_requested_by)->toBe($this->registrar->id)
        ->and($account->consent_expires_at->isFuture())->toBeTrue();

    Notification::assertSentOnDemand(
        StudentAccountConsentRequested::class,
        fn (StudentAccountConsentRequested $notification, array $channels, AnonymousNotifiable $notifiable) => $notifiable->routes['mail'] === 'parent@example.com'
            // Only the hash is stored, never the emailed token.
            && $account->consent_token === StudentAccount::hashConsentToken($notification->token),
    );

    expect(AuditLog::where('action', AuditAction::StudentConsentRequested)->count())->toBe(1);
});

test('the application email is used when the parent has no portal account', function () {
    $enrollment = consentableEnrollment(['enrollee_user_id' => null]);

    $this->actingAs($this->registrar)
        ->post(route('admin.students.account-consent.store', $enrollment->student));

    expect(StudentAccount::sole()->consent_email)->toBe('application@example.com');
});

test('resending replaces the earlier link', function () {
    $enrollment = consentableEnrollment();

    $this->actingAs($this->registrar)->post(route('admin.students.account-consent.store', $enrollment->student));
    $firstToken = StudentAccount::sole()->consent_token;

    $this->actingAs($this->registrar)->post(route('admin.students.account-consent.store', $enrollment->student));

    expect(StudentAccount::count())->toBe(1)
        ->and(StudentAccount::sole()->consent_token)->not->toBe($firstToken);
    Notification::assertSentOnDemandTimes(StudentAccountConsentRequested::class, 2);
});

test('consent cannot be requested for a student who is not ready', function (array $studentAttributes, array $enrollmentAttributes) {
    $enrollment = consentableEnrollment($enrollmentAttributes);
    $enrollment->student->update($studentAttributes);

    $this->actingAs($this->registrar)
        ->post(route('admin.students.account-consent.store', $enrollment->student))
        ->assertSessionHasErrors('account');

    expect(StudentAccount::count())->toBe(0);
    Notification::assertNothingSent();
})->with([
    'no LRN yet' => [['lrn' => null], []],
    'application still pending' => [[], ['enrollment_status' => 'PENDING']],
    'application cancelled' => [[], ['cancelled_at' => now()]],
]);

test('an active account is not asked about again', function () {
    $enrollment = consentableEnrollment();
    StudentAccount::factory()->active()->create(['student_id' => $enrollment->student_id]);

    $this->actingAs($this->registrar)
        ->post(route('admin.students.account-consent.store', $enrollment->student))
        ->assertSessionHasErrors('account');

    Notification::assertNothingSent();
});

test('only staff who review applications can ask for consent', function (string $role) {
    $enrollment = consentableEnrollment();

    $this->actingAs(User::factory()->create(['role' => $role]))
        ->post(route('admin.students.account-consent.store', $enrollment->student))
        ->assertForbidden();

    expect(StudentAccount::count())->toBe(0);
})->with(['TEACHER', 'CASHIER']);

test('guests are sent to the staff login', function () {
    $enrollment = consentableEnrollment();

    $this->post(route('admin.students.account-consent.store', $enrollment->student))
        ->assertRedirect(route('login'));
});

test('the application page shows where the student account stands', function () {
    $enrollment = consentableEnrollment();
    StudentAccount::factory()->create([
        'student_id' => $enrollment->student_id,
        'consent_email' => 'parent@example.com',
    ]);

    $this->actingAs($this->registrar)
        ->get(route('admin.enrollments.show', $enrollment))
        ->assertInertia(fn (Assert $page) => $page
            ->where('studentAccount.status', 'AWAITING_CONSENT')
            ->where('studentAccount.consent_email', 'parent@example.com')
            ->where('studentAccount.blocker', null)
        );
});

test('the application page says why an account cannot be requested yet', function () {
    $enrollment = consentableEnrollment(['enrollment_status' => 'PENDING']);
    $enrollment->student->update(['lrn' => null]);

    $this->actingAs($this->registrar)
        ->get(route('admin.enrollments.show', $enrollment))
        ->assertInertia(fn (Assert $page) => $page
            ->where('studentAccount.status', null)
            ->where('studentAccount.blocker', 'Assign an LRN first; the account is bound to it.')
        );
});
