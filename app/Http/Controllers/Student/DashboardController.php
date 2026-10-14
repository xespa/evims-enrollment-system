<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\StudentAccount;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * The signed-in student's home: who they are and their current class.
     * Grades will be listed here once teachers encode gradesheets.
     */
    public function __invoke(Request $request): Response
    {
        /** @var StudentAccount $account */
        $account = $request->user('student');
        $student = $account->student;
        $enrollment = $student->latestApprovedEnrollment()?->load('gradeLevel:id,name');

        return Inertia::render('Student/Dashboard', [
            'student' => [
                'first_name' => $student->first_name,
                'last_name' => $student->last_name,
                'lrn' => $student->lrn,
                'grade_level' => $enrollment?->gradeLevel?->name,
                'school_year' => $enrollment?->school_year,
            ],
        ]);
    }
}
