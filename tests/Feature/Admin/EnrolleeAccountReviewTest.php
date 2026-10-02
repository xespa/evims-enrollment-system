<?php

use App\Enums\AccountRejectionReason;
use App\Enums\AccountStatus;
use App\Models\EnrolleeUser;
use App\Models\User;
use App\Notifications\EnrolleeAccountReviewed;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;

test('guests cannot see parent accounts', function () {
    $this->get(route('admin.enrollee-accounts.index'))->assertRedirect(route('login'));
});

test('non-admins cannot see or review parent accounts', function () {
    $staff = User::factory()->create(['role' => 'STAFF']);
    $enrollee = EnrolleeUser::factory()->pending()->create();

    $this->actingAs($staff)->get(route('admin.enrollee-accounts.index'))->assertForbidden();

    $this->actingAs($staff)
        ->patch(route('admin.enrollee-accounts.update', $enrollee), ['account_status' => 'APPROVED'])
        ->assertForbidden();

    expect($enrollee->fresh()->account_status)->toBe(AccountStatus::Pending);
});

test('admin sees pending accounts by default', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $pending = EnrolleeUser::factory()->pending()->create();
    EnrolleeUser::factory()->create();

    $this->actingAs($admin)
        ->get(route('admin.enrollee-accounts.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/EnrolleeAccounts/Index')
            ->has('accounts.data', 1)
            ->where('accounts.data.0.id', $pending->id)
            ->where('filters.status', 'PENDING')
            ->where('counts.PENDING', 1)
            ->where('counts.APPROVED', 1)
            ->missing('accounts.data.0.password'));
});

test('admin can filter accounts by status and search', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $match = EnrolleeUser::factory()->rejected()->create(['name' => 'Maria Santos']);
    EnrolleeUser::factory()->rejected()->create(['name' => 'Jose Rizal']);

    $this->actingAs($admin)
        ->get(route('admin.enrollee-accounts.index', ['status' => 'REJECTED', 'search' => 'Santos']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('accounts.data', 1)
            ->where('accounts.data.0.id', $match->id));
});

test('admin can approve an account and the parent is notified', function () {
    Notification::fake();

    $admin = User::factory()->create(['role' => 'ADMIN']);
    $enrollee = EnrolleeUser::factory()->pending()->create();

    $this->actingAs($admin)
        ->patch(route('admin.enrollee-accounts.update', $enrollee), ['account_status' => 'APPROVED'])
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    $enrollee->refresh();
    expect($enrollee->account_status)->toBe(AccountStatus::Approved)
        ->and($enrollee->reviewed_by)->toBe($admin->id)
        ->and($enrollee->reviewed_at)->not->toBeNull();

    Notification::assertSentTo(
        $enrollee,
        EnrolleeAccountReviewed::class,
        fn (EnrolleeAccountReviewed $notification) => $notification->status === AccountStatus::Approved,
    );
});

test('admin can reject an account with reasons and a note', function () {
    Notification::fake();

    $admin = User::factory()->create(['role' => 'ADMIN']);
    $enrollee = EnrolleeUser::factory()->pending()->create();

    $this->actingAs($admin)
        ->patch(route('admin.enrollee-accounts.update', $enrollee), [
            'account_status' => 'REJECTED',
            'rejection_reasons' => ['BLURRY_ID', 'EXPIRED_ID'],
            'rejection_reason' => 'The birthdate is hard to read.',
        ])
        ->assertSessionHasNoErrors();

    $enrollee->refresh();
    expect($enrollee->account_status)->toBe(AccountStatus::Rejected)
        ->and($enrollee->rejection_reasons->all())->toBe([AccountRejectionReason::BlurryId, AccountRejectionReason::ExpiredId])
        ->and($enrollee->rejection_reason)->toBe('The birthdate is hard to read.');

    Notification::assertSentTo(
        $enrollee,
        EnrolleeAccountReviewed::class,
        fn (EnrolleeAccountReviewed $notification) => $notification->rejectionReasons === [AccountRejectionReason::BlurryId, AccountRejectionReason::ExpiredId]
            && $notification->note === 'The birthdate is hard to read.',
    );
});

