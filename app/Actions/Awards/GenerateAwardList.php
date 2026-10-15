<?php

namespace App\Actions\Awards;

use App\Concerns\EmbedsSchoolLogo;
use App\Enums\AcademicAward;
use Barryvdh\DomPDF\Facade\Pdf;
use Barryvdh\DomPDF\PDF as AwardListPdf;
use Carbon\CarbonInterface;

/**
 * The printed list of awardees for a school year: each grade level's
 * students with their recognitions, alphabetically (never ranked), as the
 * awards guidelines ask.
 *
 * @phpstan-import-type GradeLevelStandings from DetermineAcademicAwards
 */
class GenerateAwardList
{
    use EmbedsSchoolLogo;

    /**
     * @param  list<GradeLevelStandings>  $gradeLevels  Already narrowed to the awardees to print.
     */
    public function handle(string $schoolYear, array $gradeLevels): AwardListPdf
    {
        return Pdf::loadView('pdf.award-list', $this->viewData($schoolYear, $gradeLevels))
            ->setPaper('a4')
            ->setOption('isFontSubsettingEnabled', true);
    }

    /**
     * @param  list<GradeLevelStandings>  $gradeLevels
     * @return array{schoolYear: string, gradeLevels: list<GradeLevelStandings>, criteria: list<array{label: string, criteria: string}>, logo: ?string, printedAt: CarbonInterface}
     */
    public function viewData(string $schoolYear, array $gradeLevels): array
    {
        return [
            'schoolYear' => $schoolYear,
            'gradeLevels' => $gradeLevels,
            'criteria' => array_map(fn (AcademicAward $award) => [
                'label' => $award->label(),
                'criteria' => $award->criteria(),
            ], AcademicAward::cases()),
            'logo' => $this->logoDataUri(),
            'printedAt' => now('Asia/Manila'),
        ];
    }

    /**
     * e.g. "academic-awards-2026-2027.pdf"
     */
    public function filename(string $schoolYear): string
    {
        return "academic-awards-{$schoolYear}.pdf";
    }
}
