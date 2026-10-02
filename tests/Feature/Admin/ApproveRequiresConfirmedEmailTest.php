<?php

use App\Enums\AccountStatus;
use App\Models\EnrolleeUser;
use App\Models\User;
use App\Notifications\EnrolleeAccountReviewed;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    Notification::fake();
    $this->admin = User::factory()->create(['role' => 'ADMIN']);
});

test('an account cannot be approved before its email is confirmed', function () {
    $enrollee = EnrolleeUser::factory()->pending()->unverified()->create(['name' => 'Ana Reyes']);

    $this->actingAs($this->admin)
        ->from(route('admin.enrollee-accounts.index'))
        ->patch(route('admin.enrollee-accounts.update', $enrollee), ['account_status' => 'APPROVED'])
        ->assertRedirect(route('admin.enrollee-accounts.index'))
        ->assertSessionHasErrors(['account_status' => "Ana Reyes hasn't confirmed their email yet, so the account can't be approved. Try again once they've clicked the link we emailed them."]);

    expect($enrollee->fresh()->account_status)->toBe(AccountStatus::Pending);
    Notification::assertNothingSent();
});

test('an account with an unconfirmed email can still be rejected', function () {
    $enrollee = EnrolleeUser::factory()->pending()->unverified()->create();

    $this->actingAs($this->admin)
        ->patch(route('admin.enrollee-accounts.update', $enrollee), [
            'account_status' => 'REJECTED',
            'rejection_reasons' => ['UNACCEPTED_ID'],
        ])
        ->assertSessionHasNoErrors();

    expect($enrollee->fresh()->account_status)->toBe(AccountStatus::Rejected);
    Notification::assertSentTo($enrollee, EnrolleeAccountReviewed::class);
});

test('the account can be approved once the email is confirmed', function () {
    $enrollee = EnrolleeUser::factory()->pending()->unverified()->create();
    $enrollee->markEmailAsVerified();

    $this->actingAs($this->admin)
        ->patch(route('admin.enrollee-accounts.update', $enrollee), ['account_status' => 'APPROVED'])
        ->assertSessionHasNoErrors();

    expect($enrollee->fresh()->account_status)->toBe(AccountStatus::Approved);
});

test('admins can see which pending accounts are waiting on email confirmation', function () {
    $unconfirmed = EnrolleeUser::factory()->pending()->unverified()->create();
    EnrolleeUser::factory()->pending()->unverified()->create();
    EnrolleeUser::factory()->pending()->create();
    EnrolleeUser::factory()->rejected()->unverified()->create();

    $this->actingAs($this->admin)
        ->get(route('admin.enrollee-accounts.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('awaitingEmailCount', 2)
            ->where('accounts.data.0.id', $unconfirmed->id)
            ->where('accounts.data.0.email_verified_at', null));
});
