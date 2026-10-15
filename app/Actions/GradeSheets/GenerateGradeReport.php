<?php

namespace App\Actions\GradeSheets;

use App\Concerns\EmbedsSchoolLogo;
use App\Models\Enrollment;
use App\Models\Student;
use Barryvdh\DomPDF\Facade\Pdf;
use Barryvdh\DomPDF\PDF as GradeReportPdf;
use Carbon\CarbonInterface;

/**
 * A student's grades on paper: every school year they were enrolled in,
 * newest first, with each subject's term grades, final grade and remarks
 * from the teachers' grade sheets.
 */
class GenerateGradeReport
{
    use EmbedsSchoolLogo;

    public function handle(Student $student): GradeReportPdf
    {
        return Pdf::loadView('pdf.grade-report', $this->viewData($student))
            ->setPaper('a4')
            ->setOption('isFontSubsettingEnabled', true);
    }

    /**
     * Everything the printed grade report shows.
     *
     * @return array{student: array{name: string, lrn: string|null}, schoolYears: list<array{school_year: string, grade_level: string|null, grades: list<array{id: int, subject: string, teacher: string, term_1: string|null, term_2: string|null, term_3: string|null, final_grade: float|null, remarks: string|null}>, general_average: float|null}>, logo: ?string, printedAt: CarbonInterface}
     */
    public function viewData(Student $student): array
    {
        $enrollments = $student->enrollments()
            ->withStatus('APPROVED')
            ->with('gradeLevel:id,name')
            ->orderByDesc('school_year')
            ->get();

        return [
            'student' => [
                'name' => $student->full_name,
                'lrn' => $student->lrn,
            ],
            'schoolYears' => array_values($enrollments->map(function (Enrollment $enrollment): array {
                $grades = $enrollment->gradeReport();

                return [
                    'school_year' => $enrollment->school_year,
                    'grade_level' => $enrollment->gradeLevel?->name,
                    'grades' => $grades,
                    'general_average' => Enrollment::generalAverage($grades),
                ];
            })->all()),
            'logo' => $this->logoDataUri(),
            'printedAt' => now('Asia/Manila'),
        ];
    }

    /**
     * e.g. "grades-123456789012.pdf"
     */
    public function filename(Student $student): string
    {
        return 'grades-'.($student->lrn ?? $student->id).'.pdf';
    }
}
