<?php

use App\Actions\Payments\GenerateAcknowledgementReceipt;
use App\Actions\Payments\RecordCounterPayment;
use App\Enums\PaymentForm;
use App\Models\BillingContract;
use App\Models\EnrolleeUser;
use App\Models\Enrollment;
use App\Models\Payment;
use App\Models\Student;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Notification;

/**
 * An approved Juan Dela Cruz, billed ₱10,000 as ten ₱1,000 monthly
 * installments, paid at the counter.
 */
function receiptEnrollment(): Enrollment
{
    $enrollment = Enrollment::factory()->create([
        'student_id' => Student::factory()->state(['first_name' => 'Juan', 'last_name' => 'Dela Cruz']),
        'enrollment_status' => 'APPROVED',
        'enrollee_user_id' => EnrolleeUser::factory()->state(['name' => 'Maria Dela Cruz']),
    ]);

    $enrollment->student->address()->create([
        'house_number_street' => '12 Santiago St.',
        'barangay' => 'Balud',
        'city_municipality' => 'Borongan City',
        'province' => 'Eastern Samar',
    ]);

    $enrollment->billingContract()->create([
        'payment_option' => 'MONTHLY',
        'payment_channel' => BillingContract::CHANNEL_COUNTER,
        'total_fee' => 10000,
    ])->generateInstallments();

    return $enrollment;
}

/**
 * Records a counter payment and returns its first part.
 *
 * @param  array<string, mixed>  $receiptDetails
 */
function recordReceipt(Enrollment $enrollment, float $amount, string $receiptNumber, User $cashier, array $receiptDetails = []): Payment
{
    return app(RecordCounterPayment::class)
        ->handle($enrollment, $amount, $receiptNumber, Carbon::parse('2026-09-28'), $cashier, $receiptDetails)
        ->first();
}

beforeEach(function () {
    Notification::fake();
    $this->cashier = User::factory()->cashier()->create(['name' => 'Ana Reyes']);
});

test('guests cannot print a receipt', function () {
    $payment = recordReceipt(receiptEnrollment(), 1000, 'OR-00123', $this->cashier);

    $this->get(route('admin.payments.receipt.show', $payment))->assertRedirect(route('login'));
});

test('staff who handle payments can print a counter payment receipt as a pdf', function () {
    $payment = recordReceipt(receiptEnrollment(), 1000, 'OR-00123', $this->cashier);

    $this->actingAs($this->cashier)
        ->get(route('admin.payments.receipt.show', $payment))
        ->assertOk()
        ->assertHeader('Content-Type', 'application/pdf')
        ->assertHeader('Content-Disposition', 'inline; filename=acknowledgement-receipt-or-00123.pdf');
});

test('teachers cannot print receipts', function () {
    $payment = recordReceipt(receiptEnrollment(), 1000, 'OR-00123', $this->cashier);

    $this->actingAs(User::factory()->teacher()->create())
        ->get(route('admin.payments.receipt.show', $payment))
        ->assertForbidden();
});

test('voided counter payments have no receipt to print', function () {
    $payment = recordReceipt(receiptEnrollment(), 1000, 'OR-00123', $this->cashier);
    $payment->update(['status' => 'VOIDED', 'voided_at' => now()]);

    $this->actingAs($this->cashier)
        ->get(route('admin.payments.receipt.show', $payment))
        ->assertNotFound();
});

test('gcash payments have no receipt to print', function () {
    $enrollment = receiptEnrollment();
    $payment = Payment::create([
        'installment_id' => $enrollment->billingContract->installments()->first()->id,
        'enrollment_id' => $enrollment->id,
        'amount' => 1000,
        'method' => 'GCASH',
        'status' => 'COMPLETED',
    ]);

    $this->actingAs($this->cashier)
        ->get(route('admin.payments.receipt.show', $payment))
        ->assertNotFound();
});

test('a receipt lists every installment its payment was split across', function () {
    $enrollment = receiptEnrollment();
    recordReceipt($enrollment, 400, 'OR-00100', $this->cashier);
    $payment = recordReceipt($enrollment, 1600.5, 'OR-00123', $this->cashier, [
        'received_from' => 'Pedro Dela Cruz',
        'payment_form' => PaymentForm::Check,
        'check_bank' => 'BPI',
        'check_number' => '000123',
        'check_date' => Carbon::parse('2026-09-27'),
    ]);

    $receipt = app(GenerateAcknowledgementReceipt::class)->viewData($payment);

    expect($receipt)
        ->receiptNumber->toBe('OR-00123')
        ->receivedFrom->toBe('Pedro Dela Cruz')
        ->address->toBe('12 Santiago St., Balud, Borongan City, Eastern Samar')
        ->particulars->toBe([
            ['label' => 'Installment #1', 'amount' => 600.0],
            ['label' => 'Installment #2', 'amount' => 1000.0],
            ['label' => 'Installment #3', 'amount' => 0.5],
        ])
        ->total->toBe(1600.5)
        ->totalInWords->toBe('One Thousand Six Hundred and 50/100')
        ->amountDue->toBe(2600.0)
        ->isFullPayment->toBeFalse()
        ->paymentForm->toBe('CHECK')
        ->checkBank->toBe('BPI')
        ->checkNumber->toBe('000123')
        ->cashier->toBe('Ana Reyes')
        ->and($receipt['paymentFor'])->toStartWith("Installment #1, #2, #3 of Juan Dela Cruz's school fees");
});

test('a receipt that settles what was due is a full cash payment from the parent account', function () {
    $payment = recordReceipt(receiptEnrollment(), 1000, 'OR-00123', $this->cashier);

    $receipt = app(GenerateAcknowledgementReceipt::class)->viewData($payment);

    expect($receipt)
        ->receivedFrom->toBe('Maria Dela Cruz')
        ->amountDue->toBe(1000.0)
        ->isFullPayment->toBeTrue()
        ->paymentForm->toBe('CASH')
        ->totalInWords->toBe('One Thousand');
});
