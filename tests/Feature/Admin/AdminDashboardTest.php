<?php

use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\Installment;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->travelTo(Carbon::parse('2026-09-30 10:00', 'Asia/Manila'));
    $this->admin = User::factory()->create(['role' => 'ADMIN']);
    $this->gradeLevel = GradeLevel::factory()->create(['name' => 'Grade 1', 'level_order' => 1]);
});

/**
 * An application billed ₱10,000 in two ₱5,000 installments, the first due
 * at the start of this month and the second next month.
 */
function dashboardEnrollment(array $attributes = []): Enrollment
{
    $enrollment = Enrollment::factory()->create([
        'grade_level_id' => test()->gradeLevel->id,
        'school_year' => '2026-2027',
        ...$attributes,
    ]);

    $contract = $enrollment->billingContract()->create([
        'payment_option' => 'BI_MONTHLY',
        'payment_channel' => 'COUNTER',
        'total_fee' => 10000,
    ]);

    foreach ([1 => '2026-09-01', 2 => '2026-10-01'] as $number => $dueDate) {
        $contract->installments()->create([
            'installment_number' => $number,
            'amount_due' => 5000,
            'due_date' => $dueDate,
            'status' => 'UNPAID',
        ]);
    }

    return $enrollment;
}

function dashboardPayment(Enrollment $enrollment, int $number, float $amount, string $paidAt, string $status = 'COMPLETED'): Payment
{
    $installment = $enrollment->billingContract->installments()->where('installment_number', $number)->first();

    $payment = Payment::create([
        'installment_id' => $installment->id,
        'enrollment_id' => $enrollment->id,
        'amount' => $amount,
        'method' => 'CASH',
        'status' => $status,
        'paid_at' => Carbon::parse($paidAt, 'Asia/Manila'),
    ]);
    $installment->refreshStatus();

    return $payment;
}

test('the dashboard defaults to the newest school year and counts only its applications', function () {
    dashboardEnrollment(['enrollment_status' => 'APPROVED']);
    dashboardEnrollment(['enrollment_status' => 'PENDING']);
    dashboardEnrollment(['enrollment_status' => 'PENDING', 'cancelled_at' => now()]);
    dashboardEnrollment(['school_year' => '2025-2026', 'enrollment_status' => 'APPROVED']);

    $this->actingAs($this->admin)
        ->get(route('admin.dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Dashboard')
            ->where('filters.school_year', '2026-2027')
            ->where('schoolYears', ['2026-2027', '2025-2026'])
            ->where('stats.totalEnrollments', 2)
            ->where('stats.cancelledEnrollments', 1)
            ->where('stats.statusBreakdown.APPROVED', 1)
            ->where('stats.statusBreakdown.PENDING', 1)
            ->where('stats.enrollmentsByGrade.0.name', 'Grade 1')
            ->where('stats.enrollmentsByGrade.0.count', 2)
            ->where('stats.totalBilled', 20000)
        );
});

test('choosing all school years counts every active application', function () {
    dashboardEnrollment();
    dashboardEnrollment(['school_year' => '2025-2026']);

    $this->actingAs($this->admin)
        ->get(route('admin.dashboard', ['school_year' => '']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('filters.school_year', '')
            ->where('stats.totalEnrollments', 2)
            ->where('stats.totalBilled', 20000)
        );
});

test('collections and overdue installments only count completed payments', function () {
    $enrollment = dashboardEnrollment(['enrollment_status' => 'APPROVED']);
    // The first installment is overdue and only partly paid.
    dashboardPayment($enrollment, 1, 2000, '2026-09-10');
    dashboardPayment($enrollment, 1, 1000, '2026-09-12', 'FAILED');

    $this->actingAs($this->admin)
        ->get(route('admin.dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('stats.totalCollected', 2000)
            ->where('stats.overdue.installments', 1)
            ->where('stats.overdue.families', 1)
            ->where('stats.overdue.amount', 3000)
            ->where('stats.paymentMethodBreakdown.0.method', 'CASH')
            ->where('recentPayments.0.amount', '2000.00')
        );
});

test('the collections trend covers the last six months, with empty months included', function () {
    $enrollment = dashboardEnrollment();
    dashboardPayment($enrollment, 1, 1500, '2026-07-15');
    dashboardPayment($enrollment, 1, 500, '2026-09-01 07:00');
    // Older than the six months shown.
    dashboardPayment($enrollment, 2, 700, '2026-03-20');

    $this->actingAs($this->admin)
        ->get(route('admin.dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('stats.monthlyCollections', 6)
            ->where('stats.monthlyCollections.0.month', '2026-04')
            ->where('stats.monthlyCollections.0.total', 0)
            ->where('stats.monthlyCollections.3.month', '2026-07')
            ->where('stats.monthlyCollections.3.total', 1500)
            // 7 AM on Sept 1 in Manila is still Aug 31 in UTC.
            ->where('stats.monthlyCollections.5.month', '2026-09')
            ->where('stats.monthlyCollections.5.label', 'Sep 2026')
            ->where('stats.monthlyCollections.5.total', 500)
        );
});

test('an installment that is paid in full is not overdue', function () {
    $enrollment = dashboardEnrollment();
    dashboardPayment($enrollment, 1, 5000, '2026-09-05');

    $this->actingAs($this->admin)
        ->get(route('admin.dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('stats.overdue.installments', 0)
            ->where('stats.overdue.amount', 0)
        );
});
