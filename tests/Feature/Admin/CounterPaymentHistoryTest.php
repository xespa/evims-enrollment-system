<?php

use App\Models\BillingContract;
use App\Models\EnrolleeUser;
use App\Models\Enrollment;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Support\Facades\Notification;

/**
 * An approved counter-paying application billed ₱10,000 as ten ₱1,000
 * monthly installments.
 */
function enrollmentWithCounterBilling(): Enrollment
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

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => 'ADMIN']);
    Notification::fake();
});

test('earlier counter payments are listed once per receipt, newest first', function () {
    $enrollment = enrollmentWithCounterBilling();

    $this->actingAs($this->admin)->post(route('admin.enrollments.cash-payments.store', $enrollment), [
        'amount' => 2500,
        'receipt_number' => 'OR-0210',
        'paid_on' => '2026-09-01',
        'received_from' => 'Maria Dela Cruz',
    ]);
    $this->actingAs($this->admin)->post(route('admin.enrollments.cash-payments.store', $enrollment), [
        'amount' => 500,
        'receipt_number' => 'OR-0211',
        'paid_on' => '2026-10-01',
        'payment_form' => 'CHECK',
        'check_bank' => 'BDO',
        'check_number' => '000123',
        'check_date' => '2026-10-01',
    ]);

    $this->actingAs($this->admin)
        ->getJson(route('admin.enrollments.cash-payments.index', $enrollment))
        ->assertOk()
        ->assertJsonCount(2, 'receipts')
        ->assertJsonPath('receipts.0.receipt_number', 'OR-0211')
        ->assertJsonPath('receipts.0.amount', 500)
        ->assertJsonPath('receipts.0.payment_form', 'CHECK')
        ->assertJsonPath('receipts.0.check_bank', 'BDO')
        ->assertJsonPath('receipts.0.installment_numbers', [3])
        ->assertJsonPath('receipts.1.receipt_number', 'OR-0210')
        ->assertJsonPath('receipts.1.amount', 2500)
        ->assertJsonPath('receipts.1.received_from', 'Maria Dela Cruz')
        ->assertJsonPath('receipts.1.recorded_by', $this->admin->name)
        ->assertJsonPath('receipts.1.installment_numbers', [1, 2, 3]);
});

test('voided receipts are listed apart from a re-recorded one with the same OR number', function () {
    $enrollment = enrollmentWithCounterBilling();
    $this->actingAs($this->admin)->post(route('admin.enrollments.cash-payments.store', $enrollment), ['amount' => 1000, 'receipt_number' => 'OR-77']);
    $this->actingAs($this->admin)->post(route('admin.payments.void', Payment::sole()), ['reason' => 'Typed the wrong amount']);
    $this->actingAs($this->admin)->post(route('admin.enrollments.cash-payments.store', $enrollment), ['amount' => 1500, 'receipt_number' => 'OR-77']);

    $receipts = $this->actingAs($this->admin)
        ->getJson(route('admin.enrollments.cash-payments.index', $enrollment))
        ->assertOk()
        ->json('receipts');

    expect(collect($receipts)->pluck('status')->sort()->values()->all())->toBe(['COMPLETED', 'VOIDED'])
        ->and(collect($receipts)->firstWhere('status', 'COMPLETED')['amount'])->toEqual(1500);
});

test('only this application\'s counter payments are listed', function () {
    $enrollment = enrollmentWithCounterBilling();
    $otherEnrollment = enrollmentWithCounterBilling();
    $this->actingAs($this->admin)->post(route('admin.enrollments.cash-payments.store', $otherEnrollment), ['amount' => 1000, 'receipt_number' => 'OR-1']);
    Payment::create([
        'installment_id' => $enrollment->billingContract->installments()->first()->id,
        'enrollment_id' => $enrollment->id,
        'amount' => 1000,
        'method' => 'GCASH',
        'status' => 'COMPLETED',
    ]);

    $this->actingAs($this->admin)
        ->getJson(route('admin.enrollments.cash-payments.index', $enrollment))
        ->assertOk()
        ->assertExactJson(['receipts' => []]);
});

test('users who cannot handle payments cannot see the history', function () {
    $enrollment = enrollmentWithCounterBilling();

    $this->actingAs(User::factory()->create(['role' => 'TEACHER']))
        ->getJson(route('admin.enrollments.cash-payments.index', $enrollment))
        ->assertForbidden();
});

test('guests cannot see the history', function () {
    $enrollment = enrollmentWithCounterBilling();

    $this->getJson(route('admin.enrollments.cash-payments.index', $enrollment))
        ->assertUnauthorized();
});
