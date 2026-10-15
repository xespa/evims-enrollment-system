<?php

namespace App\Http\Controllers\Student;

use App\Actions\GradeSheets\GenerateGradeReport;
use App\Http\Controllers\Controller;
use App\Models\StudentAccount;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * The signed-in student's grade report saved as a PDF file, the same one
 * GradeReportController shows in the browser.
 */
class GradeReportDownloadController extends Controller
{
    public function __invoke(Request $request, GenerateGradeReport $generateGradeReport): Response
    {
        /** @var StudentAccount $account */
        $account = $request->user('student');

        // Grades stay hidden until a password the school reset is changed.
        if ($account->must_change_password) {
            return redirect()->route('student.dashboard');
        }

        $student = $account->student;

        return $generateGradeReport->handle($student)->download($generateGradeReport->filename($student));
    }
}
