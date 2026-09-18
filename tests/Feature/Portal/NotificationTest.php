<?php

use App\Models\BillingContract;
use App\Models\EnrolleeUser;
use App\Models\Enrollment;
use App\Models\Installment;
use App\Models\User;
use App\Notifications\EnrollmentStatusChanged;
use App\Notifications\PaymentReceived;
use Illuminate\Support\Str;

test('guests cannot view notifications', function () {
    $this->getJson(route('portal.notifications.index'))->assertStatus(401);
});

test('an enrollee only sees their own notifications', function () {
    $enrollee = EnrolleeUser::factory()->create();
    $other = EnrolleeUser::factory()->create();

    $enrollment = Enrollment::factory()->create(['enrollee_user_id' => $enrollee->id]);
    $enrollment->update(['enrollment_status' => 'APPROVED']);

    $enrollee->notifications()->create([
        'id' => (string) Str::uuid(),
        'type' => EnrollmentStatusChanged::class,
        'data' => ['title' => 'Mine', 'message' => 'mine', 'url' => '/portal/dashboard'],
    ]);
    $other->notifications()->create([
        'id' => (string) Str::uuid(),
        'type' => EnrollmentStatusChanged::class,
        'data' => ['title' => 'Not mine', 'message' => 'not mine', 'url' => '/portal/dashboard'],
    ]);

    $response = $this->actingAs($enrollee, 'enrollee')
        ->getJson(route('portal.notifications.index'))
        ->assertOk();

    $response->assertJsonCount(1, 'notifications');
    expect($response->json('notifications.0.data.title'))->toBe('Mine');
});

test('approving an enrollment notifies the linked enrollee', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $enrollee = EnrolleeUser::factory()->create();
    $enrollment = Enrollment::factory()->create([
        'enrollee_user_id' => $enrollee->id,
        'enrollment_status' => 'PENDING',
        'email' => null,
    ]);

    expect($enrollee->notifications()->count())->toBe(0);

    $this->actingAs($admin)
        ->patch(route('admin.enrollments.updateStatus', $enrollment), ['enrollment_status' => 'APPROVED'])
        ->assertSessionHasNoErrors();

    $enrollee->refresh();
    expect($enrollee->unreadNotifications()->count())->toBe(1);
    expect($enrollee->notifications()->first()->data['status'])->toBe('APPROVED');
});

test('recording a cash payment notifies the linked enrollee', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $enrollee = EnrolleeUser::factory()->create();
    $enrollment = Enrollment::factory()->create(['enrollee_user_id' => $enrollee->id]);

    $billingContract = BillingContract::create([
        'enrollment_id' => $enrollment->id,
        'payment_option' => 'MONTHLY',
        'payment_channel' => 'COUNTER',
        'total_fee' => 30000,
    ]);
    $installment = Installment::create([
        'billing_contract_id' => $billingContract->id,
        'installment_number' => 1,
        'amount_due' => 30000,
        'due_date' => now()->addMonth(),
        'status' => 'UNPAID',
    ]);

    $this->actingAs($admin)
        ->post(route('admin.enrollments.payments.cash', $enrollment), [
            'installment_id' => $installment->id,
            'amount' => 30000,
        ])
        ->assertSessionHasNoErrors();

    expect($enrollee->unreadNotifications()->count())->toBe(1);
    expect($enrollee->notifications()->first()->data['type'])->toBe('payment_received');
});

test('an enrollee can mark a notification as read and mark all as read', function () {
    $enrollee = EnrolleeUser::factory()->create();

    $enrollee->notifications()->create([
        'id' => (string) Str::uuid(),
        'type' => PaymentReceived::class,
        'data' => ['title' => 'A', 'message' => 'a', 'url' => '/portal/dashboard'],
    ]);
    $second = $enrollee->notifications()->create([
        'id' => (string) Str::uuid(),
        'type' => PaymentReceived::class,
        'data' => ['title' => 'B', 'message' => 'b', 'url' => '/portal/dashboard'],
    ]);

    expect($enrollee->unreadNotifications()->count())->toBe(2);

    $this->actingAs($enrollee, 'enrollee')
        ->post(route('portal.notifications.read', $second->id))
        ->assertRedirect();

    expect($enrollee->unreadNotifications()->count())->toBe(1);

    $this->actingAs($enrollee, 'enrollee')
        ->post(route('portal.notifications.readAll'))
        ->assertRedirect();

    expect($enrollee->unreadNotifications()->count())->toBe(0);
});
