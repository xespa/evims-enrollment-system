<?php

namespace App\Actions\GradeSheets;

use App\Concerns\EmbedsSchoolLogo;
use App\Models\GradeSheet;
use Barryvdh\DomPDF\Facade\Pdf;
use Barryvdh\DomPDF\PDF as GradeSheetPdf;
use Carbon\CarbonInterface;

/**
 * A grade sheet on paper: the subject, grade level, school year and teacher,
 * then every student's term grades, final grade and remarks.
 */
class GenerateGradeSheet
{
    use EmbedsSchoolLogo;

    public function handle(GradeSheet $gradeSheet): GradeSheetPdf
    {
        return Pdf::loadView('pdf.grade-sheet', $this->viewData($gradeSheet))
            ->setPaper('a4')
            ->setOption('isFontSubsettingEnabled', true);
    }

    /**
     * Everything the printed grade sheet shows.
     *
     * @return array{gradeSheet: array{id: int, number: string, subject: string, subject_code: string|null, grade_level: string, school_year: string, teacher: string, prepared_by: string|null, schedule: string|null, schedule_days: list<string>, start_time: string|null, end_time: string|null}, rows: list<array{id: int, enrollment_id: int, student_name: string, lrn: string|null, term_1: string|null, term_2: string|null, term_3: string|null, final_grade: float|null, remarks: string|null}>, logo: ?string, printedAt: CarbonInterface}
     */
    public function viewData(GradeSheet $gradeSheet): array
    {
        $gradeSheet->load(GradeSheet::summaryRelations());

        return [
            'gradeSheet' => $gradeSheet->summary(),
            'rows' => $gradeSheet->studentGradeRows(),
            'logo' => $this->logoDataUri(),
            'printedAt' => now('Asia/Manila'),
        ];
    }

    /**
     * e.g. "grade-sheet-GS-00012.pdf"
     */
    public function filename(GradeSheet $gradeSheet): string
    {
        return "grade-sheet-{$gradeSheet->number}.pdf";
    }
}