test('a note is optional unless the reason is other', function () {
    Notification::fake();

    $admin = User::factory()->create(['role' => 'ADMIN']);
    $enrollee = EnrolleeUser::factory()->pending()->create();

    $this->actingAs($admin)
        ->patch(route('admin.enrollee-accounts.update', $enrollee), [
            'account_status' => 'REJECTED',
            'rejection_reasons' => ['OTHER'],
        ])
        ->assertSessionHasErrors('rejection_reason');

    $this->actingAs($admin)
        ->patch(route('admin.enrollee-accounts.update', $enrollee), [
            'account_status' => 'REJECTED',
            'rejection_reasons' => ['UNACCEPTED_ID'],
        ])
        ->assertSessionHasNoErrors();

    expect($enrollee->fresh()->rejection_reason)->toBeNull();
});

test('approving a rejected account clears the rejection reasons', function () {
    Notification::fake();

    $admin = User::factory()->create(['role' => 'ADMIN']);
    $enrollee = EnrolleeUser::factory()->rejected([AccountRejectionReason::BlurryId], 'Too dark.')->create();

    $this->actingAs($admin)
        ->patch(route('admin.enrollee-accounts.update', $enrollee), ['account_status' => 'APPROVED'])
        ->assertSessionHasNoErrors();

    expect($enrollee->fresh()->rejection_reasons)->toBeNull()
        ->and($enrollee->fresh()->rejection_reason)->toBeNull();
});

test('rejecting requires at least one known reason', function (array $payload) {
    Notification::fake();

    $admin = User::factory()->create(['role' => 'ADMIN']);
    $enrollee = EnrolleeUser::factory()->pending()->create();

    $this->actingAs($admin)
        ->patch(route('admin.enrollee-accounts.update', $enrollee), ['account_status' => 'REJECTED', ...$payload])
        ->assertSessionHasErrors();

    expect($enrollee->fresh()->account_status)->toBe(AccountStatus::Pending);
    Notification::assertNothingSent();
})->with([
    'no reasons' => [[]],
    'empty list' => [['rejection_reasons' => []]],
    'unknown reason' => [['rejection_reasons' => ['LOOKS_SUSPICIOUS']]],
]);

test('reasons cannot be sent when approving', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $enrollee = EnrolleeUser::factory()->pending()->create();

    $this->actingAs($admin)
        ->patch(route('admin.enrollee-accounts.update', $enrollee), [
            'account_status' => 'APPROVED',
            'rejection_reasons' => ['BLURRY_ID'],
        ])
        ->assertSessionHasErrors('rejection_reasons');
});

test('the rejection email explains the previous attempt and asks them to create their account again', function () {
    $enrollee = EnrolleeUser::factory()->rejected()->create();

    $mail = (new EnrolleeAccountReviewed(
        AccountStatus::Rejected,
        [AccountRejectionReason::BlurryId, AccountRejectionReason::NameMismatch],
        'Please use your full legal name.',
    ))->toMail($enrollee);

    $rendered = (string) $mail->render();

    expect($mail->subject)->toBe('Please Try Creating Your EVIMS Portal Account Again')
        ->and($mail->actionText)->toBe('Create My Account Again')
        ->and($rendered)->toContain('previous attempt')
        ->and($rendered)->toContain('Please try creating your account again')
        ->and($rendered)->toContain(e(AccountRejectionReason::BlurryId->guidance()))
        ->and($rendered)->toContain(e(AccountRejectionReason::NameMismatch->guidance()))
        ->and($rendered)->toContain('Please use your full legal name.');
});

test('the rejection email links to registering again, not to the login', function () {
    $enrollee = EnrolleeUser::factory()->rejected()->create();

    $mail = (new EnrolleeAccountReviewed(AccountStatus::Rejected, [AccountRejectionReason::Other], 'Duplicate account.'))
        ->toMail($enrollee);

    // Opened by a visitor who isn't logged in, as from a phone's mail app.
    $this->get($mail->actionUrl)
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Portal/Register')
            ->where('reapplication.email', $enrollee->email));
});

test('emails are signed off as EVIMS, not Laravel', function () {
    config(['app.name' => 'EVIMS']);

    $rendered = (string) (new EnrolleeAccountReviewed(AccountStatus::Rejected, [AccountRejectionReason::BlurryId]))
        ->toMail(EnrolleeUser::factory()->rejected()->create())
        ->render();

    expect($rendered)->toContain('EVIMS')->not->toContain('Laravel');
});

test('an account cannot be set back to pending or an unknown status', function (string $status) {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $enrollee = EnrolleeUser::factory()->create();

    $this->actingAs($admin)
        ->patch(route('admin.enrollee-accounts.update', $enrollee), ['account_status' => $status])
        ->assertSessionHasErrors('account_status');

    expect($enrollee->fresh()->account_status)->toBe(AccountStatus::Approved);
})->with(['PENDING', 'BANNED', '']);
