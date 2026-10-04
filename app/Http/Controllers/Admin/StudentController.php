<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexStudentRequest;
use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class StudentController extends Controller
{
    public function index(IndexStudentRequest $request): Response
    {
        $latestSchoolYear = Enrollment::max('school_year');

        $schoolYear = $request->has('school_year')
            ? $request->string('school_year')->toString()
            : $latestSchoolYear;

        // Driven from Enrollment rather than Student so each application is
        // its own row — a returning student's earlier application (e.g. last
        // year's Kinder entry) stays visible when the School Year filter is
        // switched back, instead of always collapsing to their latest one.
        $query = Enrollment::query()
            ->join('students', 'students.id', '=', 'enrollments.student_id')
            ->with([
                'student',
                'gradeLevel',
                'officeVerification',
                ...Enrollment::paymentSummaryRelations(),
            ])
            ->select('enrollments.*')
            ->withParentEmailVerified()
            ->orderBy('students.last_name')
            ->orderBy('students.first_name')
            ->orderByDesc('enrollments.school_year');

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(function ($q) use ($search) {
                $q->where('students.last_name', 'like', "%{$search}%")
                    ->orWhere('students.first_name', 'like', "%{$search}%")
                    ->orWhere('students.lrn', 'like', "%{$search}%");
            });
        }

        if (filled($schoolYear)) {
            $query->where('enrollments.school_year', $schoolYear);
        }

        $showArchived = $request->boolean('archived');
        $query->archived($showArchived);

        if ($request->filled('grade_level_id')) {
            $query->where('enrollments.grade_level_id', $request->integer('grade_level_id'));
        }

        $query
            ->when($request->filled('sex'), fn ($query) => $query->where('students.sex', $request->string('sex')->toString()))
            ->when($request->filled('status'), fn ($query) => $query->withStatus($request->string('status')->toString()))
            ->when($request->filled('student_type'), fn ($query) => $query->where('enrollments.student_type', $request->string('student_type')->toString()));

        $applications = $query->paginate(15)->withQueryString()
            ->through(function (Enrollment $enrollment) {
                $enrollment->setAttribute('payment', $enrollment->paymentSummary());

                return $enrollment->unsetRelation('billingContract');
            });

        return Inertia::render('Admin/Students/Index', [
            'applications' => $applications,
            'gradeLevels' => GradeLevel::orderBy('level_order')->get(['id', 'name']),
            'schoolYears' => Enrollment::query()
                ->select('school_year')
                ->distinct()
                ->orderByDesc('school_year')
                ->pluck('school_year'),
            'filters' => [
                'search' => $request->string('search')->toString(),
                'school_year' => $schoolYear,
                'grade_level_id' => $request->string('grade_level_id')->toString(),
                'sex' => $request->string('sex')->toString(),
                'status' => $request->string('status')->toString(),
                'student_type' => $request->string('student_type')->toString(),
                'archived' => $showArchived,
            ],
        ]);
    }

    public function assignLrn(Request $request, Student $student)
    {
        if ($student->lrn) {
            return back()->withErrors(['lrn' => 'This student already has an LRN.']);
        }

        $validated = $request->validate([
            'lrn' => [
                'required',
                'regex:/^452501\d{8}$/',
                Rule::unique('students', 'lrn'),
            ],
        ], [
            'lrn.regex' => 'The LRN must be 14 digits starting with 452501.',
        ]);

        $student->update($validated);

        return back()->with('success', 'LRN assigned.');
    }
}
