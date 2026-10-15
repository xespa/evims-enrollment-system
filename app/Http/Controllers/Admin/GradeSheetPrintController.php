<?php

namespace App\Http\Controllers\Admin;

use App\Actions\GradeSheets\GenerateGradeSheet;
use App\Http\Controllers\Controller;
use App\Models\GradeSheet;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\Response;

/**
 * The printable grade sheet, opened in the browser rather than downloaded
 * so the teacher can print it straight away.
 */
class GradeSheetPrintController extends Controller
{
    public function __invoke(GradeSheet $gradeSheet, GenerateGradeSheet $generateGradeSheet): Response
    {
        Gate::authorize('view', $gradeSheet);

        return $generateGradeSheet->handle($gradeSheet)->stream($generateGradeSheet->filename($gradeSheet));
    }
}
