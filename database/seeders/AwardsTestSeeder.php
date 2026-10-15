<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Curriculum;
use App\Models\GradeSheet;
use App\Models\Subject;
use App\Models\User;
use Database\Seeders\Concerns\SeedsStudentsWithAccounts;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * A graded school year for trying out the academic awards: five approved
 * students in every section of every grade level in S.Y. 2025-2026, each
 * with a student account (see SeedsStudentsWithAccounts) and term grades on
 * a grade sheet for every subject. Grade levels without sections get A to C.
 *
 * The five follow set patterns, so every standing shows up: one well above
 * the Academic Excellence cutoff, one just above it, one with a high average
 * but a final grade below 80, one around 84, and one still missing a term.
 * Sections already holding five or more are left alone, so it can be run
 * again safely. Run it on its own; it isn't part of DatabaseSeeder.
 */
class AwardsTestSeeder extends Seeder
{
    use SeedsStudentsWithAccounts;

    public const SCHOOL_YEAR = '2025-2026';

    public const STUDENTS_PER_SECTION = 5;

    private const TOP = 0;

    private const JUST_QUALIFIES = 1;

    private const ONE_LOW_GRADE = 2;

    private const AVERAGE = 3;

    private const MISSING_A_TERM = 4;

    public function run(): void
    {
        $curricula = Curriculum::query()
            ->published()
            ->forSchoolYear(self::SCHOOL_YEAR)
            ->with(['gradeLevel', 'subjects', 'sections'])
            ->get()
            ->sortBy('gradeLevel.level_order');

        if ($curricula->isEmpty()) {
            $this->command->error('S.Y. '.self::SCHOOL_YEAR.' isn\'t set up yet. Set it up in School Year Setup first.');

            return;
        }

        $teacher = User::query()->active()->where('role', UserRole::Teacher)->orderBy('id')->first();

        if ($teacher === null) {
            $this->command->error('No active teacher to keep the grade sheets. Add one in Staff Accounts first.');

            return;
        }

        $summary = $curricula->map(fn (Curriculum $curriculum) => DB::transaction(
            fn () => [$curriculum->gradeLevel->name, $this->seedGradeLevel($curriculum, $teacher)],
        ));

        $this->command->info('Seeded S.Y. '.self::SCHOOL_YEAR.'. Students sign in as a Student with their LRN as both LRN and password (find LRNs in Admin → Students).');
        $this->command->table(['Grade level', 'Students added'], $summary->values()->all());
    }

    /**
     * Fills each of the grade level's sections up to five students, with
     * grades on every subject's grade sheet. Returns how many were added.
     */
    private function seedGradeLevel(Curriculum $curriculum, User $teacher): int
    {
        if ($curriculum->sections->isEmpty()) {
            $curriculum->createDefaultSections();
            $curriculum->load('sections');
        }

        $gradeSheets = $curriculum->subjects
            ->sortBy('name')
            ->values()
            ->map(fn (Subject $subject) => $this->gradeSheetFor($subject, $teacher));

        $added = 0;

        foreach ($curriculum->sections as $section) {
            $alreadyPlaced = $section->students()->count();
            $toAdd = min(self::STUDENTS_PER_SECTION - $alreadyPlaced, $section->slots - $alreadyPlaced);

            for ($index = 0; $index < $toAdd; $index++) {
                $enrollment = $this->seedStudentInSection($curriculum, $section);
                $profile = ($alreadyPlaced + $index) % self::STUDENTS_PER_SECTION;

                foreach ($gradeSheets as $subjectIndex => $gradeSheet) {
                    $gradeSheet->studentGrades()->create([
                        'enrollment_id' => $enrollment->id,
                        ...$this->termGrades($profile, $subjectIndex, $gradeSheets->count()),
                    ]);
                }

                $added++;
            }
        }

        return $added;
    }

    /**
     * The subject's grade sheet in use, or a new one kept by a teacher who
     * teaches it (or the given one).
     */
    private function gradeSheetFor(Subject $subject, User $teacher): GradeSheet
    {
        return GradeSheet::query()->where('subject_id', $subject->id)->archived(false)->oldest('id')->first()
            ?? GradeSheet::create([
                'subject_id' => $subject->id,
                'teacher_id' => $subject->teachers()->value('users.id') ?? $teacher->id,
                'created_by' => $teacher->id,
            ]);
    }

    /**
     * One student's Term 1–3 grades in one subject, following their pattern.
     *
     * @return array{term_1: int, term_2: int, term_3: int|null}
     */
    private function termGrades(int $profile, int $subjectIndex, int $subjectCount): array
    {
        [$lowest, $highest] = match (true) {
            $profile === self::TOP => [93, 98],
            $profile === self::JUST_QUALIFIES => [90, 92],
            // One learning area pulls them under the 80 floor.
            $profile === self::ONE_LOW_GRADE && $subjectIndex === 0 => [76, 79],
            $profile === self::ONE_LOW_GRADE => [93, 97],
            $profile === self::AVERAGE => [80, 88],
            default => [82, 94],
        };

        $grade = fn (): int => fake()->numberBetween($lowest, $highest);
        $isMissingTerm = $profile === self::MISSING_A_TERM && $subjectIndex === $subjectCount - 1;

        return [
            'term_1' => $grade(),
            'term_2' => $grade(),
            'term_3' => $isMissingTerm ? null : $grade(),
        ];
    }
}
