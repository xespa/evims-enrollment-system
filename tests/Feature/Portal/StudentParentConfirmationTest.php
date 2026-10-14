<?php

use App\Enums\AccountType;
use App\Enums\ParentConfirmationStatus;
use App\Models\EnrolleeUser;
use App\Models\User;
use App\Notifications\EnrolleeAccountAwaitingReview;
use App\Notifications\ParentConfirmationAnswered;
use App\Notifications\ParentConfirmationRequested;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    Notification::fake();
    Storage::fake('local');
    $this->admin = User::factory()->admin()->create();
});

/**
 * @return array<string, mixed>
 */
function studentSignUp(array $overrides = []): array
{
    return [
        'account_type' => 'STUDENT',
        'name' => 'Sam Student',
        'email' => 'sam@example.com',
        'parent_email' => 'mom@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'valid_id' => UploadedFile::fake()->image('school-id.jpg'),
        'terms' => '1',
        ...$overrides,
    ];
}

/**
 * The plain token from the confirmation emailed to $parentEmail.
 */
function parentConfirmationToken(string $parentEmail = 'mom@example.com'): string
{
    $token = null;

    Notification::assertSentOnDemand(
        ParentConfirmationRequested::class,
        function (ParentConfirmationRequested $notification, array $channels, object $notifiable) use ($parentEmail, &$token): bool {
            $token = $notification->token;

            return $notifiable->routes['mail'] === $parentEmail;
        },
    );

    return $token;
}

/**
 * A student account whose parent was just emailed a confirmation link.
 *
 * @return array{0: EnrolleeUser, 1: string}
 */
function studentAwaitingParent(bool $emailVerified = true): array
{
    test()->post(route('portal.register.store'), studentSignUp())->assertSessionHasNoErrors();

    $student = EnrolleeUser::query()->where('email', 'sam@example.com')->sole();

    if ($emailVerified) {
        $student->markEmailAsVerified();
    }

    auth('enrollee')->logout();

    return [$student->refresh(), parentConfirmationToken()];
}

test('students signing up must give a parent or guardian email', function (array $input) {
    $this->post(route('portal.register.store'), studentSignUp($input))
        ->assertSessionHasErrors('parent_email');

    expect(EnrolleeUser::count())->toBe(0);
})->with([
    'missing' => [['parent_email' => '']],
    'not an email' => [['parent_email' => 'mom']],
    'their own email' => [['parent_email' => 'SAM@example.com']],
]);

test('signing up as a student emails the parent a confirmation link', function () {
    $this->post(route('portal.register.store'), studentSignUp())
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('portal.verification.notice'));

    $student = EnrolleeUser::sole();
    $token = parentConfirmationToken();

    expect($student->account_type)->toBe(AccountType::Student)
        ->and($student->parent_email)->toBe('mom@example.com')
        ->and($student->parent_confirmation_status)->toBe(ParentConfirmationStatus::Awaiting)
        ->and($student->parent_confirmation_token)->toBe(EnrolleeUser::hashParentConfirmationToken($token))
        ->and($student->needsParentConfirmation())->toBeTrue();
});

test('parent accounts need no parent confirmation', function () {
    $this->post(route('portal.register.store'), studentSignUp(['account_type' => 'PARENT_GUARDIAN', 'parent_email' => null]))
        ->assertSessionHasNoErrors();

    expect(EnrolleeUser::sole()->needsParentConfirmation())->toBeFalse();
    Notification::assertSentOnDemandTimes(ParentConfirmationRequested::class, 0);
});

test('opening the link shows the request without answering it', function () {
    [$student, $token] = studentAwaitingParent();

    $this->get(route('parent-confirmation.show', $token))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('ParentConfirmation/Show')
            ->where('request.student_name', 'Sam Student')
            ->where('request.student_email', 'sam@example.com')
            ->where('result', null));

    expect($student->refresh()->parent_confirmation_status)->toBe(ParentConfirmationStatus::Awaiting);
});

test('a parent confirming sends the account to the admins for review', function () {
    [$student, $token] = studentAwaitingParent();

    $this->put(route('parent-confirmation.update', $token), ['decision' => 'confirm'])
        ->assertRedirect(route('parent-confirmation.show', $token));

    $student->refresh();

    expect($student->parent_confirmation_status)->toBe(ParentConfirmationStatus::Confirmed)
        ->and($student->parent_confirmation_token)->toBeNull()
        ->and($student->parent_responded_at)->not->toBeNull();
    Notification::assertSentTo($student, ParentConfirmationAnswered::class, fn (ParentConfirmationAnswered $notification) => $notification->confirmed);
    Notification::assertSentTo($this->admin, EnrolleeAccountAwaitingReview::class);

    // The used link shows the outcome once, then nothing.
    $this->get(route('parent-confirmation.show', $token))
        ->assertInertia(fn (Assert $page) => $page->where('result.confirmed', true));
    $this->get(route('parent-confirmation.show', $token))
        ->assertInertia(fn (Assert $page) => $page->where('request', null)->where('result', null));
});

test('admins only hear of a student account once both the email and the parent are confirmed', function () {
    [$student, $token] = studentAwaitingParent(emailVerified: false);

    $this->put(route('parent-confirmation.update', $token), ['decision' => 'confirm']);

    Notification::assertNotSentTo($this->admin, EnrolleeAccountAwaitingReview::class);

    $student->refresh()->markEmailAsVerified();
    event(new Verified($student));

    Notification::assertSentTo($this->admin, EnrolleeAccountAwaitingReview::class);
});

