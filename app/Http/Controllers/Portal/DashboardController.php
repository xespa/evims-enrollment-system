<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $enrollee = Auth::guard('enrollee')->user();

        $enrollments = $enrollee->enrollments()
            ->with('student', 'gradeLevel', 'billingContract.installments.payments', 'officeVerification')
            ->latest()
            ->get()
            ->map(function (Enrollment $enrollment) {
                $enrollment->payment_url = $enrollment->enrollment_status === 'APPROVED'
                    ? URL::signedRoute('payments.show', $enrollment->id)
                    : null;

                if ($enrollment->billingContract) {
                    $totalBilled = (float) $enrollment->billingContract->total_fee;
                    $totalPaid = $enrollment->billingContract->installments->sum(
                        fn ($installment) => $installment->payments->where('status', 'COMPLETED')->sum('amount')
                    );

                    $enrollment->total_billed = $totalBilled;
                    $enrollment->remaining_balance = round($totalBilled - $totalPaid, 2);
                } else {
                    $enrollment->total_billed = null;
                    $enrollment->remaining_balance = null;
                }

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

    /**
     * Upload (or replace) one of the enrollment's supporting documents.
     * Allowed any time before the application is approved.
     */
    public function uploadDocument(Request $request, Enrollment $enrollment, string $type): RedirectResponse
    {
        abort_unless($enrollment->enrollee_user_id === Auth::guard('enrollee')->id(), 403);

        $columns = [
            'form_138' => ['path' => 'form_138_path', 'verified' => 'has_form_138'],
            'birth_certificate' => ['path' => 'birth_certificate_path', 'verified' => 'has_birth_certificate'],
            'good_moral' => ['path' => 'good_moral_path', 'verified' => 'has_good_moral_certificate'],
        ];

        if ($enrollment->enrollment_status === 'APPROVED') {
            return back()->withErrors(['document' => 'This application is already approved; documents can no longer be changed.']);
        }

        $request->validate([
            'file' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
        ]);

        $verification = $enrollment->officeVerification()->firstOrCreate([]);
        $pathColumn = $columns[$type]['path'];
        $verifiedColumn = $columns[$type]['verified'];

        if ($verification->{$pathColumn}) {
            Storage::disk('public')->delete($verification->{$pathColumn});
        }

        $verification->update([
            $pathColumn => $request->file('file')->store('documents', 'public'),
            // A freshly uploaded file hasn't been looked at yet — clear any
            // prior verification so the registrar knows to re-check it.
            $verifiedColumn => false,
        ]);

        return back()->with('success', 'Document uploaded. The registrar will review it shortly.');
    }
}
