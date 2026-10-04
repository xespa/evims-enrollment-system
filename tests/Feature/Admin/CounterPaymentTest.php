<?php

use App\Models\BillingContract;
use App\Models\EnrolleeUser;
use App\Models\Enrollment;
use App\Models\Installment;
use App\Models\Payment;
use App\Models\User;
use App\Notifications\OnlinePaymentReceived;
use App\Notifications\PaymentReceived;
use App\Notifications\PaymentVoided;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Notification;

/**
 * An approved counter-paying application billed ₱10,000 as ten ₱1,000
 * monthly installments.
 */
function counterPayingEnrollment(): Enrollment
{
    $enrollment = Enrollment::factory()->create([
        'enrollment_status' => 'APPROVED',
        'enrollee_user_id' => EnrolleeUser::factory(),
    ]);

    $enrollment->billingContract()->create([
        'payment_option' => 'MONTHLY',
        'payment_channel' => BillingContract::CHANNEL_COUNTER,
        'total_fee' => 10000,
    ])->generateInstallments();

    return $enrollment;
}

/**
 * @return list<string>
 */
function installmentStatuses(Enrollment $enrollment): array
{
    return $enrollment->billingContract->installments()
        ->orderBy('installment_number')
        ->pluck('status')
        ->all();
}

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => 'ADMIN']);
    Notification::fake();
});

test('a counter payment for one installment marks it paid with its receipt', function () {
    $enrollment = counterPayingEnrollment();

    $this->actingAs($this->admin)
        ->post(route('admin.enrollments.cash-payments.store', $enrollment), [
            'amount' => 1000,
            'receipt_number' => 'OR-00123',
            'paid_on' => '2026-09-28',
        ])
        ->assertSessionHasNoErrors()
        ->assertSessionHas('success', 'Counter payment of ₱1,000.00 recorded.');

    $payment = Payment::sole();

    expect($payment->method)->toBe('CASH')
        ->and($payment->status)->toBe('COMPLETED')
        ->and($payment->receipt_number)->toBe('OR-00123')
        ->and($payment->paid_at->toDateString())->toBe('2026-09-28')
        ->and($payment->recorded_by)->toBe($this->admin->id)
        ->and(installmentStatuses($enrollment))->toBe(['PAID', ...array_fill(0, 9, 'UNPAID')]);
});

test('a larger payment is applied to the installments in order', function () {
    $enrollment = counterPayingEnrollment();

    $this->actingAs($this->admin)
        ->post(route('admin.enrollments.cash-payments.store', $enrollment), [
            'amount' => 2500,
            'receipt_number' => 'OR-9',
        ])
        ->assertSessionHas('success', 'Counter payment of ₱2,500.00 recorded across 3 installments.');

    expect(installmentStatuses($enrollment))->toBe(['PAID', 'PAID', 'PARTIALLY_PAID', ...array_fill(0, 7, 'UNPAID')])
        ->and(Payment::pluck('amount')->map(fn ($amount) => (float) $amount)->all())->toBe([1000.0, 1000.0, 500.0])
        ->and(Payment::distinct()->pluck('receipt_number')->all())->toBe(['OR-9']);
});

test('the next payment continues from a partly paid installment', function () {
    $enrollment = counterPayingEnrollment();

    $this->actingAs($this->admin)->post(route('admin.enrollments.cash-payments.store', $enrollment), ['amount' => 400, 'receipt_number' => fake()->unique()->numerify('OR-#####')]);
    $this->actingAs($this->admin)->post(route('admin.enrollments.cash-payments.store', $enrollment), ['amount' => 600, 'receipt_number' => fake()->unique()->numerify('OR-#####')]);

    expect(installmentStatuses($enrollment))->toBe(['PAID', ...array_fill(0, 9, 'UNPAID')]);
});

