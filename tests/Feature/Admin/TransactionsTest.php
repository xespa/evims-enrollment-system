<?php

use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\Payment;
use App\Models\Student;
use App\Models\User;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * An approved application with a generated 10-installment schedule of
 * ₱1,000 each, due on the 15th from June to March.
 *
 * @param  array<string, mixed>  $attributes
 */
function enrollmentWithInstallments(string $lastName, array $attributes = []): Enrollment
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
        ...$attributes,
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
    $payment = Payment::create([
        'installment_id' => $enrollment->billingContract->installments()->orderBy('installment_number')->first()->id,
        'enrollment_id' => $enrollment->id,
        'amount' => 1000,
        'method' => 'GCASH',
        'status' => 'COMPLETED',
        'paymongo_source_id' => 'src_'.fake()->unique()->bothify('????????'),
        'paid_at' => now(),
        ...$attributes,
    ]);

    $payment->installment->refreshStatus();

    return $payment;
}

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => 'ADMIN']);
    // June to September's installments are past due; October onwards aren't.
    Carbon::setTestNow('2026-10-14 10:00');
});

afterEach(function () {
    Carbon::setTestNow();
});

test('guests and non-admin staff cannot view transactions', function () {
    $payment = transactionFor(enrollmentWithInstallments('Cruz'));

    $this->get(route('admin.transactions.index'))->assertRedirect(route('login'));
    $this->get(route('admin.transactions.show', $payment))->assertRedirect(route('login'));

    $staff = User::factory()->create(['role' => 'TEACHER']);
    $this->actingAs($staff)->get(route('admin.transactions.index'))->assertForbidden();
    $this->actingAs($staff)->get(route('admin.transactions.show', $payment))->assertForbidden();
});

test('the paid tab lists each student who has paid once, most recent payment first', function () {
    $cruz = enrollmentWithInstallments('Cruz');
    $bautista = enrollmentWithInstallments('Bautista');
    transactionFor($cruz, ['amount' => 600]);
    transactionFor($cruz, ['amount' => 400, 'method' => 'CASH', 'paymongo_source_id' => null, 'recorded_by' => $this->admin->id]);
    // Attempts that never took money, and reversed money, don't count.
    transactionFor($cruz, ['status' => 'PENDING', 'paid_at' => null]);
    transactionFor($cruz, ['status' => 'FAILED', 'paid_at' => null]);
    transactionFor($cruz, ['amount' => 300, 'method' => 'CASH', 'paymongo_source_id' => null, 'receipt_number' => 'OR-1', 'status' => 'VOIDED']);
    $this->travel(1)->hours();
    transactionFor($bautista, ['amount' => 1000]);
    // Owes but hasn't paid anything: not on the paid tab.
    enrollmentWithInstallments('Dizon');

    $this->actingAs($this->admin)
        ->get(route('admin.transactions.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Transactions/Index')
            ->where('tab', 'PAID')
            ->has('rows.data', 2)
            ->where('rows.data.0.id', $bautista->id)
            ->where('rows.data.1.id', $cruz->id)
            ->where('rows.data.1.student.last_name', 'Cruz')
            ->where('rows.data.1.paid_count', 2)
            ->where('rows.data.1.payment.paid', 1000)
            ->where('rows.data.1.payment.channel_label', 'GCash')
            ->has('rows.data.1.installments', 10)
            ->where('rows.data.1.installments.0.status', 'PAID')
            // Voided money stays visible in the schedule, struck through.
            ->has('rows.data.1.installments.0.payments', 3)
            ->where('summary.collected', 2000)
            ->where('summary.paid_students', 2)
        );
});

