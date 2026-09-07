<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\URL;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $enrollee = Auth::guard('enrollee')->user();

        $enrollments = $enrollee->enrollments()
            ->with('student', 'gradeLevel', 'billingContract.installments')
            ->latest()
            ->get()
            ->map(function (Enrollment $enrollment) {
                $enrollment->payment_url = $enrollment->enrollment_status === 'APPROVED'
                    ? URL::signedRoute('payments.show', $enrollment->id)
                    : null;

                return $enrollment;
            });

        return Inertia::render('Portal/Dashboard', [
            'enrollments' => $enrollments,
        ]);
    }

    public function cancel(Enrollment $enrollment): RedirectResponse
    {
        abort_unless($enrollment->enrollee_user_id === Auth::guard('enrollee')->id(), 403);

        if ($enrollment->enrollment_status !== 'PENDING') {
            return back()->withErrors(['enrollment' => 'Only pending applications can be cancelled.']);
        }

        $enrollment->update(['cancelled_at' => now()]);

        return back()->with('success', 'Your application has been cancelled.');
    }
}
