<?php

use App\Enums\StudentAccountStatus;
use App\Models\Enrollment;
use App\Models\Student;
use App\Models\StudentAccount;
use App\Models\User;
use App\Notifications\StudentAccountConsentAnswered;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * An account awaiting consent, and the plain token from its emailed link.
 *
 * @return array{0: StudentAccount, 1: string}
 */
function awaitingConsent(): array
{
    $student = Student::factory()->create(['lrn' => '123456789012', 'first_name' => 'Juan', 'last_name' => 'Cruz']);
    Enrollment::factory()->create(['student_id' => $student->id, 'enrollment_status' => 'APPROVED']);

    $account = StudentAccount::factory()->create(['student_id' => $student->id]);
    $token = $account->issueConsentToken();
    $account->save();

    return [$account, $token];
}

beforeEach(function () {
    Notification::fake();
});

test('the parent sees who the account is for', function () {
    [, $token] = awaitingConsent();

    $this->get(route('student-consent.show', $token))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('StudentConsent/Show')
            ->where('request.student_name', 'Juan Cruz')
            ->where('request.lrn', '123456789012')
        );
});

test('a wrong, used or expired link shows nothing about the student', function () {
    [$account, $token] = awaitingConsent();

    $this->get(route('student-consent.show', 'not-a-real-token'))
        ->assertInertia(fn (Assert $page) => $page->where('request', null));

    $this->travel(StudentAccount::CONSENT_LINK_DAYS + 1)->days();

    $this->get(route('student-consent.show', $token))
        ->assertInertia(fn (Assert $page) => $page->where('request', null));
});

test('agreeing activates the account with the LRN as the first password', function () {
    [$account, $token] = awaitingConsent();
    $registrar = User::factory()->create(['role' => 'REGISTRAR']);

    $this->put(route('student-consent.update', $token), [
        'decision' => 'agree',
        'parent_name' => 'Maria Cruz',
        'consent' => true,
        // A parent can't choose the password.
        'password' => 'Parent-Chosen-1',
    ])
        ->assertRedirect(route('student-consent.show', $token))
        ->assertSessionHas('consent_result.agreed', true);

    $account->refresh();

    expect($account->status)->toBe(StudentAccountStatus::Active)
        ->and(Hash::check('123456789012', $account->password))->toBeTrue()
        ->and($account->consent_given_by)->toBe('Maria Cruz')
        ->and($account->consent_responded_at)->not->toBeNull()
        ->and($account->consent_token)->toBeNull();

    Notification::assertSentTo($registrar, StudentAccountConsentAnswered::class);

    // The link only works once.
    $this->put(route('student-consent.update', $token), ['decision' => 'decline', 'parent_name' => 'Maria Cruz'])
        ->assertNotFound();
});

test('declining keeps the account from being used', function () {
    [$account, $token] = awaitingConsent();

    $this->put(route('student-consent.update', $token), [
        'decision' => 'decline',
        'parent_name' => 'Maria Cruz',
    ])->assertSessionHas('consent_result.agreed', false);

    $account->refresh();

    expect($account->status)->toBe(StudentAccountStatus::Declined)
        ->and($account->password)->toBeNull()
        ->and($account->consent_token)->toBeNull();
});

test('agreeing needs the consent box and a name', function (array $answer, string $field) {
    [$account, $token] = awaitingConsent();

    $this->put(route('student-consent.update', $token), [
        'decision' => 'agree',
        'parent_name' => 'Maria Cruz',
        'consent' => true,
        ...$answer,
    ])->assertSessionHasErrors($field);

    expect($account->refresh()->status)->toBe(StudentAccountStatus::AwaitingConsent);
})->with([
    'no consent box' => [['consent' => false], 'consent'],
    'no name' => [['parent_name' => ''], 'parent_name'],
    'unknown decision' => [['decision' => 'maybe'], 'decision'],
]);

test('an expired link cannot be answered', function () {
    [$account, $token] = awaitingConsent();
    $this->travel(StudentAccount::CONSENT_LINK_DAYS + 1)->days();

    $this->put(route('student-consent.update', $token), [
        'decision' => 'decline',
        'parent_name' => 'Maria Cruz',
    ])->assertNotFound();

    expect($account->refresh()->status)->toBe(StudentAccountStatus::AwaitingConsent);
});