test('paying the full balance marks every installment paid', function () {
    $enrollment = counterPayingEnrollment();

    $this->actingAs($this->admin)
        ->post(route('admin.enrollments.cash-payments.store', $enrollment), ['amount' => 10000, 'receipt_number' => fake()->unique()->numerify('OR-#####')])
        ->assertSessionHasNoErrors();

    expect(installmentStatuses($enrollment))->toBe(array_fill(0, 10, 'PAID'));

    $this->actingAs($this->admin)
        ->post(route('admin.enrollments.cash-payments.store', $enrollment), ['amount' => 1, 'receipt_number' => fake()->unique()->numerify('OR-#####')])
        ->assertSessionHasErrors(['amount' => 'This application is already fully paid.']);
});

test('the parent is notified once, for the whole amount', function () {
    $enrollment = counterPayingEnrollment();

    $this->actingAs($this->admin)
        ->post(route('admin.enrollments.cash-payments.store', $enrollment), ['amount' => 2500, 'receipt_number' => fake()->unique()->numerify('OR-#####')]);

    Notification::assertSentToTimes($enrollment->enrolleeUser, PaymentReceived::class, 1);
    Notification::assertSentTo(
        $enrollment->enrolleeUser,
        PaymentReceived::class,
        fn (PaymentReceived $notification) => $notification->toArray($enrollment->enrolleeUser)['amount'] === '2500.00',
    );
});

test('the parent is emailed a receipt for a counter payment', function () {
    $enrollment = counterPayingEnrollment();

    $this->actingAs($this->admin)
        ->post(route('admin.enrollments.cash-payments.store', $enrollment), ['amount' => 2500, 'receipt_number' => 'OR-12345']);

    Notification::assertSentTo($enrollment->enrolleeUser, PaymentReceived::class, function (PaymentReceived $notification, array $channels) use ($enrollment) {
        $body = (string) $notification->toMail($enrollment->enrolleeUser)->render();

        return in_array('mail', $channels)
            && str_contains($body, '₱2,500.00')
            && str_contains($body, 'Cash at the school cashier')
            && str_contains($body, 'OR-12345')
            && str_contains($body, '₱7,500.00');
    });
});

test('admins are not notified of payments made at the counter', function () {
    $enrollment = counterPayingEnrollment();

    $this->actingAs($this->admin)
        ->post(route('admin.enrollments.cash-payments.store', $enrollment), ['amount' => 2500, 'receipt_number' => 'OR-12345']);

    Notification::assertNotSentTo($this->admin, OnlinePaymentReceived::class);
});

test('the receipt email says when the enrollment is fully paid', function () {
    $enrollment = counterPayingEnrollment();

    $this->actingAs($this->admin)
        ->post(route('admin.enrollments.cash-payments.store', $enrollment), ['amount' => 10000, 'receipt_number' => 'OR-54321']);

    Notification::assertSentTo($enrollment->enrolleeUser, PaymentReceived::class, function (PaymentReceived $notification) use ($enrollment) {
        $body = (string) $notification->toMail($enrollment->enrolleeUser)->render();

        return str_contains($body, 'fully paid') && ! str_contains($body, 'Remaining balance');
    });
});

test('invalid counter payments are rejected', function (array $input, string $field, string $message) {
    $enrollment = counterPayingEnrollment();

    $this->actingAs($this->admin)
        ->post(route('admin.enrollments.cash-payments.store', $enrollment), $input)
        ->assertSessionHasErrors([$field => $message]);

    expect(Payment::count())->toBe(0);
})->with([
    'more than the balance' => [['amount' => 10000.01], 'amount', 'The amount can\'t be more than the remaining balance of ₱10,000.00.'],
    'zero' => [['amount' => 0], 'amount', 'The amount field must be at least 0.01.'],
    'a future date' => [['amount' => 1000, 'paid_on' => '2999-01-01'], 'paid_on', 'The payment date can\'t be in the future.'],
    'a very long receipt number' => [['amount' => 1000, 'receipt_number' => str_repeat('9', 51)], 'receipt_number', 'The receipt number field must not be greater than 50 characters.'],
]);

test('another application\'s installment cannot be paid through this one', function () {
    $enrollment = counterPayingEnrollment();
    $otherInstallment = counterPayingEnrollment()->billingContract->installments()->first();

    $this->actingAs($this->admin)
        ->post(route('admin.enrollments.cash-payments.store', $enrollment), [
            'installment_id' => $otherInstallment->id,
            'amount' => 1000,
            'receipt_number' => 'OR-55',
        ]);

    expect($otherInstallment->fresh()->status)->toBe('UNPAID')
        ->and(Payment::sole()->enrollment_id)->toBe($enrollment->id);
});

