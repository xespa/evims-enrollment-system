<?php

namespace Database\Seeders;

use App\Models\Curriculum;
use App\Models\Enrollment;
use App\Models\GradeLevel;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Re-enrolls last school year's approved students in the current one, one
 * grade level up, as pending applications from the same parent account:
 * what a family applying again would send in. Like the admission form, the
 * Form 138 is left for the school to provide (see Send Grades); the other
 * documents carry over. Grade 10 completes Junior High, so it's skipped, as
 * are students who already applied and grade levels that are full. Run it
 * on its own; it isn't part of DatabaseSeeder.
 */
class ReturningStudentsSeeder extends Seeder
{
    public function run(): void
    {
        $schoolYear = Enrollment::currentSchoolYear();
        $previousSchoolYear = Curriculum::previousSchoolYear($schoolYear);

        $gradeLevels = GradeLevel::query()->orderBy('level_order')->get();
        $curricula = Curriculum::query()->published()->forSchoolYear($schoolYear)->with(['gradeLevel', 'subjects', 'sections'])->get()->keyBy('grade_level_id');

        $returning = Enrollment::query()
            ->where('school_year', $previousSchoolYear)
            ->withStatus('APPROVED')
            ->archived(false)
            ->whereNotIn('student_id', Enrollment::query()->select('student_id')->where('school_year', $schoolYear))
            ->with(['student', 'gradeLevel', 'officeVerification'])
            ->get();

        $applied = 0;
        $completed = 0;
        $full = [];

        foreach ($returning as $enrollment) {
            $nextGradeLevel = $this->gradeLevelAfter($gradeLevels, $enrollment->gradeLevel);

            if ($nextGradeLevel === null) {
                $completed++;

                continue;
            }

            /** @var Curriculum|null $curriculum */
            $curriculum = $curricula->get($nextGradeLevel->id);

            if ($curriculum === null || $curriculum->isFull()) {
                $full[$nextGradeLevel->name] = ($full[$nextGradeLevel->name] ?? 0) + 1;

                continue;
            }

            DB::transaction(fn () => $this->applyAgain($enrollment, $curriculum));
            $applied++;
        }

        $this->command->info("{$applied} students from S.Y. {$previousSchoolYear} applied for S.Y. {$schoolYear}, one grade level up, and are waiting for review.");

        if ($completed > 0) {
            $this->command->line("{$completed} completed the highest grade level, so they weren't re-enrolled.");
        }

        foreach ($full as $gradeLevelName => $count) {
            $this->command->warn("{$count} couldn't apply for {$gradeLevelName}: it isn't offered in S.Y. {$schoolYear} or has no slots left.");
        }
    }

    private function applyAgain(Enrollment $enrollment, Curriculum $curriculum): void
    {
        $application = $enrollment->student->enrollments()->create([
            'grade_level_id' => $curriculum->grade_level_id,
            'school_year' => $curriculum->school_year,
            'student_type' => 'WITH_LRN',
            'date_of_application' => now('Asia/Manila')->toDateString(),
            'age' => $enrollment->age + 1,
            'session_time_preference' => $enrollment->session_time_preference,
            'email' => $enrollment->email,
            'enrollment_status' => 'PENDING',
        ]);
        $application->forceFill(['enrollee_user_id' => $enrollment->enrollee_user_id])->save();

        $application->subjects()->sync($curriculum->subjects->modelKeys());

        $application->academicHistory()->create([
            'last_grade_level_completed' => $enrollment->gradeLevel->name,
            'last_school_year_completed' => $enrollment->school_year,
            'previous_school_name' => 'Eastern Visayas International Montessori School, Inc.',
        ]);

        // The school provides the Form 138; the rest carry over.
        $application->officeVerification()->create([
            'birth_certificate_path' => $enrollment->officeVerification?->birth_certificate_path,
            'good_moral_path' => $enrollment->officeVerification?->good_moral_path,
        ]);
    }

    /**
     * The next grade level up, or null after the highest one.
     *
     * @param  Collection<int, GradeLevel>  $gradeLevels  In order.
     */
    private function gradeLevelAfter(Collection $gradeLevels, GradeLevel $gradeLevel): ?GradeLevel
    {
        return $gradeLevels->first(fn (GradeLevel $candidate) => $candidate->level_order > $gradeLevel->level_order);
    }
}