test('confirming the email alone does not send a student account for review', function () {
    [$student] = studentAwaitingParent(emailVerified: false);

    $student->markEmailAsVerified();
    event(new Verified($student));

    Notification::assertNotSentTo($this->admin, EnrolleeAccountAwaitingReview::class);
});

test('a parent can decline', function () {
    [$student, $token] = studentAwaitingParent();

    $this->put(route('parent-confirmation.update', $token), ['decision' => 'decline'])
        ->assertRedirect(route('parent-confirmation.show', $token));

    expect($student->refresh()->parent_confirmation_status)->toBe(ParentConfirmationStatus::Declined);
    Notification::assertSentTo($student, ParentConfirmationAnswered::class, fn (ParentConfirmationAnswered $notification) => ! $notification->confirmed);
    Notification::assertNotSentTo($this->admin, EnrolleeAccountAwaitingReview::class);
});

test('the answer must be confirm or decline', function () {
    [$student, $token] = studentAwaitingParent();

    $this->put(route('parent-confirmation.update', $token), ['decision' => 'maybe'])
        ->assertSessionHasErrors('decision');

    expect($student->refresh()->parent_confirmation_status)->toBe(ParentConfirmationStatus::Awaiting);
});

test('wrong, used, or expired links cannot be answered', function () {
    [$student, $token] = studentAwaitingParent();

    $this->put(route('parent-confirmation.update', 'not-the-token'), ['decision' => 'confirm'])->assertNotFound();

    $this->travel(EnrolleeUser::PARENT_CONFIRMATION_LINK_DAYS + 1)->days();

    $this->get(route('parent-confirmation.show', $token))
        ->assertInertia(fn (Assert $page) => $page->where('request', null));
    $this->put(route('parent-confirmation.update', $token), ['decision' => 'confirm'])->assertNotFound();

    expect($student->refresh()->parent_confirmation_status)->toBe(ParentConfirmationStatus::Awaiting);
});

test('admins cannot approve a student account its parent has not confirmed', function () {
    [$student] = studentAwaitingParent();

    $this->actingAs($this->admin)
        ->put(route('admin.enrollee-accounts.update', $student), ['account_status' => 'APPROVED'])
        ->assertSessionHasErrors('account_status');

    expect($student->refresh()->isApproved())->toBeFalse();
});

test('admins can approve a student account once its parent confirms', function () {
    $student = EnrolleeUser::factory()->pending()->student()->create();

    $this->actingAs($this->admin)
        ->put(route('admin.enrollee-accounts.update', $student), ['account_status' => 'APPROVED'])
        ->assertSessionHasNoErrors();

    expect($student->refresh()->isApproved())->toBeTrue();
});

test('admins see where the parent confirmation stands', function () {
    EnrolleeUser::factory()->pending()->student(ParentConfirmationStatus::Awaiting)->create(['parent_email' => 'dad@example.com']);

    $this->actingAs($this->admin)
        ->get(route('admin.enrollee-accounts.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('accounts.data.0.parent_email', 'dad@example.com')
            ->where('accounts.data.0.parent_confirmation_status', 'AWAITING'));
});

test('the student sees that their parent has not confirmed yet', function () {
    [$student] = studentAwaitingParent();

    $this->actingAs($student, 'enrollee')
        ->get(route('portal.account-status'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('parentConfirmation.status', 'AWAITING')
            ->where('parentConfirmation.email', 'mom@example.com')
            ->where('parentConfirmation.isLinkExpired', false));
});

test('a student can send the confirmation again to a corrected email', function () {
    [$student, $oldToken] = studentAwaitingParent();

    $this->actingAs($student, 'enrollee')
        ->put(route('portal.parent-email.update'), ['parent_email' => 'dad@example.com'])
        ->assertSessionHasNoErrors()
        ->assertSessionHas('success');

    $newToken = parentConfirmationToken('dad@example.com');

    expect($student->refresh()->parent_email)->toBe('dad@example.com');

    // Only the newest link works.
    $this->put(route('parent-confirmation.update', $oldToken), ['decision' => 'confirm'])->assertNotFound();
    $this->put(route('parent-confirmation.update', $newToken), ['decision' => 'confirm'])->assertRedirect();

    expect($student->refresh()->parent_confirmation_status)->toBe(ParentConfirmationStatus::Confirmed);
});

test('a declined student can ask again', function () {
    $student = EnrolleeUser::factory()->pending()->student(ParentConfirmationStatus::Declined)->create();

    $this->actingAs($student, 'enrollee')
        ->put(route('portal.parent-email.update'), ['parent_email' => $student->parent_email])
        ->assertSessionHasNoErrors();

    expect($student->refresh()->parent_confirmation_status)->toBe(ParentConfirmationStatus::Awaiting);
});

test('only students still waiting on a parent can send it again', function (string $state) {
    $account = $state === 'parent'
        ? EnrolleeUser::factory()->pending()->create()
        : EnrolleeUser::factory()->pending()->student()->create();

    $this->actingAs($account, 'enrollee')
        ->put(route('portal.parent-email.update'), ['parent_email' => 'someone@example.com'])
        ->assertForbidden();

    Notification::assertSentOnDemandTimes(ParentConfirmationRequested::class, 0);
})->with(['parent account' => 'parent', 'already confirmed' => 'confirmed']);

test('the parent email cannot be the student\'s own when sending again', function () {
    [$student] = studentAwaitingParent();

    $this->actingAs($student, 'enrollee')
        ->put(route('portal.parent-email.update'), ['parent_email' => 'sam@example.com'])
        ->assertSessionHasErrors('parent_email');
});

test('guests cannot send the confirmation again', function () {
    $this->put(route('portal.parent-email.update'), ['parent_email' => 'dad@example.com'])
        ->assertRedirect(route('login'));
});
