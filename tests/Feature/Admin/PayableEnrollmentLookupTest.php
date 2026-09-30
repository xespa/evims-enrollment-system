<?php

use App\Models\BillingContract;
use App\Models\Enrollment;
use App\Models\Payment;
use App\Models\Student;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * An application billed ₱10,000 as ten ₱1,000 monthly installments.
 *
 * @param  array<string, mixed>  $attributes
 */
function billedEnrollment(string $firstName, string $lastName, array $attributes = []): Enrollment
{
    $enrollment = Enrollment::factory()->create([
        'student_id' => Student::factory()->create([
            'first_name' => $firstName,
            'last_name' => $lastName,
            'lrn' => '45250112345'.fake()->unique()->numerify('###'),
        ]),
        'enrollment_status' => 'APPROVED',
        'email' => strtolower($firstName).'@example.com',
        ...$attributes,
    ]);

    $enrollment->billingContract()->create([
        'payment_option' => 'MONTHLY',
        'payment_channel' => BillingContract::CHANNEL_COUNTER,
        'total_fee' => 10000,
    ])->generateInstallments();

    return $enrollment;
}

function payInFull(Enrollment $enrollment): void
{
    foreach ($enrollment->billingContract->installments as $installment) {
        Payment::create([
            'installment_id' => $installment->id,
            'enrollment_id' => $enrollment->id,
            'amount' => $installment->amount_due,
            'method' => 'CASH',
            'receipt_number' => 'OR-FULL-'.$enrollment->id,
            'status' => 'COMPLETED',
            'paid_at' => now(),
        ]);
        $installment->refreshStatus();
    }
}

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => 'ADMIN']);
});

test('the lookup finds a payable application by name, LRN, reference no. or email', function (string $search) {
    $juan = billedEnrollment('Juan', 'Dela Cruz');
    billedEnrollment('Maria', 'Santos');

    $search = str_replace(['{id}', '{lrn}'], [(string) $juan->id, $juan->student->lrn], $search);

    $this->actingAs($this->admin)
        ->getJson(route('admin.payable-enrollments.index', ['search' => $search]))
        ->assertOk()
        ->assertJsonCount(1, 'results')
        ->assertJsonPath('results.0.id', $juan->id)
        ->assertJsonPath('results.0.student_name', 'Juan Dela Cruz')
        ->assertJsonPath('results.0.payment.balance', 10000)
        ->assertJsonCount(10, 'results.0.payment.unpaid_installments');
})->with([
    'first name' => 'juan',
    'full name' => 'Juan Dela Cruz',
    'last name first' => 'Cruz Juan',
    'LRN' => '{lrn}',
    'reference no.' => '#{id}',
    'email' => 'juan@example',
]);

test('only approved, active applications that still owe money are offered', function () {
    $payable = billedEnrollment('Ana', 'Reyes');
    billedEnrollment('Ana', 'Pending', ['enrollment_status' => 'PENDING']);
    billedEnrollment('Ana', 'Cancelled', ['cancelled_at' => now()]);
    payInFull(billedEnrollment('Ana', 'Paid'));
    Enrollment::factory()->create([
        'student_id' => Student::factory()->create(['first_name' => 'Ana', 'last_name' => 'Unbilled']),
        'enrollment_status' => 'APPROVED',
    ]);

    $this->actingAs($this->admin)
        ->getJson(route('admin.payable-enrollments.index', ['search' => 'Ana']))
        ->assertOk()
        ->assertJsonCount(1, 'results')
        ->assertJsonPath('results.0.id', $payable->id);
});

test('the lookup needs at least two characters', function () {
    $this->actingAs($this->admin)
        ->getJson(route('admin.payable-enrollments.index', ['search' => 'a']))
        ->assertUnprocessable()
        ->assertJsonValidationErrors('search');
});

test('only admins can use the lookup', function () {
    $this->getJson(route('admin.payable-enrollments.index', ['search' => 'Juan']))->assertUnauthorized();

    $staff = User::factory()->create(['role' => 'STAFF']);
    $this->actingAs($staff)
        ->getJson(route('admin.payable-enrollments.index', ['search' => 'Juan']))
        ->assertForbidden();
});

test('a counter payment\'s detail page offers voiding its whole receipt', function () {
    $enrollment = billedEnrollment('Juan', 'Dela Cruz');
    $this->actingAs($this->admin)->post(route('admin.enrollments.cash-payments.store', $enrollment), [
        'amount' => 2500,
        'receipt_number' => 'OR-42',
    ]);

    $this->actingAs($this->admin)
        ->get(route('admin.transactions.show', Payment::first()))
        ->assertInertia(fn (Assert $page) => $page
            ->where('canVoid', true)
            ->where('receipt.total', 2500)
            ->where('receipt.parts', 3)
        );
});

test('GCash and voided payments cannot be voided from their detail page', function (string $method, string $status) {
    $enrollment = billedEnrollment('Juan', 'Dela Cruz');
    $payment = Payment::create([
        'installment_id' => $enrollment->billingContract->installments()->first()->id,
        'enrollment_id' => $enrollment->id,
        'amount' => 1000,
        'method' => $method,
        'receipt_number' => $method === 'CASH' ? 'OR-5' : null,
        'status' => $status,
    ]);

    $this->actingAs($this->admin)
        ->get(route('admin.transactions.show', $payment))
        ->assertInertia(fn (Assert $page) => $page->where('canVoid', false));
})->with([
    'a GCash payment' => ['GCASH', 'COMPLETED'],
    'a voided counter payment' => ['CASH', 'VOIDED'],
]);
