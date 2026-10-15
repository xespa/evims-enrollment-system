<?php

namespace App\Actions\Awards;

use App\Enums\AcademicAward;
use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\StudentGrade;
use App\Models\Subject;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

/**
 * Works out who receives the grade-based recognitions of DepEd Order No.
 * 015, s. 2026 for a school year, from the teachers' grade sheets:
 *
 * - Academic Excellence Award: a general average of 90 or higher and no
 *   final grade below 80 in any learning area (Key Stages 2–4).
 * - Excellence in a Learning Area: the highest final grade in a learning
 *   area of a grade level, if it's 90 or higher.
 *
 * Final grades are the average of the terms rounded to a whole number, and
 * the general average is the average of those, also a whole number. No
 * academic awards are given in Key Stage 1 (up to Grade 3), so those grade
 * levels are left out. Students are listed alphabetically, never ranked.
 *
 * The order also requires no derogatory records or disciplinary cases;
 * the school doesn't keep those here, so staff confirm them separately.
 *
 * @phpstan-type StudentStanding array{enrollment_id: int, name: string, lrn: string|null, general_average: int|null, lowest_final_grade: int|null, final_grades: array<string, int|null>, standing: string, reasons: list<string>, awards: list<array{type: string, label: string, learning_area: string|null}>}
 * @phpstan-type GradeLevelStandings array{id: int, name: string, students: list<StudentStanding>}
 */
class DetermineAcademicAwards
{
    public const GENERAL_AVERAGE_CUTOFF = 90;

    public const LOWEST_FINAL_GRADE = 80;

    public const LEARNING_AREA_CUTOFF = 90;

    /**
     * Academic awards start at Key Stage 2.
     */
    public const FIRST_ELIGIBLE_GRADE = 4;

    public const STANDING_ACADEMIC_EXCELLENCE = 'ACADEMIC_EXCELLENCE';

    public const STANDING_NOT_QUALIFIED = 'NOT_QUALIFIED';

    public const STANDING_INCOMPLETE = 'INCOMPLETE';

    /**
     * One grade level's awards for a school year, as a grade sheet's Awards
     * dialog shows them: every student (filtered on the page), with counts
     * for each recognition.
     *
     * @return array{school_year: string, grade_level_id: int, grade_level: string, students: list<StudentStanding>, summary: array{students: int, academic_excellence: int, learning_area_excellence: int, not_qualified: int, incomplete: int}}
     */
    public function forGradeLevel(string $schoolYear, GradeLevel $gradeLevel): array
    {
        $students = $this->handle($schoolYear, $gradeLevel->id)[0]['students'] ?? [];

        return [
            'school_year' => $schoolYear,
            'grade_level_id' => $gradeLevel->id,
            'grade_level' => $gradeLevel->name,
            'students' => $students,
            'summary' => self::summarize($students),
        ];
    }

    /**
     * How many students hold each standing or recognition.
     *
     * @param  list<StudentStanding>  $students
     * @return array{students: int, academic_excellence: int, learning_area_excellence: int, not_qualified: int, incomplete: int}
     */
    public static function summarize(array $students): array
    {
        $students = collect($students);

        return [
            'students' => $students->count(),
            'academic_excellence' => $students->where('standing', self::STANDING_ACADEMIC_EXCELLENCE)->count(),
            'learning_area_excellence' => $students
                ->filter(fn (array $student) => in_array(AcademicAward::LearningAreaExcellence->value, array_column($student['awards'], 'type'), true))
                ->count(),
            'not_qualified' => $students->where('standing', self::STANDING_NOT_QUALIFIED)->count(),
            'incomplete' => $students->where('standing', self::STANDING_INCOMPLETE)->count(),
        ];
    }

    /**
     * The grade levels with only the students the filter matches (see
     * IndexAwardRequest::matches()), leaving out grade levels with none.
     *
     * @param  list<GradeLevelStandings>  $gradeLevels
     * @param  callable(StudentStanding): bool  $matches
     * @return list<GradeLevelStandings>
     */
    public static function onlyMatching(array $gradeLevels, callable $matches): array
    {
        return array_values(array_filter(array_map(fn (array $gradeLevel) => [
            ...$gradeLevel,
            'students' => array_values(array_filter($gradeLevel['students'], $matches)),
        ], $gradeLevels), fn (array $gradeLevel): bool => $gradeLevel['students'] !== []));
    }

    /**
     * Whether the grade level receives academic awards (Grade 4 and up).
     */
    public static function isEligible(GradeLevel $gradeLevel): bool
    {
        return ($gradeLevel->gradeNumber() ?? 0) >= self::FIRST_ELIGIBLE_GRADE;
    }

    /**
     * Every approved student's standing, by grade level.
     *
     * @return list<GradeLevelStandings>
     */
    public function handle(string $schoolYear, ?int $gradeLevelId = null): array
    {
        $gradeLevels = self::eligibleGradeLevels()
            ->when($gradeLevelId, fn (Collection $gradeLevels, int $id) => $gradeLevels->where('id', $id));

        $enrollmentsByGradeLevel = Enrollment::query()
            ->where('enrollments.school_year', $schoolYear)
            ->whereIn('enrollments.grade_level_id', $gradeLevels->modelKeys())
            ->withStatus('APPROVED')
            ->archived(false)
            ->with([
                'student',
                'subjects:id,name',
                // Archived sheets' grades don't count until they're restored.
                'studentGrades' => fn ($studentGrades) => $studentGrades->whereHas('gradeSheet', fn (Builder $gradeSheet) => $gradeSheet->whereNull('grade_sheets.archived_at')),
                'studentGrades.gradeSheet:id,subject_id',
            ])
            ->get()
            ->groupBy('grade_level_id');

        return array_values($gradeLevels
            ->map(fn (GradeLevel $gradeLevel) => [
                'id' => $gradeLevel->id,
                'name' => $gradeLevel->name,
                'students' => $this->standings($enrollmentsByGradeLevel->get($gradeLevel->id, collect())),
            ])
            ->all());
    }

