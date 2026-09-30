<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Payments\RecordCounterPayment;
use App\Http\Controllers\Controller;
use App\Mail\EnrollmentStatusUpdated;
use App\Models\Enrollment;
use App\Models\User;
use App\Notifications\DocumentReminder;
use App\Notifications\EnrollmentStatusChanged;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class EnrollmentManagementController extends Controller
{
    private const DOCUMENT_LABELS = [
        'form_138_path' => 'Form 138 (Report Card)',
        'birth_certificate_path' => 'PSA Birth Certificate',
        'good_moral_path' => 'Good Moral Certificate',
    ];

    private const DOCUMENT_TYPES = [
        'form_138' => 'form_138_path',
        'birth_certificate' => 'birth_certificate_path',
        'good_moral' => 'good_moral_path',
    ];

    private const REMINDER_REASONS = [
        'NOT_SUBMITTED' => 'This document has not been submitted yet.',
        'BLURRY' => 'The uploaded image is blurry or hard to read.',
        'WRONG_DOCUMENT' => 'The wrong document was uploaded.',
        'INCOMPLETE' => 'The document appears incomplete or is missing pages.',
        'EXPIRED' => 'The document is outdated and a current copy is needed.',
        'OTHER' => null,
    ];

    public function show(Enrollment $enrollment)
    {
        $enrollment->load([
            'student.address',
            'student.parentProfile',
            'gradeLevel',
            'subjects',
            'academicHistory',
            'vitalInformation',
            'billingContract.installments.payments.voidedBy:id,name',
            'officeVerification',
        ]);
        $enrollment->loadParentEmailVerified();

        return Inertia::render('Admin/Enrollments/Show', [
            'enrollment' => $enrollment,
        ]);
    }

    public function updateStatus(Request $request, Enrollment $enrollment)
    {
        $validated = $request->validate([
            'enrollment_status' => ['required', 'in:PENDING,APPROVED,REJECTED'],
        ]);

        $statusChanged = $enrollment->enrollment_status !== $validated['enrollment_status'];

        $enrollment->update($validated);

        if ($statusChanged && in_array($validated['enrollment_status'], ['APPROVED', 'REJECTED'])) {
            if ($enrollment->email) {
                Mail::to($enrollment->email)->send(new EnrollmentStatusUpdated($enrollment));
            }

            $enrollment->loadMissing('student', 'enrolleeUser');
            $enrollment->enrolleeUser?->notify(new EnrollmentStatusChanged($enrollment));
        }

        return back()->with('success', 'Enrollment status updated.');
    }

    public function updateVerification(Request $request, Enrollment $enrollment)
    {
        $validated = $request->validate([
            'has_form_138' => ['boolean'],
            'has_birth_certificate' => ['boolean'],
            'has_good_moral_certificate' => ['boolean'],
        ]);

        $enrollment->officeVerification()->updateOrCreate([], [
            ...$validated,
            'verified_by' => $request->user()->id,
            'verified_at' => now(),
        ]);

        return back()->with('success', 'Document verification updated.');
    }

    public function remindDocument(Request $request, Enrollment $enrollment, string $type)
    {
        $validated = $request->validate([
            'reason' => ['required', Rule::in(array_keys(self::REMINDER_REASONS))],
            'note' => ['nullable', 'string', 'max:500', 'required_if:reason,OTHER'],
        ]);

        $enrollment->loadMissing('student', 'enrolleeUser');

        if (! $enrollment->enrolleeUser) {
            return back()->withErrors(['reminder' => 'This application has no linked student portal account to notify.']);
        }

        $documentLabel = self::DOCUMENT_LABELS[self::DOCUMENT_TYPES[$type]];
        $reasonText = self::REMINDER_REASONS[$validated['reason']] ?? $validated['note'];
        $note = $validated['reason'] === 'OTHER' ? null : ($validated['note'] ?? null);

        $enrollment->enrolleeUser->notify(new DocumentReminder($enrollment, $documentLabel, $reasonText, $note));

        return back()->with('success', "Reminder sent about the {$documentLabel}.");
    }

    /**
     * Records a payment the parent made at the school cashier. The amount is
     * applied to unpaid installments in order, so their statuses update.
     */
    public function recordCashPayment(Request $request, Enrollment $enrollment, RecordCounterPayment $recordCounterPayment): RedirectResponse
    {
        $billingContract = $enrollment->billingContract()->with('installments.payments')->first();

        abort_unless($billingContract, 404);

        $remainingBalance = $billingContract->remainingBalance();
        $formattedBalance = number_format($remainingBalance, 2);

        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01', "max:{$remainingBalance}"],
            'receipt_number' => ['required', 'string', 'max:50'],
            'paid_on' => ['nullable', 'date', 'before_or_equal:today'],
        ], [
            'amount.max' => $remainingBalance > 0
                ? "The amount can't be more than the remaining balance of ₱{$formattedBalance}."
                : 'This application is already fully paid.',
            'paid_on.before_or_equal' => "The payment date can't be in the future.",
            'receipt_number.required' => 'Enter the OR number from the official receipt you issued.',
        ]);

        $paidOn = isset($validated['paid_on']) ? Carbon::parse($validated['paid_on']) : today();
        // Keep the time of day when it's recorded the same day it was paid.
        $paidAt = $paidOn->isToday() ? now() : $paidOn->startOfDay();

        /** @var User $admin Admin routes use the staff (web) guard. */
        $admin = $request->user();

        $payments = $recordCounterPayment->handle(
            $enrollment,
            (float) $validated['amount'],
            $validated['receipt_number'],
            $paidAt,
            $admin,
        );

        $formattedAmount = number_format((float) $validated['amount'], 2);
        $message = "Counter payment of ₱{$formattedAmount} recorded";
        $message .= $payments->count() > 1 ? " across {$payments->count()} installments." : '.';

        return back()->with('success', $message);
    }

    public function destroy(Enrollment $enrollment)
    {
        $enrollment->loadMissing('student');
        $studentName = trim("{$enrollment->student->first_name} {$enrollment->student->last_name}");

        // Deletes the enrollment row only — the student, parent profile, and
        // address stay intact. Everything specific to this one application
        // (academic history, vital info, billing/installments/payments,
        // office verification, subject picks) cascades away with it at the
        // database level.
        $enrollment->delete();

        return redirect()
            ->route('admin.students.index')
            ->with('success', "Application for {$studentName} was permanently deleted.");
    }
}
