<?php

namespace App\Actions\GradeSheets;

use App\Concerns\EmbedsSchoolLogo;
use App\Models\Enrollment;
use App\Models\GradeSheet;
use App\Models\Student;
use App\Models\StudentGrade;
use Barryvdh\DomPDF\Facade\Pdf;
use Barryvdh\DomPDF\PDF as GradeReportPdf;

/**
 * A student's grades on paper, laid out like DepEd's Learner's Performance
 * Report: one page per school year they were enrolled in, newest first,
 * with each subject's term grades, final grade and remarks from the
 * teachers' grade sheets.
 */
class GenerateGradeReport
{
    use EmbedsSchoolLogo;

    /**
     * Every school year the student was enrolled in, or only the given one
     * (e.g. the report card sent on as next year's Form 138).
     */
    public function handle(Student $student, ?string $schoolYear = null): GradeReportPdf
    {
        $data = $this->viewData($student, $schoolYear);

        return $this->render("Learner's Performance Report of {$student->full_name}", $this->pages($data['student'], $data['schoolYears']));
    }

    /**
     * Every student on the grade sheet, by name, one report card each for
     * the sheet's school year, in one file to print.
     */
    public function handleForGradeSheet(GradeSheet $gradeSheet): GradeReportPdf
    {
        $schoolYear = $gradeSheet->subject->curriculum->school_year;

        $pages = $gradeSheet->studentGrades()
            ->with('enrollment.student')
            ->get()
            ->map(fn (StudentGrade $studentGrade) => $studentGrade->enrollment->student)
            ->filter()
            ->sortBy('full_name', SORT_NATURAL | SORT_FLAG_CASE)
            ->flatMap(function (Student $student) use ($schoolYear) {
                $data = $this->viewData($student, $schoolYear);

                return $this->pages($data['student'], $data['schoolYears']);
            })
            ->values()
            ->all();

        return $this->render("Report cards · {$gradeSheet->number}", $pages);
    }

    /**
     * @param  array<int, array<string, mixed>>  $pages
     */
    private function render(string $title, array $pages): GradeReportPdf
    {
        return Pdf::loadView('pdf.grade-report', [
            'title' => $title,
            'pages' => $pages,
            'logo' => $this->logoDataUri(),
        ])
            ->setPaper('a4')
            ->setOption('isFontSubsettingEnabled', true);
    }

    /**
     * One page per school year, each with the student's details; a blank
     * report when they have no school year yet, so their details still print.
     *
     * @param  array{name: string, lrn: string|null, sex: string}  $student
     * @param  list<array<string, mixed>>  $schoolYears
     * @return list<array<string, mixed>>
     */
    private function pages(array $student, array $schoolYears): array
    {
        $reports = $schoolYears ?: [[
            'school_year' => null,
            'grade_level' => null,
            'section' => null,
            'age' => '',
            'grades' => [],
            'term_averages' => ['term_1' => null, 'term_2' => null, 'term_3' => null],
            'general_average' => null,
            'general_remarks' => null,
        ]];

        return array_map(fn (array $report) => ['student' => $student, ...$report], $reports);
    }

    /**
     * e.g. "report-cards-GS-00012.pdf"
     */
    public function gradeSheetFilename(GradeSheet $gradeSheet): string
    {
        return "report-cards-{$gradeSheet->number}.pdf";
    }

    /**
     * One student's details and report for each school year (or only the
     * given one), as the printed report card shows them.
     *
     * @return array{student: array{name: string, lrn: string|null, sex: string}, schoolYears: list<array{school_year: string, grade_level: string|null, section: string|null, age: int, grades: list<array{id: int, subject: string, teacher: string, term_1: string|null, term_2: string|null, term_3: string|null, final_grade: float|null, remarks: string|null}>, term_averages: array{term_1: float|null, term_2: float|null, term_3: float|null}, general_average: float|null, general_remarks: 'Passed'|'Failed'|null}>}
     */
    public function viewData(Student $student, ?string $schoolYear = null): array
    {
        $enrollments = $student->enrollments()
            ->withStatus('APPROVED')
            ->when($schoolYear, fn ($query, string $schoolYear) => $query->where('school_year', $schoolYear))
            ->with(['gradeLevel:id,name', 'section:id,name'])
            ->orderByDesc('school_year')
            ->get();

        return [
            'student' => [
                'name' => $student->full_name,
                'lrn' => $student->lrn,
                // "MALE" → "Male", as the report card prints it.
                'sex' => ucfirst(strtolower($student->sex)),
            ],
            'schoolYears' => array_values($enrollments->map(function (Enrollment $enrollment): array {
                $grades = $enrollment->gradeReport();
                $generalAverage = Enrollment::generalAverage($grades);

                return [
                    'school_year' => $enrollment->school_year,
                    'grade_level' => $enrollment->gradeLevel?->name,
                    'section' => $enrollment->section?->name,
                    // Their age that school year, from the application.
                    'age' => $enrollment->age,
                    'grades' => $grades,
                    'term_averages' => Enrollment::termGeneralAverages($grades),
                    'general_average' => $generalAverage,
                    'general_remarks' => match (true) {
                        $generalAverage === null => null,
                        $generalAverage >= StudentGrade::PASSING_GRADE => 'Passed',
                        default => 'Failed',
                    },
                ];
            })->all()),
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
