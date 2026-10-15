<?php

namespace App\Http\Controllers\Admin;

use App\Actions\GradeSheets\SendGradesToNextApplication;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreReportCardRequest;
use App\Models\Curriculum;
use App\Models\User;
use Illuminate\Http\RedirectResponse;

/**
 * Teachers send a school year's grades on to their students' applications
 * for the next year, from "Send grades" on a grade sheet: each student's
 * report card, made from every subject's grade sheet, becomes that
 * application's Form 138.
 */
class ReportCardController extends Controller
{
    public function store(StoreReportCardRequest $request, SendGradesToNextApplication $sendGrades): RedirectResponse
    {
        /** @var User $staff */
        $staff = $request->user();
        $sent = 0;

        foreach ($request->enrollments() as $enrollment) {
            $nextApplication = $enrollment->nextApplication();

            if ($nextApplication !== null) {
                $sendGrades->handle($enrollment, $nextApplication, $staff);
                $sent++;
            }
        }

        $nextSchoolYear = Curriculum::nextSchoolYear($request->string('school_year')->toString());

        return back()->with('success', ($sent === 1 ? '1 student\'s grades' : "{$sent} students' grades")
            ." sent to their S.Y. {$nextSchoolYear} application as the Form 138.");
    }
}
