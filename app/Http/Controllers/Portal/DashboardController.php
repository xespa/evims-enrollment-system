<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\OfficeVerification;
use App\Models\User;
use App\Notifications\ApplicationCancelled;
use App\Notifications\DocumentUploaded;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Notification;
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
            ->with(
                'student',
                'gradeLevel',
                'billingContract.installments.payments',
                'officeVerification',
                'documentAppointment:id,enrollment_id,scheduled_on,scheduled_time,documents,note',
            )
            ->latest()
            ->get()
            ->map(function (Enrollment $enrollment) {
                // Only GCash payers get the online payment page; counter
                // payers are shown the cashier instructions instead.
                $enrollment->payment_url = $enrollment->enrollment_status === 'APPROVED'
                    && $enrollment->billingContract?->paysOnline()
                    ? URL::signedRoute('payments.show', $enrollment->id)
                    : null;

                $enrollment->setAttribute('rejection_details', $enrollment->rejectionDetails());
                $enrollment->setAttribute('is_returning', $enrollment->isReturning());

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

        Notification::send(User::query()->admins()->get(), new ApplicationCancelled($enrollment));

        return back()->with('success', 'Your application has been cancelled.');
    }

    /**
     * Upload (or replace) one of the enrollment's supporting documents.
     * Allowed any time before the application is approved.
     */
    public function uploadDocument(Request $request, Enrollment $enrollment, string $type): RedirectResponse
    {
        abort_unless($enrollment->enrollee_user_id === Auth::guard('enrollee')->id(), 403);

        if ($enrollment->enrollment_status === 'APPROVED') {
            return back()->withErrors(['document' => 'This application is already approved; documents can no longer be changed.']);
        }

        if ($enrollment->isCancelled()) {
            return back()->withErrors(['document' => 'This application was cancelled; documents can no longer be uploaded.']);
        }

        if ($type === 'form_138' && $enrollment->isReturning()) {
            return back()->withErrors(['document' => 'The registrar attaches the latest Form 138 for returning students, so there’s no need to upload it.']);
        }

        $request->validate([
            'file' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
        ]);

        $verification = $enrollment->officeVerification()->firstOrCreate([]);
        $pathColumn = OfficeVerification::DOCUMENT_COLUMNS[$type]['path'];
        $verifiedColumn = OfficeVerification::DOCUMENT_COLUMNS[$type]['verified'];

        if ($verification->{$pathColumn}) {
            Storage::disk('public')->delete($verification->{$pathColumn});
        }

        $verification->update([
            $pathColumn => $request->file('file')->store('documents', 'public'),
            // A freshly uploaded file hasn't been looked at yet — clear any
            // prior verification so the registrar knows to re-check it.
            $verifiedColumn => false,
        ]);

        Notification::send(User::query()->admins()->get(), new DocumentUploaded($enrollment, $type));

        return back()->with('success', 'Document uploaded. The registrar will review it shortly.');
    }
}
