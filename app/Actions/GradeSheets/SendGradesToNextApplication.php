<?php

namespace App\Actions\GradeSheets;

use App\Actions\Enrollment\StoreEnrollmentDocument;
use App\Models\Curriculum;
use App\Models\Enrollment;
use App\Models\GradeSheet;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Sends a student's grades on to their next school year: that year's
 * Learner's Performance Report, made from every subject's grade sheet, is
 * put on the next application as its Form 138, already verified since the
 * school issued it.
 */
class SendGradesToNextApplication
{
    public function __construct(
        private GenerateGradeReport $generateGradeReport,
        private StoreEnrollmentDocument $storeDocument,
    ) {}

    /**
     * The approved students of the school year whose grades the staff member
     * can send on: those they grade who have applied for the next year.
     *
     * @return Builder<Enrollment>
     */
    public static function candidatesQuery(User $staff, string $schoolYear): Builder
    {
        return Enrollment::query()
            ->where('enrollments.school_year', $schoolYear)
            ->withStatus('APPROVED')
            ->archived(false)
            ->gradedBy($staff)
            ->appliedAgainFor(Curriculum::nextSchoolYear($schoolYear));
    }

    /**
     * What a grade sheet's "Send grades" dialog shows: its students who
     * applied for the next school year, each with their general average,
     * the learning areas still missing a final grade, and whether their
     * next application already has a Form 138.
     *
     * @return array{school_year: string, next_school_year: string, not_yet_applied_count: int, students: list<array{id: int, name: string, lrn: string|null, section: string|null, general_average: float|null, missing_final_grades: list<string>, next_application: array{grade_level: string, status: string, has_form_138: bool}}>}
     */
    public static function forGradeSheet(GradeSheet $gradeSheet, User $staff): array
    {
        $schoolYear = $gradeSheet->subject->curriculum->school_year;
        $nextSchoolYear = Curriculum::nextSchoolYear($schoolYear);
        $onThisSheet = fn (Builder $studentGrades) => $studentGrades->where('grade_sheet_id', $gradeSheet->id);

        $enrollments = self::candidatesQuery($staff, $schoolYear)
            ->whereHas('studentGrades', $onThisSheet)
            ->with(['student', 'section:id,name', 'subjects:id,name', ...Enrollment::GRADE_REPORT_RELATIONS])
            ->get()
            ->sortBy(fn (Enrollment $enrollment) => $enrollment->student->full_name, SORT_NATURAL | SORT_FLAG_CASE)
            ->values();

        // Each student's application for the next year, in one query.
        $nextApplications = Enrollment::query()
            ->where('school_year', $nextSchoolYear)
            ->whereIn('student_id', $enrollments->pluck('student_id'))
            ->holdingSlot()
            ->with(['gradeLevel:id,name', 'officeVerification:id,enrollment_id,form_138_path'])
            ->orderBy('id')
            ->get()
            ->keyBy('student_id');

        $approvedOnSheet = Enrollment::query()
            ->withStatus('APPROVED')
            ->archived(false)
            ->whereHas('studentGrades', $onThisSheet)
            ->count();

        return [
            'school_year' => $schoolYear,
            'next_school_year' => $nextSchoolYear,
            'not_yet_applied_count' => max(0, $approvedOnSheet - $enrollments->count()),
            'students' => array_values($enrollments->map(function (Enrollment $enrollment) use ($nextApplications): array {
                /** @var Enrollment $nextApplication */
                $nextApplication = $nextApplications->get($enrollment->student_id);

                return [
                    'id' => $enrollment->id,
                    'name' => $enrollment->student->full_name,
                    'lrn' => $enrollment->student->lrn,
                    'section' => $enrollment->section?->name,
                    'general_average' => Enrollment::generalAverage($enrollment->gradeReport()),
                    'missing_final_grades' => $enrollment->subjectsWithoutFinalGrade(),
                    'next_application' => [
                        'grade_level' => $nextApplication->gradeLevel->name,
                        'status' => $nextApplication->enrollment_status,
                        'has_form_138' => $nextApplication->officeVerification?->form_138_path !== null,
                    ],
                ];
            })->all()),
        ];
    }

    public function handle(Enrollment $enrollment, Enrollment $nextApplication, User $staff): void
    {
        $path = 'documents/'.Str::uuid().'.pdf';

        Storage::disk('public')->put(
            $path,
            $this->generateGradeReport->handle($enrollment->student, $enrollment->school_year)->output(),
        );

        $this->storeDocument->handle($nextApplication, 'form_138', $path, $staff, [
            'sent_from_school_year' => $enrollment->school_year,
        ]);
    }
}
