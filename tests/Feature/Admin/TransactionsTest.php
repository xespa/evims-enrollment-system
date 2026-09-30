<?php

use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\Payment;
use App\Models\Student;
use App\Models\User;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * An approved application with a generated 10-installment schedule.
 */
function enrollmentWithInstallments(string $lastName): Enrollment
{
    $gradeLevel = GradeLevel::factory()->withCurriculum([
        'registration_fee' => 1000,
        'miscellaneous_fee' => 0,
        'books_fee' => 0,
        'monthly_tuition' => 900,
        'monthly_laboratory_fee' => 0,
    ])->create();

    $enrollment = Enrollment::factory()->create([
        'student_id' => Student::factory()->create(['last_name' => $lastName, 'lrn' => null]),
        'grade_level_id' => $gradeLevel->id,
        'enrollment_status' => 'APPROVED',
        'email' => strtolower($lastName).'@example.com',
    ]);

    $enrollment->billingContract()->create([
        'payment_option' => 'MONTHLY',
        'payment_channel' => 'GCASH',
        'total_fee' => $gradeLevel->curricula()->first()->tuition_fee,
    ])->generateInstallments();

    return $enrollment;
}

/**
 * @param  array<string, mixed>  $attributes
 */
function transactionFor(Enrollment $enrollment, array $attributes = []): Payment
{
    return Payment::create([
        'installment_id' => $enrollment->billingContract->installments()->first()->id,
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

test('guests and non-admin staff cannot view transactions', function () {
    $payment = transactionFor(enrollmentWithInstallments('Cruz'));

    $this->get(route('admin.transactions.index'))->assertRedirect(route('login'));
    $this->get(route('admin.transactions.show', $payment))->assertRedirect(route('login'));

    $staff = User::factory()->create(['role' => 'STAFF']);
    $this->actingAs($staff)->get(route('admin.transactions.index'))->assertForbidden();
    $this->actingAs($staff)->get(route('admin.transactions.show', $payment))->assertForbidden();
});

test('admins see every transaction newest first with a summary', function () {
    $enrollment = enrollmentWithInstallments('Cruz');
    $paid = transactionFor($enrollment, ['amount' => 1000]);
    $cash = transactionFor($enrollment, ['amount' => 500, 'method' => 'CASH', 'paymongo_source_id' => null, 'recorded_by' => $this->admin->id]);
    $pending = transactionFor($enrollment, ['status' => 'PENDING', 'paid_at' => null]);
    $failed = transactionFor($enrollment, ['status' => 'FAILED', 'paid_at' => null]);

    $this->actingAs($this->admin)
        ->get(route('admin.transactions.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Transactions/Index')
            ->has('transactions.data', 4)
            ->where('transactions.data.0.id', $failed->id)
            ->where('transactions.data.3.id', $paid->id)
            ->where('transactions.data.0.enrollment.student.last_name', 'Cruz')
            ->where('transactions.data.0.installment.installment_number', 1)
            // Only completed payments count as money collected.
            ->where('summary.collected', 1500)
            ->where('summary.counts.ALL', 4)
            ->where('summary.counts.COMPLETED', 2)
            ->where('summary.counts.PENDING', 1)
            ->where('summary.counts.FAILED', 1)
        );
});

test('the status tab narrows the list but keeps every tab count', function () {
    $enrollment = enrollmentWithInstallments('Cruz');
    transactionFor($enrollment);
    $pending = transactionFor($enrollment, ['status' => 'PENDING', 'paid_at' => null]);

    $this->actingAs($this->admin)
        ->get(route('admin.transactions.index', ['status' => 'PENDING']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('transactions.data', 1)
            ->where('transactions.data.0.id', $pending->id)
            ->where('summary.counts.ALL', 2)
            ->where('summary.counts.COMPLETED', 1)
            ->where('filters.status', 'PENDING')
        );
});

test('transactions can be filtered by method', function () {
    $enrollment = enrollmentWithInstallments('Cruz');
    transactionFor($enrollment);
    $cash = transactionFor($enrollment, ['method' => 'CASH', 'paymongo_source_id' => null]);

    $this->actingAs($this->admin)
        ->get(route('admin.transactions.index', ['method' => 'CASH']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('transactions.data', 1)
            ->where('transactions.data.0.id', $cash->id)
            ->where('summary.counts.ALL', 1)
        );
});

test('transactions can be searched by student, email, PayMongo ID or number', function (string $search) {
    $match = transactionFor(enrollmentWithInstallments('Bautista'), ['paymongo_source_id' => 'src_findme123']);
    transactionFor(enrollmentWithInstallments('Cruz'));

    $search = str_replace('{id}', (string) $match->id, $search);

    $this->actingAs($this->admin)
        ->get(route('admin.transactions.index', ['search' => $search]))
        ->assertInertia(fn (Assert $page) => $page
            ->has('transactions.data', 1)
            ->where('transactions.data.0.id', $match->id)
        );
})->with([
    'student last name' => 'bautista',
    'email' => 'bautista@example',
    'PayMongo source ID' => 'findme123',
    'transaction number' => '#{id}',
]);

test('transactions can be filtered by created date range', function () {
    $enrollment = enrollmentWithInstallments('Cruz');

    Carbon::setTestNow('2026-06-01 09:00');
    transactionFor($enrollment);
    Carbon::setTestNow('2026-06-15 09:00');
    $inRange = transactionFor($enrollment);
    Carbon::setTestNow('2026-07-01 09:00');
    transactionFor($enrollment);
    Carbon::setTestNow();

    $this->actingAs($this->admin)
        ->get(route('admin.transactions.index', ['from' => '2026-06-10', 'to' => '2026-06-20']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('transactions.data', 1)
            ->where('transactions.data.0.id', $inRange->id)
        );
});

test('invalid filters are rejected', function (array $query, string $field) {
    $this->actingAs($this->admin)
        ->get(route('admin.transactions.index', $query))
        ->assertSessionHasErrors($field);
})->with([
    'unknown status' => [['status' => 'REFUNDED'], 'status'],
    'unknown method' => [['method' => 'CARD'], 'method'],
    'range ends before it starts' => [['from' => '2026-06-20', 'to' => '2026-06-10'], 'to'],
]);

test('admins can view a transaction with its student, installment and recorder', function () {
    $enrollment = enrollmentWithInstallments('Cruz');
    $payment = transactionFor($enrollment, [
        'method' => 'CASH',
        'paymongo_source_id' => null,
        'recorded_by' => $this->admin->id,
    ]);

    $this->actingAs($this->admin)
        ->get(route('admin.transactions.show', $payment))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Transactions/Show')
            ->where('payment.id', $payment->id)
            ->where('payment.enrollment.student.last_name', 'Cruz')
            ->where('payment.enrollment.grade_level.name', $enrollment->gradeLevel->name)
            ->where('payment.installment.installment_number', 1)
            ->where('payment.recorded_by.name', $this->admin->name)
            ->missing('payment.recorded_by.email')
        );
});
