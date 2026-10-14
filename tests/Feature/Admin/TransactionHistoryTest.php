<?php

use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\Payment;
use App\Models\Student;
use App\Models\User;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * @param  array<string, mixed>  $attributes
 */
function historyEnrollment(string $lastName, array $attributes = []): Enrollment
{
    $enrollment = Enrollment::factory()->create([
        'student_id' => Student::factory()->create(['last_name' => $lastName]),
        'grade_level_id' => GradeLevel::factory()->create()->id,
        'enrollment_status' => 'APPROVED',
        'email' => strtolower($lastName).'@example.com',
        ...$attributes,
    ]);

    $enrollment->billingContract()->create([
        'payment_option' => 'MONTHLY',
        'total_fee' => 10000,
    ])->generateInstallments();

    return $enrollment;
}

/**
 * @param  array<string, mixed>  $attributes
 */
function historyPayment(Enrollment $enrollment, array $attributes = []): Payment
{
    return Payment::create([
        'installment_id' => $enrollment->billingContract->installments()->orderBy('installment_number')->first()->id,
        'enrollment_id' => $enrollment->id,
        'amount' => 1000,
        'method' => 'GCASH',
        'status' => 'COMPLETED',
        'paymongo_source_id' => 'src_'.fake()->unique()->bothify('????????'),
        'paid_at' => now(),
        ...$attributes,
    ]);
}

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => 'ADMIN']);
});

test('guests and staff without the payments ability cannot see the history', function () {
    $this->get(route('admin.transaction-history.index'))->assertRedirect(route('login'));

    $this->actingAs(User::factory()->create(['role' => 'TEACHER']))
        ->get(route('admin.transaction-history.index'))
        ->assertForbidden();
});

test('the history lists every paid and voided payment, newest first', function () {
    $enrollment = historyEnrollment('Cruz');
    $paid = historyPayment($enrollment);
    $voided = historyPayment($enrollment, ['method' => 'CASH', 'paymongo_source_id' => null, 'receipt_number' => 'OR-1', 'status' => 'VOIDED']);
    historyPayment($enrollment, ['status' => 'PENDING', 'paid_at' => null]);
    historyPayment($enrollment, ['status' => 'FAILED', 'paid_at' => null]);

    $this->actingAs(User::factory()->create(['role' => 'CASHIER']))
        ->get(route('admin.transaction-history.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Transactions/History')
            ->has('payments.data', 2)
            ->where('payments.data.0.id', $voided->id)
            ->where('payments.data.0.status', 'VOIDED')
            ->where('payments.data.1.id', $paid->id)
            ->where('payments.data.1.enrollment.student.last_name', 'Cruz')
            ->where('payments.data.1.installment.installment_number', 1)
        );
});

test('the history can be filtered', function (array $query, string $expected) {
    $cruz = historyEnrollment('Cruz', ['school_year' => '2026-2027']);
    $bautista = historyEnrollment('Bautista', ['school_year' => '2025-2026']);

    Carbon::setTestNow('2026-06-15 09:00');
    $payments = [
        'cruz gcash' => historyPayment($cruz, ['paymongo_source_id' => 'src_findme123']),
        'cruz voided cash' => historyPayment($cruz, ['method' => 'CASH', 'paymongo_source_id' => null, 'receipt_number' => 'OR-77', 'status' => 'VOIDED']),
    ];
    Carbon::setTestNow('2026-07-15 09:00');
    $payments['bautista gcash'] = historyPayment($bautista);
    Carbon::setTestNow();

    $query['grade_level_id'] = isset($query['grade_level_id']) ? $bautista->grade_level_id : null;

    $this->actingAs($this->admin)
        ->get(route('admin.transaction-history.index', array_filter($query)))
        ->assertInertia(fn (Assert $page) => $page
            ->has('payments.data', 1)
            ->where('payments.data.0.id', $payments[$expected]->id)
        );
})->with([
    'status' => [['status' => 'VOIDED'], 'cruz voided cash'],
    'method and school year' => [['method' => 'GCASH', 'school_year' => '2026-2027'], 'cruz gcash'],
    'grade level' => [['grade_level_id' => true], 'bautista gcash'],
    'date range' => [['from' => '2026-07-01', 'to' => '2026-07-31'], 'bautista gcash'],
    'PayMongo source ID' => [['search' => 'findme123'], 'cruz gcash'],
    'OR number' => [['search' => 'OR-77'], 'cruz voided cash'],
    'student name' => [['search' => 'bautista'], 'bautista gcash'],
]);

test('invalid history filters are rejected', function (array $query, string $field) {
    $this->actingAs($this->admin)
        ->get(route('admin.transaction-history.index', $query))
        ->assertSessionHasErrors($field);
})->with([
    'pending is not a payment' => [['status' => 'PENDING'], 'status'],
    'unknown method' => [['method' => 'CARD'], 'method'],
    'range ends before it starts' => [['from' => '2026-06-20', 'to' => '2026-06-10'], 'to'],
]);
