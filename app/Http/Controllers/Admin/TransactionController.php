<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexTransactionRequest;
use App\Models\BillingContract;
use App\Models\Enrollment;
use App\Models\EnrollmentPeriod;
use App\Models\GradeLevel;
use App\Models\Installment;
use App\Models\Payment;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Inertia\Inertia;
use Inertia\Response;

class TransactionController extends Controller
{
    /**
     * One row per student: who has paid, who owes installments that aren't
     * due yet (receivable), and who is behind (overdue). Each row carries
     * the student's installment schedule for the page to open.
     */
    public function index(IndexTransactionRequest $request): Response
    {
        $filters = $request->validated();
        $tab = $request->tab();
        $today = EnrollmentPeriod::today();

        $rows = $this->studentsForTab($tab, $filters, $today)
            ->with(['student:id,first_name,last_name', 'gradeLevel:id,name', ...Enrollment::installmentScheduleRelations()])
            ->paginate(20)
            ->withQueryString()
            ->through(fn (Enrollment $enrollment) => $this->row($enrollment, $tab, $today));

        $collected = Payment::query()
            ->where('status', 'COMPLETED')
            ->whereIn('enrollment_id', $this->filteredEnrollmentIds($filters));

        return Inertia::render('Admin/Transactions/Index', [
            'tab' => $tab,
            'rows' => $rows,
            // The figures for every tab, whichever tab is open.
            'summary' => [
                'collected' => round((float) $collected->sum('amount'), 2),
                'paid_students' => $this->studentsForTab(IndexTransactionRequest::TAB_PAID, $filters, $today)->count(),
                'receivable' => $this->owedSummary(IndexTransactionRequest::TAB_RECEIVABLE, $filters, $today),
                'overdue' => $this->owedSummary(IndexTransactionRequest::TAB_OVERDUE, $filters, $today),
            ],
            'schoolYears' => Enrollment::query()->distinct()->orderByDesc('school_year')->pluck('school_year'),
            'gradeLevels' => GradeLevel::orderBy('level_order')->get(['id', 'name']),
            'filters' => [
                'school_year' => $filters['school_year'] ?? '',
                'grade_level_id' => isset($filters['grade_level_id']) ? (string) $filters['grade_level_id'] : '',
                'search' => $filters['search'] ?? '',
            ],
        ]);
    }

    public function show(Payment $payment): Response
    {
        $payment->load([
            'enrollment.student:id,first_name,last_name,lrn',
            'enrollment.gradeLevel:id,name',
            'installment:id,installment_number,amount_due,due_date,status',
            'recordedBy:id,name',
            'voidedBy:id,name',
        ]);

        $canVoid = $payment->method === 'CASH' && $payment->status === 'COMPLETED';

        // Voiding covers the whole receipt: every installment it was split across.
        $receiptParts = $canVoid && $payment->receipt_number
            ? Payment::query()
                ->activeWithReceipt($payment->receipt_number)
                ->where('enrollment_id', $payment->enrollment_id)
                ->get(['id', 'amount'])
            : collect([$payment]);

        return Inertia::render('Admin/Transactions/Show', [
            'payment' => $payment,
            'canVoid' => $canVoid,
            'receipt' => [
                'total' => round((float) $receiptParts->sum('amount'), 2),
                'parts' => $receiptParts->count(),
            ],
        ]);
    }

    /**
     * The applications listed under a tab: students who have paid, most
     * recent payment first; or students who owe, earliest due first.
     *
     * @param  array<string, mixed>  $filters
     * @return Builder<Enrollment>
     */
    private function studentsForTab(string $tab, array $filters, CarbonInterface $today): Builder
    {
        $query = Enrollment::query()->tap(fn (Builder $enrollment) => $this->applyFilters($enrollment, $filters));

        if ($tab === IndexTransactionRequest::TAB_PAID) {
            $completed = fn (Builder $payments) => $payments->where('status', 'COMPLETED');

            return $query->whereHas('payments', $completed)
                ->withMax(['payments as last_paid_at' => $completed], 'paid_at')
                ->orderByDesc('last_paid_at')
                ->orderBy('enrollments.id');
        }

        $owed = fn ($installments) => $tab === IndexTransactionRequest::TAB_OVERDUE
            ? $installments->overdue($today)
            : $installments->receivable($today);

        return $query->whereHas('installments', $owed)
            ->withMin(['installments as first_owed_due_date' => $owed], 'installments.due_date')
            ->orderBy('first_owed_due_date')
            ->orderBy('enrollments.id');
    }

