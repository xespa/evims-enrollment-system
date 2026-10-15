<?php

namespace App\Http\Controllers\Admin;

use App\Actions\GradeSheets\SendGradesToNextApplication;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexReportCardRequest;
use App\Http\Requests\Admin\StoreReportCardRequest;
use App\Models\Curriculum;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Teachers send a school year's grades on to their students' applications
 * for the next year: each student's report card, made from every subject's
 * grade sheet, becomes that application's Form 138.
 */
class ReportCardController extends Controller
{
    public function index(IndexReportCardRequest $request): Response
    {
        /** @var User $staff */
        $staff = $request->user();
        $schoolYear = $request->schoolYear();
        $nextSchoolYear = Curriculum::nextSchoolYear($schoolYear);

        $enrollments = SendGradesToNextApplication::candidatesQuery($staff, $schoolYear)
            ->with(['student', 'gradeLevel:id,name,level_order', 'section:id,name', 'subjects:id,name', ...Enrollment::GRADE_REPORT_RELATIONS])
            ->get()
            ->sortBy([
                fn (Enrollment $a, Enrollment $b) => $a->gradeLevel->level_order <=> $b->gradeLevel->level_order,
                fn (Enrollment $a, Enrollment $b) => strnatcasecmp($a->student->full_name, $b->student->full_name),
            ]);

        // Each student's application for the next year, in one query.
        $nextApplications = Enrollment::query()
            ->where('school_year', $nextSchoolYear)
            ->whereIn('student_id', $enrollments->pluck('student_id'))
            ->holdingSlot()
            ->with(['gradeLevel:id,name', 'officeVerification:id,enrollment_id,form_138_path'])
            ->orderBy('id')
            ->get()
            ->keyBy('student_id');

        return Inertia::render('Admin/ReportCards/Index', [
            'students' => $enrollments->map(function (Enrollment $enrollment) use ($nextApplications) {
                /** @var Enrollment $nextApplication */
                $nextApplication = $nextApplications->get($enrollment->student_id);

                return [
                    'id' => $enrollment->id,
                    'name' => $enrollment->student->full_name,
                    'lrn' => $enrollment->student->lrn,
                    'grade_level' => $enrollment->gradeLevel->name,
                    'section' => $enrollment->section?->name,
                    'general_average' => Enrollment::generalAverage($enrollment->gradeReport()),
                    'missing_final_grades' => $enrollment->subjectsWithoutFinalGrade(),
                    'next_application' => [
                        'id' => $nextApplication->id,
                        'grade_level' => $nextApplication->gradeLevel->name,
                        'status' => $nextApplication->enrollment_status,
                        'has_form_138' => $nextApplication->officeVerification?->form_138_path !== null,
                    ],
                ];
            })->values(),
            // Students they grade who haven't applied for the next year yet.
            'notYetAppliedCount' => Enrollment::query()
                ->where('enrollments.school_year', $schoolYear)
                ->withStatus('APPROVED')
                ->archived(false)
                ->gradedBy($staff)
                ->count() - $enrollments->count(),
            'schoolYear' => $schoolYear,
            'nextSchoolYear' => $nextSchoolYear,
            'schoolYears' => Curriculum::schoolYears(),
        ]);
    }

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
