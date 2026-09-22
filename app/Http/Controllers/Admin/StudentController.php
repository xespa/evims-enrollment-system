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

        $query = Student::with(['latestEnrollment.gradeLevel', 'latestEnrollment.officeVerification'])
            ->orderBy('last_name')
            ->orderBy('first_name');

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(function ($q) use ($search) {
                $q->where('last_name', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('lrn', 'like', "%{$search}%");
            });
        }

        if (filled($schoolYear)) {
            $query->whereHas('latestEnrollment', fn ($q) => $q->where('school_year', $schoolYear));
        }

        if ($request->filled('grade_level_id')) {
            $gradeLevelId = $request->integer('grade_level_id');
            $query->whereHas('latestEnrollment', fn ($q) => $q->where('grade_level_id', $gradeLevelId));
        }

        $students = $query->paginate(15)->withQueryString();

        return Inertia::render('Admin/Students/Index', [
            'students' => $students,
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