test('students who owe are split into overdue and receivable by due date', function () {
    $enrollment = enrollmentWithInstallments('Cruz');
    // Installment #1 (June) is paid; #2 (July) is part paid.
    transactionFor($enrollment);
    transactionFor($enrollment, [
        'installment_id' => $enrollment->billingContract->installments()->where('installment_number', 2)->value('id'),
        'amount' => 400,
    ]);

    $this->actingAs($this->admin)
        ->get(route('admin.transactions.index', ['tab' => 'OVERDUE']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('tab', 'OVERDUE')
            ->has('rows.data', 1)
            ->where('rows.data.0.id', $enrollment->id)
            ->where('rows.data.0.owed', 2600)
            ->where('rows.data.0.owed_installments', 3)
            ->where('rows.data.0.first_owed_due_date', '2026-07-15')
            ->where('rows.data.0.days_overdue', 91)
            ->where('rows.data.0.grade_level', $enrollment->gradeLevel->name)
            ->has('rows.data.0.installments', 10)
            ->has('rows.data.0.payment.unpaid_installments', 9)
            ->where('summary.overdue', ['count' => 1, 'total' => 2600])
            ->where('summary.receivable', ['count' => 1, 'total' => 6000])
            ->where('summary.collected', 1400)
        );

    $this->actingAs($this->admin)
        ->get(route('admin.transactions.index', ['tab' => 'RECEIVABLE']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('rows.data', 1)
            ->where('rows.data.0.owed', 6000)
            ->where('rows.data.0.owed_installments', 6)
            ->where('rows.data.0.first_owed_due_date', '2026-10-15')
            ->where('rows.data.0.days_overdue', 0)
        );
});

test('students who have caught up drop off the overdue tab', function () {
    $current = enrollmentWithInstallments('Cruz');
    $behind = enrollmentWithInstallments('Bautista');
    // Cruz has paid every installment due before today; Bautista hasn't.
    foreach ($current->billingContract->installments()->where('due_date', '<', '2026-10-14')->get() as $installment) {
        transactionFor($current, ['installment_id' => $installment->id]);
    }

    $this->actingAs($this->admin)
        ->get(route('admin.transactions.index', ['tab' => 'OVERDUE']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('rows.data', 1)
            ->where('rows.data.0.id', $behind->id)
            ->where('rows.data.0.owed_installments', 4)
        );
});

test('applications that are not approved, cancelled or archived owe nothing', function () {
    enrollmentWithInstallments('Pending', ['enrollment_status' => 'PENDING']);
    enrollmentWithInstallments('Cancelled', ['cancelled_at' => now()]);
    enrollmentWithInstallments('Archived', ['archived_at' => now()]);

    $this->actingAs($this->admin)
        ->get(route('admin.transactions.index', ['tab' => 'OVERDUE']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('rows.data', 0)
            ->where('summary.overdue', ['count' => 0, 'total' => 0])
            ->where('summary.receivable', ['count' => 0, 'total' => 0])
        );
});

test('every tab can be filtered by school year, grade level and student', function () {
    $thisYear = enrollmentWithInstallments('Cruz', ['school_year' => '2026-2027']);
    $lastYear = enrollmentWithInstallments('Bautista', ['school_year' => '2025-2026']);
    transactionFor($thisYear);
    transactionFor($lastYear);

    $this->actingAs($this->admin)
        ->get(route('admin.transactions.index', ['school_year' => '2026-2027']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('rows.data', 1)
            ->where('rows.data.0.id', $thisYear->id)
            ->where('summary.collected', 1000)
            ->where('summary.overdue.count', 1)
            ->where('schoolYears', ['2026-2027', '2025-2026'])
            ->where('filters.school_year', '2026-2027')
        );

    $this->actingAs($this->admin)
        ->get(route('admin.transactions.index', ['tab' => 'OVERDUE', 'grade_level_id' => $lastYear->grade_level_id]))
        ->assertInertia(fn (Assert $page) => $page
            ->has('rows.data', 1)
            ->where('rows.data.0.student.last_name', 'Bautista')
            ->where('filters.grade_level_id', (string) $lastYear->grade_level_id)
        );

    $this->actingAs($this->admin)
        ->get(route('admin.transactions.index', ['tab' => 'RECEIVABLE', 'search' => 'bautista']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('rows.data', 1)
            ->where('rows.data.0.id', $lastYear->id)
            ->where('summary.receivable.count', 1)
        );
});

test('invalid filters are rejected', function (array $query, string $field) {
    $this->actingAs($this->admin)
        ->get(route('admin.transactions.index', $query))
        ->assertSessionHasErrors($field);
})->with([
    'removed status tab' => [['tab' => 'PENDING'], 'tab'],
    'malformed school year' => [['school_year' => '2026'], 'school_year'],
    'unknown grade level' => [['grade_level_id' => 999], 'grade_level_id'],
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
