<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Enrollment\GenerateEnrollmentSummary;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ShowEnrollmentSummaryRequest;
use Symfony\Component\HttpFoundation\Response;

/**
 * The printable enrollment summary: enrolled boys and girls per level for
 * one school year. Opened in the browser rather than downloaded, so staff
 * can print it straight away.
 */
class EnrollmentSummaryController extends Controller
{
    public function __invoke(ShowEnrollmentSummaryRequest $request, GenerateEnrollmentSummary $enrollmentSummary): Response
    {
        $schoolYear = $request->schoolYear();

        return $enrollmentSummary->handle($schoolYear)->stream($enrollmentSummary->filename($schoolYear));
    }
}