    /**
     * The grade levels that can receive academic awards (Grade 4 and up),
     * in order.
     *
     * @return \Illuminate\Database\Eloquent\Collection<int, GradeLevel>
     */
    public static function eligibleGradeLevels(): \Illuminate\Database\Eloquent\Collection
    {
        return GradeLevel::query()
            ->orderBy('level_order')
            ->get(['id', 'name', 'level_order'])
            ->filter(fn (GradeLevel $gradeLevel): bool => self::isEligible($gradeLevel))
            ->values();
    }

    /**
     * One grade level's students with their grades, standing and awards,
     * alphabetically.
     *
     * @param  Collection<int, Enrollment>  $enrollments
     * @return list<StudentStanding>
     */
    private function standings(Collection $enrollments): array
    {
        $students = $enrollments
            ->map(fn (Enrollment $enrollment) => $this->standing($enrollment))
            ->sortBy('name', SORT_NATURAL | SORT_FLAG_CASE)
            ->values();

        // Each learning area's top final grade goes to everyone who has it,
        // as long as it's 90 or higher.
        $learningAreas = $students->flatMap(fn (array $student) => array_keys($student['final_grades']))->unique();

        foreach ($learningAreas as $learningArea) {
            $topGrade = $students->max(fn (array $student) => $student['final_grades'][$learningArea] ?? null);

            if ($topGrade === null || $topGrade < self::LEARNING_AREA_CUTOFF) {
                continue;
            }

            $students = $students->map(function (array $student) use ($learningArea, $topGrade) {
                if (($student['final_grades'][$learningArea] ?? null) === $topGrade) {
                    $student['awards'][] = [
                        'type' => AcademicAward::LearningAreaExcellence->value,
                        'label' => "Excellence in {$learningArea}",
                        'learning_area' => $learningArea,
                    ];
                }

                return $student;
            });
        }

        return array_values($students->all());
    }

    /**
     * One student's final grades, general average and Academic Excellence
     * standing, with the reasons when they don't qualify.
     *
     * @return StudentStanding
     */
    private function standing(Enrollment $enrollment): array
    {
        /** @var array<string, int|null> $finalGrades */
        $finalGrades = $enrollment->subjects
            ->sortBy('name')
            ->mapWithKeys(fn (Subject $subject) => [$subject->name => $this->finalGradeIn($enrollment, $subject)])
            ->all();

        $missing = array_keys(array_filter($finalGrades, fn (?int $grade): bool => $grade === null));
        $isComplete = $finalGrades !== [] && $missing === [];
        $generalAverage = $isComplete ? (int) round(array_sum($finalGrades) / count($finalGrades)) : null;
        $lowestFinalGrade = $isComplete ? (int) min($finalGrades) : null;

        $reasons = [];

        if ($finalGrades === []) {
            $reasons[] = 'No learning areas on record.';
        } elseif (! $isComplete) {
            $reasons[] = 'No final grade yet in '.implode(', ', $missing).'.';
        } else {
            if ($generalAverage < self::GENERAL_AVERAGE_CUTOFF) {
                $reasons[] = "General average {$generalAverage} is below ".self::GENERAL_AVERAGE_CUTOFF.'.';
            }

            $belowFloor = array_filter($finalGrades, fn (?int $grade): bool => $grade < self::LOWEST_FINAL_GRADE);

            if ($belowFloor !== []) {
                $reasons[] = 'Final grade below '.self::LOWEST_FINAL_GRADE.' in '
                    .collect($belowFloor)->map(fn (?int $grade, string $learningArea) => "{$learningArea} ({$grade})")->implode(', ').'.';
            }
        }

        $standing = match (true) {
            ! $isComplete => self::STANDING_INCOMPLETE,
            $reasons === [] => self::STANDING_ACADEMIC_EXCELLENCE,
            default => self::STANDING_NOT_QUALIFIED,
        };

        return [
            'enrollment_id' => $enrollment->id,
            'name' => $enrollment->student->full_name,
            'lrn' => $enrollment->student->lrn,
            'general_average' => $generalAverage,
            'lowest_final_grade' => $lowestFinalGrade,
            'final_grades' => $finalGrades,
            'standing' => $standing,
            'reasons' => $reasons,
            'awards' => $standing === self::STANDING_ACADEMIC_EXCELLENCE
                ? [['type' => AcademicAward::AcademicExcellence->value, 'label' => AcademicAward::AcademicExcellence->label(), 'learning_area' => null]]
                : [],
        ];
    }

    /**
     * The student's whole-number final grade in a learning area, from its
     * grade sheet; if more than one teacher graded it, their average.
     */
    private function finalGradeIn(Enrollment $enrollment, Subject $subject): ?int
    {
        $finalGrades = $enrollment->studentGrades
            ->filter(fn (StudentGrade $studentGrade): bool => $studentGrade->gradeSheet->subject_id === $subject->id)
            ->map(fn (StudentGrade $studentGrade): ?int => $studentGrade->wholeFinalGrade())
            ->filter(fn (?int $grade): bool => $grade !== null);

        return $finalGrades->isEmpty() ? null : (int) round($finalGrades->avg());
    }
}