    /**
     * @param  Builder<Enrollment>  $enrollment
     * @param  array<string, mixed>  $filters
     */
    private function applyFilters(Builder $enrollment, array $filters): void
    {
        $enrollment->inSchoolYearAndGrade($filters)
            ->when($filters['search'] ?? null, fn (Builder $query, string $search) => $query->matchingSearch($search));
    }

    /**
     * The IDs of the applications matching the filters, as a subquery.
     *
     * @param  array<string, mixed>  $filters
     * @return Builder<Enrollment>
     */
    private function filteredEnrollmentIds(array $filters): Builder
    {
        return Enrollment::query()
            ->tap(fn (Builder $enrollment) => $this->applyFilters($enrollment, $filters))
            ->select('enrollments.id');
    }

    /**
     * What a tab shows for one student, plus the full schedule and
     * payment summary for the installments dialog.
     *
     * @return array<string, mixed>
     */
    private function row(Enrollment $enrollment, string $tab, CarbonInterface $today): array
    {
        $schedule = collect($enrollment->installmentSchedule());
        $todayString = $today->toDateString();

        $owedInTab = $schedule
            ->reject(fn (array $installment) => $installment['status'] === 'PAID')
            ->filter(fn (array $installment) => $tab === IndexTransactionRequest::TAB_OVERDUE
                ? $installment['due_date'] < $todayString
                : $installment['due_date'] >= $todayString)
            ->values();

        $firstOwedDueDate = $owedInTab->first()['due_date'] ?? null;

        return [
            'id' => $enrollment->id,
            'enrollment_status' => $enrollment->enrollment_status,
            'cancelled_at' => $enrollment->cancelled_at,
            'school_year' => $enrollment->school_year,
            'grade_level' => $enrollment->gradeLevel?->name,
            'student' => [
                'first_name' => $enrollment->student->first_name,
                'last_name' => $enrollment->student->last_name,
            ],
            'payment' => $enrollment->paymentSummary(),
            'installments' => $schedule->all(),
            'paid_count' => $schedule->flatMap(fn (array $installment) => $installment['payments'])->where('status', 'COMPLETED')->count(),
            'last_paid_at' => $enrollment->getAttribute('last_paid_at'),
            'owed' => round($owedInTab->sum(fn (array $installment) => $installment['amount_due'] - $installment['paid']), 2),
            'owed_installments' => $owedInTab->count(),
            'first_owed_due_date' => $firstOwedDueDate,
            'days_overdue' => $tab === IndexTransactionRequest::TAB_OVERDUE && $firstOwedDueDate
                ? (int) $today->diffInDays($firstOwedDueDate, true)
                : 0,
        ];
    }

    /**
     * How many students owe under a tab, and how much they owe in total.
     *
     * @param  array<string, mixed>  $filters
     * @return array{count: int, total: float}
     */
    private function owedSummary(string $tab, array $filters, CarbonInterface $today): array
    {
        $installments = Installment::query()
            ->when(
                $tab === IndexTransactionRequest::TAB_OVERDUE,
                fn (Builder $query) => $query->overdue($today),
                fn (Builder $query) => $query->receivable($today),
            )
            ->whereIn('billing_contract_id', BillingContract::query()
                ->whereIn('enrollment_id', $this->filteredEnrollmentIds($filters))
                ->select('id'))
            ->withPaidAmount()
            ->get(['installments.id', 'installments.billing_contract_id', 'installments.amount_due']);

        return [
            'count' => $installments->unique('billing_contract_id')->count(),
            'total' => round($installments->sum(fn (Installment $installment) => (float) $installment->amount_due - (float) $installment->getAttribute('paid_amount')), 2),
        ];
    }
}
