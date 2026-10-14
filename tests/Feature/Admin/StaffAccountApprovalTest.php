<?php

use App\Enums\AccountStatus;
use App\Enums\AuditAction;
use App\Models\AuditLog;
use App\Models\User;
use App\Notifications\StaffAccountReviewed;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    Notification::fake();
    $this->admin = User::factory()->admin()->create(['name' => 'Ada Admin']);
    $this->request = User::factory()->cashier()->awaitingApproval()->create(['name' => 'Cal Cashier']);
});

/**
 * Staff account routes need a recently confirmed password.
 */
function approvingAs(User $user): mixed
{
    return test()->actingAs($user)->withSession(['auth.password_confirmed_at' => time()]);
}

test('requests waiting on approval are listed first', function () {
    approvingAs($this->admin)
        ->get(route('admin.staff-accounts.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('staffAccounts.0.name', 'Cal Cashier')
            ->where('staffAccounts.0.status', 'awaiting_approval')
            ->whereNot('staffAccounts.0.requested_at', null));
});

test('admins can approve a request, and the person can then sign in', function () {
    approvingAs($this->admin)
        ->put(route('admin.staff-accounts.approval.update', $this->request), ['account_status' => 'APPROVED'])
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    expect($this->request->refresh()->account_status)->toBe(AccountStatus::Approved);
    Notification::assertSentTo($this->request, StaffAccountReviewed::class, fn (StaffAccountReviewed $notification) => $notification->status === AccountStatus::Approved);
    expect(AuditLog::query()->where('action', AuditAction::StaffSignUpApproved)->sole()->user_id)->toBe($this->admin->id);

    auth()->logout();

    $this->post(route('login.store'), [
        'role' => 'CASHIER',
        'email' => $this->request->email,
        'password' => 'password',
    ])->assertRedirect(route('admin.transactions.index'));

    $this->assertAuthenticatedAs($this->request);
});

test('admins can reject a request', function () {
    approvingAs($this->admin)
        ->put(route('admin.staff-accounts.approval.update', $this->request), ['account_status' => 'REJECTED'])
        ->assertSessionHasNoErrors();

    expect($this->request->refresh()->account_status)->toBe(AccountStatus::Rejected);
    Notification::assertSentTo($this->request, StaffAccountReviewed::class, fn (StaffAccountReviewed $notification) => $notification->status === AccountStatus::Rejected);
});

test('the decision must be approve or reject', function (?string $status) {
    approvingAs($this->admin)
        ->put(route('admin.staff-accounts.approval.update', $this->request), ['account_status' => $status])
        ->assertSessionHasErrors('account_status');

    expect($this->request->refresh()->account_status)->toBe(AccountStatus::Pending);
})->with(['missing' => [null], 'pending' => ['PENDING']]);

test('only requests still waiting can be decided', function () {
    $teacher = User::factory()->teacher()->create();

    approvingAs($this->admin)
        ->put(route('admin.staff-accounts.approval.update', $teacher), ['account_status' => 'REJECTED'])
        ->assertSessionHasErrors('staff_account');

    expect($teacher->refresh()->account_status)->toBe(AccountStatus::Approved);
    Notification::assertNothingSent();
});

test('only admins can approve requests', function () {
    approvingAs(User::factory()->registrar()->create())
        ->put(route('admin.staff-accounts.approval.update', $this->request), ['account_status' => 'APPROVED'])
        ->assertForbidden();

    expect($this->request->refresh()->account_status)->toBe(AccountStatus::Pending);
});

test('guests are sent to the login page', function () {
    $this->put(route('admin.staff-accounts.approval.update', $this->request), ['account_status' => 'APPROVED'])
        ->assertRedirect(route('login'));
});
