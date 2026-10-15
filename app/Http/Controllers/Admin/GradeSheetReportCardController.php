<?php

namespace App\Http\Controllers\Admin;

use App\Actions\GradeSheets\GenerateGradeReport;
use App\Http\Controllers\Controller;
use App\Models\GradeSheet;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\Response;

/**
 * Every student on the grade sheet's report card for its school year, one
 * page each, downloaded as one PDF to print together.
 */
class GradeSheetReportCardController extends Controller
{
    public function __invoke(GradeSheet $gradeSheet, GenerateGradeReport $generateGradeReport): Response
    {
        Gate::authorize('view', $gradeSheet);

        return $generateGradeReport->handleForGradeSheet($gradeSheet)
            ->download($generateGradeReport->gradeSheetFilename($gradeSheet));
    }
}
