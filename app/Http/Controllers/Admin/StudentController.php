<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class StudentController extends Controller
{
    public function index(Request $request)
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
            ->with(['student', 'gradeLevel', 'officeVerification'])
            ->select('enrollments.*')
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

        if ($request->filled('grade_level_id')) {
            $query->where('enrollments.grade_level_id', $request->integer('grade_level_id'));
        }

        $applications = $query->paginate(15)->withQueryString();

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
