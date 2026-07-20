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

        return Inertia::render('Admin/Enrollments/Index', [
            'enrollments' => $enrollments,
            'gradeLevels' => GradeLevel::orderBy('level_order')->get(['id', 'name']),
            'filters' => $request->only(['search', 'status', 'grade_level_id', 'school_year']),
        ]);
    }
}
