<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BillingContract;
use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\Installment;
use App\Models\Payment;
use Closure;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * How many months back the collections trend goes, this month included.
     */
    private const TREND_MONTHS = 6;

    public function index(Request $request): Response
    {
        // Same default as the Students page: the newest school year anyone
        // has applied for; an empty value means every school year.
        $schoolYear = $request->has('school_year')
            ? $request->string('school_year')->toString()
            : Enrollment::max('school_year');

        $inSchoolYear = fn (Builder $query): Builder => $query
            ->when(filled($schoolYear), fn (Builder $query) => $query->where($query->qualifyColumn('school_year'), $schoolYear));

        // Cancelled applications are counted on their own and left out of
        // everything else, since they were never going to be billed.
        $activeEnrollments = fn (Builder $query): Builder => $inSchoolYear($query)->whereNull($query->qualifyColumn('cancelled_at'));

        $statusBreakdown = Enrollment::query()
            ->tap($activeEnrollments)
            ->selectRaw('enrollment_status, count(*) as count')
            ->groupBy('enrollment_status')
            ->pluck('count', 'enrollment_status');

        $enrollmentsByGrade = GradeLevel::query()
            ->withCount(['enrollments' => $activeEnrollments])
            ->orderBy('level_order')
            ->get()
            ->map(fn (GradeLevel $gradeLevel) => [
                'name' => $gradeLevel->name,
                'count' => $gradeLevel->enrollments_count,
            ]);

        $completedPayments = fn (): Builder => Payment::query()
            ->where('status', 'COMPLETED')
            ->whereHas('enrollment', $activeEnrollments);

        $totalBilled = (float) BillingContract::query()
            ->whereHas('enrollment', $activeEnrollments)
            ->sum('total_fee');
        $totalCollected = (float) $completedPayments()->sum('amount');

        $overdueInstallments = Installment::query()
            ->where('status', '!=', 'PAID')
            ->whereDate('due_date', '<', now('Asia/Manila')->toDateString())
            ->whereHas('billingContract.enrollment', $activeEnrollments)
            ->withSum(['payments as paid_amount' => fn ($payments) => $payments->where('status', 'COMPLETED')], 'amount')
            ->with('billingContract:id,enrollment_id')
            ->get();

        return Inertia::render('Admin/Dashboard', [
            'filters' => ['school_year' => $schoolYear ?? ''],
            'schoolYears' => Enrollment::query()
                ->select('school_year')
                ->distinct()
                ->orderByDesc('school_year')
                ->pluck('school_year'),
            'stats' => [
                'totalEnrollments' => Enrollment::query()->tap($activeEnrollments)->count(),
                'cancelledEnrollments' => Enrollment::query()->tap($inSchoolYear)->whereNotNull('cancelled_at')->count(),
                'statusBreakdown' => $statusBreakdown,
                'totalBilled' => $totalBilled,
                'totalCollected' => $totalCollected,
                'overdue' => [
                    'installments' => $overdueInstallments->count(),
                    'families' => $overdueInstallments->pluck('billingContract.enrollment_id')->unique()->count(),
                    'amount' => round($overdueInstallments->sum(
                        fn (Installment $installment) => max(0, (float) $installment->amount_due - (float) $installment->getAttribute('paid_amount')),
                    ), 2),
                ],
                'enrollmentsByGrade' => $enrollmentsByGrade,
                'paymentMethodBreakdown' => $completedPayments()
                    ->selectRaw('method, count(*) as count, sum(amount) as total')
                    ->groupBy('method')
                    ->get(),
                'monthlyCollections' => $this->monthlyCollections($completedPayments),
            ],
            'recentEnrollments' => Enrollment::query()
                ->tap($inSchoolYear)
                ->with('student', 'gradeLevel')
                ->latest()
                ->limit(5)
                ->get(),
            'recentPayments' => $completedPayments()
                ->with('enrollment.student')
                ->latest('paid_at')
                ->limit(5)
                ->get(),
        ]);
    }

    /**
     * Money collected in each of the last few months, oldest first, with
     * empty months included so the trend has no gaps. Grouped in PHP (not
     * SQL) so it works the same on every database.
     *
     * @param  Closure(): Builder<Payment>  $completedPayments
     * @return array<int, array{month: string, label: string, total: float}>
     */
    private function monthlyCollections(Closure $completedPayments): array
    {
        $start = now('Asia/Manila')->startOfMonth()->subMonths(self::TREND_MONTHS - 1);

        $totals = $completedPayments()
            ->where('paid_at', '>=', $start->copy()->utc())
            ->get(['amount', 'paid_at'])
            ->groupBy(fn (Payment $payment) => $payment->paid_at->setTimezone('Asia/Manila')->format('Y-m'))
            ->map(fn ($payments) => round((float) $payments->sum('amount'), 2));

        return collect(range(0, self::TREND_MONTHS - 1))
            ->map(function (int $offset) use ($start, $totals) {
                /** @var Carbon $month */
                $month = $start->copy()->addMonths($offset);

                return [
                    'month' => $month->format('Y-m'),
                    'label' => $month->format('M Y'),
                    'total' => $totals->get($month->format('Y-m'), 0.0),
                ];
            })
            ->all();
    }
}
