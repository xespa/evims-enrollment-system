<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BillingContract;
use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\Payment;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $statusBreakdown = Enrollment::selectRaw('enrollment_status, count(*) as count')
            ->groupBy('enrollment_status')
            ->pluck('count', 'enrollment_status');

        $enrollmentsByGrade = GradeLevel::withCount('enrollments')
            ->orderBy('level_order')
            ->get()
            ->map(fn ($gradeLevel) => [
                'name' => $gradeLevel->name,
                'count' => $gradeLevel->enrollments_count,
            ]);

        $paymentMethodBreakdown = Payment::where('status', 'COMPLETED')
            ->selectRaw('method, count(*) as count, sum(amount) as total')
            ->groupBy('method')
            ->get();

        $recentEnrollments = Enrollment::with('student', 'gradeLevel')
            ->latest()
            ->limit(5)
            ->get();

        $recentPayments = Payment::with('enrollment.student')
            ->where('status', 'COMPLETED')
            ->latest('paid_at')
            ->limit(5)
            ->get();

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'totalEnrollments' => Enrollment::count(),
                'statusBreakdown' => $statusBreakdown,
                'totalBilled' => BillingContract::sum('total_fee'),
                'totalCollected' => Payment::where('status', 'COMPLETED')->sum('amount'),
                'enrollmentsByGrade' => $enrollmentsByGrade,
                'paymentMethodBreakdown' => $paymentMethodBreakdown,
            ],
            'recentEnrollments' => $recentEnrollments,
            'recentPayments' => $recentPayments,
        ]);
    }
}
