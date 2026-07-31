<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\GradeLevel;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EnrollmentManagementController extends Controller
{
    public function index(Request $request)
    {
        $query = Enrollment::with(['student', 'gradeLevel'])
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

        return Inertia::render('Admin/admissionments/Index', [
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

        return Inertia::render('Admin/admissionments/Show', [
            'enrollment' => $enrollment,
        ]);
    }

    public function updateStatus(Request $request, Enrollment $enrollment)
    {
        $validated = $request->validate([
            'enrollment_status' => ['required', 'in:PENDING,APPROVED,REJECTED'],
        ]);

        $enrollment->update($validated);

        return back()->with('success', 'Enrollment status updated.');
    }

    public function updateVerification(Request $request, Enrollment $enrollment)
    {
        $validated = $request->validate([
            'has_form_138' => ['boolean'],
            'has_birth_certificate' => ['boolean'],
            'has_good_moral_certificate' => ['boolean'],
        ]);

        $enrollment->officeVerification()->update([
            ...$validated,
            'verified_by' => $request->user()->id,
            'verified_at' => now(),
        ]);

        return back()->with('success', 'Document verification updated.');
    }

    public function recordCashPayment(Request $request, Enrollment $enrollment)
    {
        $validated = $request->validate([
            'installment_id' => ['required', 'exists:installments,id'],
            'amount' => ['required', 'numeric', 'min:0.01'],
        ]);

        $installment = \App\Models\Installment::findOrFail($validated['installment_id']);

        // Guard: don't allow paying more than what's actually still owed on this installment
        $remaining = $installment->amount_due - $installment->totalPaid();
        if ($validated['amount'] > $remaining) {
            return back()->withErrors(['amount' => "Amount exceeds remaining balance of ₱{$remaining} for this installment."]);
        }

        \App\Models\Payment::create([
            'installment_id' => $installment->id,
            'enrollment_id' => $enrollment->id,
            'amount' => $validated['amount'],
            'method' => 'CASH',
            'status' => 'COMPLETED',
            'recorded_by' => $request->user()->id,
            'paid_at' => now(),
        ]);

        $installment->refreshStatus();

        return back()->with('success', 'Cash payment recorded.');
    }
}
