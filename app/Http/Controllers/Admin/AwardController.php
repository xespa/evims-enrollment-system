<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Awards\DetermineAcademicAwards;
use App\Enums\AcademicAward;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexAwardRequest;
use App\Models\Enrollment;
use App\Models\GradeLevel;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The year's academic awards (DepEd Order No. 015, s. 2026), worked out from
 * the grade sheets, filtered by grade level and recognition.
 *
 * @phpstan-import-type GradeLevelStandings from DetermineAcademicAwards
 */
class AwardController extends Controller
{
    public function index(IndexAwardRequest $request, DetermineAcademicAwards $determineAcademicAwards): Response
    {
        $schoolYear = $request->schoolYear();
        $recognition = $request->recognition();
        $gradeLevels = $determineAcademicAwards->handle($schoolYear, $request->gradeLevelId());
        $students = collect($gradeLevels)->flatMap(fn (array $gradeLevel) => $gradeLevel['students']);

        return Inertia::render('Admin/Awards/Index', [
            'gradeLevels' => self::onlyMatching($gradeLevels, $recognition),
            // Across the chosen grade levels, whatever recognition is shown.
            'summary' => [
                'students' => $students->count(),
                'academic_excellence' => $students->where('standing', DetermineAcademicAwards::STANDING_ACADEMIC_EXCELLENCE)->count(),
                'learning_area_excellence' => $students
                    ->filter(fn (array $student) => in_array(AcademicAward::LearningAreaExcellence->value, array_column($student['awards'], 'type'), true))
                    ->count(),
                'not_qualified' => $students->where('standing', DetermineAcademicAwards::STANDING_NOT_QUALIFIED)->count(),
                'incomplete' => $students->where('standing', DetermineAcademicAwards::STANDING_INCOMPLETE)->count(),
            ],
            'criteria' => array_map(fn (AcademicAward $award) => [
                'type' => $award->value,
                'label' => $award->label(),
                'criteria' => $award->criteria(),
            ], AcademicAward::cases()),
            'schoolYears' => Enrollment::schoolYearOptions(),
            'gradeLevelOptions' => DetermineAcademicAwards::eligibleGradeLevels()->map(fn (GradeLevel $gradeLevel) => [
                'id' => $gradeLevel->id,
                'name' => $gradeLevel->name,
            ])->values(),
            'recognitionOptions' => collect(IndexAwardRequest::recognitionOptions())
                ->map(fn (string $label, string $value) => ['value' => $value, 'label' => $label])
                ->values(),
            'filters' => [
                'school_year' => $schoolYear,
                'grade_level_id' => $request->gradeLevelId() !== null ? (string) $request->gradeLevelId() : '',
                'recognition' => $recognition,
            ],
        ]);
    }

    /**
     * The grade levels with only the students under the chosen recognition,
     * leaving out grade levels with none.
     *
     * @param  list<GradeLevelStandings>  $gradeLevels
     * @return list<GradeLevelStandings>
     */
    public static function onlyMatching(array $gradeLevels, string $recognition): array
    {
        return array_values(array_filter(array_map(fn (array $gradeLevel) => [
            ...$gradeLevel,
            'students' => array_values(array_filter(
                $gradeLevel['students'],
                fn (array $student): bool => IndexAwardRequest::matches($student, $recognition),
            )),
        ], $gradeLevels), fn (array $gradeLevel): bool => $gradeLevel['students'] !== []));
    }
}