test('a payment recorded the same day keeps the time it was recorded', function () {
    Carbon::setTestNow('2026-09-30 14:35:00');
    $enrollment = counterPayingEnrollment();

    $this->actingAs($this->admin)
        ->post(route('admin.enrollments.cash-payments.store', $enrollment), ['amount' => 1000, 'paid_on' => '2026-09-30', 'receipt_number' => 'OR-7']);

    expect(Payment::sole()->paid_at->format('Y-m-d H:i'))->toBe('2026-09-30 14:35');

    Carbon::setTestNow();
});

test('non-admin users cannot record counter payments', function () {
    $enrollment = counterPayingEnrollment();
    $staff = User::factory()->create(['role' => 'STAFF']);

    $this->actingAs($staff)
        ->post(route('admin.enrollments.cash-payments.store', $enrollment), ['amount' => 1000, 'receipt_number' => fake()->unique()->numerify('OR-#####')])
        ->assertForbidden();

    expect(Installment::where('status', 'PAID')->count())->toBe(0);
});

test('the OR number is required', function () {
    $enrollment = counterPayingEnrollment();

    $this->actingAs($this->admin)
        ->post(route('admin.enrollments.cash-payments.store', $enrollment), ['amount' => 1000])
        ->assertSessionHasErrors(['receipt_number' => 'Enter the OR number from the official receipt you issued.']);

    expect(Payment::count())->toBe(0);
});

test('the same OR number cannot be recorded twice, whatever its spacing or case', function () {
    $enrollment = counterPayingEnrollment();
    $otherEnrollment = counterPayingEnrollment();

    $this->actingAs($this->admin)
        ->post(route('admin.enrollments.cash-payments.store', $enrollment), ['amount' => 1000, 'receipt_number' => 'or-00123 ']);

    $student = $enrollment->student;

    $this->actingAs($this->admin)
        ->post(route('admin.enrollments.cash-payments.store', $otherEnrollment), ['amount' => 1000, 'receipt_number' => 'OR-00123'])
        ->assertSessionHasErrors([
            'receipt_number' => "OR OR-00123 is already recorded for {$student->first_name} {$student->last_name} (application #{$enrollment->id}). Void that payment first if it was a mistake.",
        ]);

    expect(Payment::count())->toBe(1)
        ->and(Payment::sole()->receipt_number)->toBe('OR-00123');
});

test('voiding a payment keeps it on record and reopens its installments', function () {
    $enrollment = counterPayingEnrollment();
    $this->actingAs($this->admin)
        ->post(route('admin.enrollments.cash-payments.store', $enrollment), ['amount' => 2500, 'receipt_number' => 'OR-500']);

    $this->actingAs($this->admin)
        ->post(route('admin.payments.void', Payment::first()), ['reason' => 'Recorded on the wrong student'])
        ->assertSessionHasNoErrors()
        ->assertSessionHas('success', 'OR OR-500 (₱2,500.00) was voided. The balance has been updated.');

    // Every part of the receipt is voided together, and nothing is deleted.
    expect(Payment::count())->toBe(3)
        ->and(Payment::pluck('status')->unique()->values()->all())->toBe(['VOIDED'])
        ->and(Payment::pluck('void_reason')->unique()->values()->all())->toBe(['Recorded on the wrong student'])
        ->and(Payment::pluck('voided_by')->unique()->values()->all())->toBe([$this->admin->id])
        ->and(Payment::whereNull('voided_at')->count())->toBe(0)
        ->and(installmentStatuses($enrollment))->toBe(array_fill(0, 10, 'UNPAID'))
        ->and($enrollment->billingContract->fresh()->load('installments')->remainingBalance())->toBe(10000.0);
});

