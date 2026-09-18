<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\EnrollmentStatusUpdated;
use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\Installment;
use App\Models\Payment;
use App\Notifications\DocumentReminder;
use App\Notifications\EnrollmentStatusChanged;
use App\Notifications\PaymentReceived;
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

    public function index(Request $request)
    {
        $query = Enrollment::with(['student', 'gradeLevel', 'officeVerification'])
            ->latest();

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->whereHas('student', function ($q) use ($search) {
                $q->where('last_name', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('lrn', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('enrollment_status', $request->string('status'));
        }

        if ($request->filled('grade_level_id')) {
            $query->where('grade_level_id', $request->integer('grade_level_id'));
        }

        if ($request->filled('school_year')) {
            $query->where('school_year', $request->string('school_year'));
        }

        $enrollments = $query->paginate(15)->withQueryString();

        return Inertia::render('Admin/Enrollments/Index', [
            'enrollments' => $enrollments,
            'gradeLevels' => GradeLevel::orderBy('level_order')->get(['id', 'name']),
            'filters' => $request->only(['search', 'status', 'grade_level_id', 'school_year']),
        ]);
    }

    public function show(Enrollment $enrollment)
    {
        $enrollment->load([
            'student.address',
            'student.parentProfile',
            'gradeLevel',
            'subjects',
            'academicHistory',
            'vitalInformation',
            'billingContract.installments.payments',
            'officeVerification',
        ]);

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
            return back()->withErrors(['reminder' => 'This application has no linked parent portal account to notify.']);
        }

        $documentLabel = self::DOCUMENT_LABELS[self::DOCUMENT_TYPES[$type]];
        $reasonText = self::REMINDER_REASONS[$validated['reason']] ?? $validated['note'];
        $note = $validated['reason'] === 'OTHER' ? null : ($validated['note'] ?? null);

        $enrollment->enrolleeUser->notify(new DocumentReminder($enrollment, $documentLabel, $reasonText, $note));

        return back()->with('success', "Reminder sent about the {$documentLabel}.");
    }

    public function recordCashPayment(Request $request, Enrollment $enrollment)
    {
        $validated = $request->validate([
            'installment_id' => ['required', 'exists:installments,id'],
            'amount' => ['required', 'numeric', 'min:0.01'],
        ]);

        $installment = Installment::findOrFail($validated['installment_id']);

        // Guard: don't allow paying more than what's actually still owed on this installment
        $remaining = $installment->amount_due - $installment->totalPaid();
        if ($validated['amount'] > $remaining) {
            return back()->withErrors(['amount' => "Amount exceeds remaining balance of ₱{$remaining} for this installment."]);
        }

        $payment = Payment::create([
            'installment_id' => $installment->id,
            'enrollment_id' => $enrollment->id,
            'amount' => $validated['amount'],
            'method' => 'CASH',
            'status' => 'COMPLETED',
            'recorded_by' => $request->user()->id,
            'paid_at' => now(),
        ]);

        $installment->refreshStatus();

        $enrollment->loadMissing('student', 'enrolleeUser');
        $payment->setRelation('enrollment', $enrollment);
        $enrollment->enrolleeUser?->notify(new PaymentReceived($payment));

        return back()->with('success', 'Cash payment recorded.');
    }
}
