<?php

namespace App\Http\Controllers\Admin;

use App\Actions\GradeSheets\GenerateGradeReport;
use App\Http\Controllers\Controller;
use App\Models\StudentGrade;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\Response;

/**
 * One student's report card for the grade sheet's school year, with every
 * subject, opened in the browser so the teacher can view or print it.
 */
class StudentReportCardController extends Controller
{
    public function __invoke(StudentGrade $studentGrade, GenerateGradeReport $generateGradeReport): Response
    {
        Gate::authorize('view', $studentGrade->gradeSheet);

        $student = $studentGrade->enrollment->student;
        $schoolYear = $studentGrade->enrollment->school_year;

        return $generateGradeReport->handle($student, $schoolYear)
            ->stream('report-card-'.($student->lrn ?? $student->id)."-{$schoolYear}.pdf");
    }
}
