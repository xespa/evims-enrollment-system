<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $totalEnrollments = Enrollment::count();

        $statusBreakdown = Enrollment::select('enrollment_status', DB::raw('count(*) as total'))
            ->groupBy('enrollment_status')
            ->pluck('total', 'enrollment_status');

        $enrollmentsByGrade = GradeLevel::withCount('enrollments')
            ->orderBy('level_order')
            ->get(['id', 'name'])
            ->map(fn ($grade) => [
                'name' => $grade->name,
                'count' => $grade->enrollments_count,
            ]);

        $totalBilled = DB::table('billing_contracts')->sum('total_fee');

        $totalCollected = Payment::where('status', 'COMPLETED')->sum('amount');

        $paymentMethodBreakdown = Payment::where('status', 'COMPLETED')
            ->select('method', DB::raw('sum(amount) as total'), DB::raw('count(*) as count'))
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
                'totalEnrollments' => $totalEnrollments,
                'statusBreakdown' => $statusBreakdown,
                'enrollmentsByGrade' => $enrollmentsByGrade,
                'totalBilled' => (float) $totalBilled,
                'totalCollected' => (float) $totalCollected,
                'paymentMethodBreakdown' => $paymentMethodBreakdown,
            ],
            'recentEnrollments' => $recentEnrollments,
            'recentPayments' => $recentPayments,
        ]);
    }
}