test('voiding one receipt leaves the other payments of the application alone', function () {
    $enrollment = counterPayingEnrollment();
    $this->actingAs($this->admin)->post(route('admin.enrollments.cash-payments.store', $enrollment), ['amount' => 1000, 'receipt_number' => 'OR-1']);
    $this->actingAs($this->admin)->post(route('admin.enrollments.cash-payments.store', $enrollment), ['amount' => 1000, 'receipt_number' => 'OR-2']);

    $this->actingAs($this->admin)
        ->post(route('admin.payments.void', Payment::where('receipt_number', 'OR-2')->sole()), ['reason' => 'Typed the wrong amount']);

    expect(Payment::where('receipt_number', 'OR-1')->sole()->status)->toBe('COMPLETED')
        ->and(installmentStatuses($enrollment))->toBe(['PAID', ...array_fill(0, 9, 'UNPAID')]);
});

test('a voided OR number can be recorded again, e.g. on the right student', function () {
    $wrongStudent = counterPayingEnrollment();
    $rightStudent = counterPayingEnrollment();
    $this->actingAs($this->admin)->post(route('admin.enrollments.cash-payments.store', $wrongStudent), ['amount' => 1000, 'receipt_number' => 'OR-77']);
    $this->actingAs($this->admin)->post(route('admin.payments.void', Payment::sole()), ['reason' => 'Recorded on the wrong student']);

    $this->actingAs($this->admin)
        ->post(route('admin.enrollments.cash-payments.store', $rightStudent), ['amount' => 1000, 'receipt_number' => 'OR-77'])
        ->assertSessionHasNoErrors();

    expect(Payment::where('status', 'COMPLETED')->sole()->enrollment_id)->toBe($rightStudent->id);
});

test('the parent is told when a payment is voided', function () {
    $enrollment = counterPayingEnrollment();
    $this->actingAs($this->admin)->post(route('admin.enrollments.cash-payments.store', $enrollment), ['amount' => 1000, 'receipt_number' => 'OR-3']);

    $this->actingAs($this->admin)->post(route('admin.payments.void', Payment::sole()), ['reason' => 'Duplicate entry']);

    Notification::assertSentTo(
        $enrollment->enrolleeUser,
        PaymentVoided::class,
        fn (PaymentVoided $notification) => str_contains(
            $notification->toArray($enrollment->enrolleeUser)['message'],
            '₱1,000.00 (OR OR-3)',
        ),
    );
});

test('a void needs a reason', function (array $input) {
    $enrollment = counterPayingEnrollment();
    $this->actingAs($this->admin)->post(route('admin.enrollments.cash-payments.store', $enrollment), ['amount' => 1000, 'receipt_number' => 'OR-4']);

    $this->actingAs($this->admin)
        ->post(route('admin.payments.void', Payment::sole()), $input)
        ->assertSessionHasErrors('reason');

    expect(Payment::sole()->status)->toBe('COMPLETED');
})->with([
    'missing' => [[]],
    'too short' => [['reason' => 'oops']],
]);

test('only counter payments still in effect can be voided', function (string $method, string $status) {
    $enrollment = counterPayingEnrollment();
    $payment = Payment::create([
        'installment_id' => $enrollment->billingContract->installments()->first()->id,
        'enrollment_id' => $enrollment->id,
        'amount' => 1000,
        'method' => $method,
        'status' => $status,
    ]);

    $this->actingAs($this->admin)
        ->post(route('admin.payments.void', $payment), ['reason' => 'Trying to void this'])
        ->assertSessionHasErrors(['reason' => 'Only counter payments that are still in effect can be voided.']);

    expect($payment->fresh()->status)->toBe($status);
})->with([
    'a GCash payment' => ['GCASH', 'COMPLETED'],
    'an already voided payment' => ['CASH', 'VOIDED'],
]);

test('non-admin users cannot void payments', function () {
    $enrollment = counterPayingEnrollment();
    $this->actingAs($this->admin)->post(route('admin.enrollments.cash-payments.store', $enrollment), ['amount' => 1000, 'receipt_number' => 'OR-6']);
    $staff = User::factory()->create(['role' => 'STAFF']);

    $this->actingAs($staff)
        ->post(route('admin.payments.void', Payment::sole()), ['reason' => 'Trying to void this'])
        ->assertForbidden();

    expect(Payment::sole()->status)->toBe('COMPLETED');
});
