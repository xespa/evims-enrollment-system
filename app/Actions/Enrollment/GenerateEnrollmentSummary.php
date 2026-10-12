<?php

namespace App\Actions\Enrollment;

use App\Concerns\EmbedsSchoolLogo;
use App\Models\Enrollment;
use App\Models\GradeLevel;
use Barryvdh\DomPDF\Facade\Pdf;
use Barryvdh\DomPDF\PDF as EnrollmentSummaryPdf;
use Carbon\CarbonInterface;

/**
 * The enrollment summary the school files with DepEd: how many boys and
 * girls are enrolled in each level for a school year. Only approved
 * applications count, leaving out cancelled and archived ones.
 */
class GenerateEnrollmentSummary
{
    use EmbedsSchoolLogo;

    public function handle(string $schoolYear): EnrollmentSummaryPdf
    {
        return Pdf::loadView('pdf.enrollment-summary', $this->viewData($schoolYear))
            ->setPaper('a4')
            ->setOption('isFontSubsettingEnabled', true);
    }

    /**
     * Everything the enrollment summary shows.
     *
     * @return array{schoolYear: string, departments: list<array{name: string, levels: list<array{label: string, male: int, female: int, total: int}>}>, totals: array{male: int, female: int, total: int}, logo: ?string, asOf: CarbonInterface}
     */
    public function viewData(string $schoolYear): array
    {
        $counts = Enrollment::query()
            ->join('students', 'students.id', '=', 'enrollments.student_id')
            ->where('enrollments.school_year', $schoolYear)
            ->withStatus('APPROVED')
            ->archived(false)
            ->groupBy('enrollments.grade_level_id', 'students.sex')
            ->selectRaw('enrollments.grade_level_id, students.sex, count(*) as aggregate')
            ->toBase()
            ->get()
            ->mapWithKeys(fn (object $row) => ["{$row->grade_level_id}-{$row->sex}" => (int) $row->aggregate])
            ->all();

        /** @var array<string, list<array{label: string, male: int, female: int, total: int}>> $levelsByDepartment */
        $levelsByDepartment = [];
        $totals = ['male' => 0, 'female' => 0, 'total' => 0];

        foreach (GradeLevel::query()->orderBy('level_order')->get(['id', 'name']) as $gradeLevel) {
            $department = $this->department($gradeLevel);
            $male = $counts["{$gradeLevel->id}-MALE"] ?? 0;
            $female = $counts["{$gradeLevel->id}-FEMALE"] ?? 0;

            $levelsByDepartment[$department][] = [
                'label' => $this->levelLabel($gradeLevel, count($levelsByDepartment[$department] ?? [])),
                'male' => $male,
                'female' => $female,
                'total' => $male + $female,
            ];

            $totals['male'] += $male;
            $totals['female'] += $female;
            $totals['total'] += $male + $female;
        }

        $departments = [];

        foreach ($levelsByDepartment as $department => $levels) {
            $departments[] = ['name' => $department, 'levels' => $levels];
        }

        return [
            'schoolYear' => $schoolYear,
            'departments' => $departments,
            'totals' => $totals,
            'logo' => $this->logoDataUri(),
            'asOf' => now('Asia/Manila'),
        ];
    }

    /**
     * e.g. "enrollment-summary-2026-2027.pdf"
     */
    public function filename(string $schoolYear): string
    {
        return "enrollment-summary-{$schoolYear}.pdf";
    }

    /**
     * Grades 1–6 are Elementary and 7–10 Junior High; the levels before
     * Grade 1 (Nursery, Pre-K) are Pre-Elementary.
     */
    private function department(GradeLevel $gradeLevel): string
    {
        if (preg_match('/^Grade (\d+)$/', $gradeLevel->name, $matches) !== 1) {
            return 'PRE-ELEMENTARY';
        }

        return (int) $matches[1] <= 6 ? 'ELEMENTARY' : 'JUNIOR HIGHSCHOOL';
    }

    /**
     * The Montessori names the school reports under: Pre-Elementary levels
     * are lettered in order (Nursery is Level A), and Grade 4 is Level 4.
     */
    private function levelLabel(GradeLevel $gradeLevel, int $indexInDepartment): string
    {
        if (preg_match('/^Grade (\d+)$/', $gradeLevel->name, $matches) === 1) {
            return "LEVEL {$matches[1]}";
        }

        return 'LEVEL '.chr(ord('A') + $indexInDepartment);
    }
}
