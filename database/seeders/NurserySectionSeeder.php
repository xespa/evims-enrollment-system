<?php

namespace Database\Seeders;

use App\Models\Curriculum;
use App\Models\EnrolleeUser;
use App\Models\Enrollment;
use App\Models\Section;
use App\Models\Student;
use App\Models\StudentAccount;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Fills the free slots of Nursery Section A this school year with approved
 * students, each with a parent account and an active student account. They
 * get a school-issued LRN (Nursery students have no DepEd one), which is
 * also their first password, as for accounts staff create. Run it on its
 * own; it isn't part of DatabaseSeeder.
 */
class NurserySectionSeeder extends Seeder
{
    public const SECTION_NAME = 'A';

    /**
     * The prefix of LRNs the school issues itself (see StudentController::assignLrn()).
     */
    private const SCHOOL_LRN_PREFIX = '452501';

    public function run(): void
    {
        $schoolYear = Enrollment::currentSchoolYear();

        $curriculum = Curriculum::query()
            ->published()
            ->forSchoolYear($schoolYear)
            ->whereHas('gradeLevel', fn ($gradeLevel) => $gradeLevel->where('name', 'Nursery'))
            ->with(['gradeLevel', 'subjects'])
            ->first();

        $section = $curriculum?->sections()->where('name', self::SECTION_NAME)->first();

        if ($section === null) {
            $this->command->error("Nursery has no Section A for S.Y. {$schoolYear}. Add it in School Year Setup first.");

            return;
        }

        $freeSlots = $section->slots - $section->students()->count();

        if ($freeSlots <= 0) {
            $this->command->warn("Nursery Section A is already full for S.Y. {$schoolYear}.");

            return;
        }

        $seeded = DB::transaction(fn () => collect(range(1, $freeSlots))
            ->map(fn () => $this->seedStudent($curriculum, $section)));

        $this->command->info("Seeded {$freeSlots} Nursery students in Section A for S.Y. {$schoolYear}. Each signs in as a Student on the sign-in page with their LRN as both LRN and password:");
        $this->command->table(['Student', 'LRN / starting password'], $seeded->all());
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function seedStudent(Curriculum $curriculum, Section $section): array
    {
        $student = Student::factory()->create(['lrn' => $this->uniqueSchoolLrn()]);
        /** @var EnrolleeUser $parent */
        $parent = EnrolleeUser::factory()->create(['name' => fake()->firstName().' '.$student->last_name]);

        $enrollment = Enrollment::factory()->withDocuments()->create([
            'student_id' => $student->id,
            'grade_level_id' => $curriculum->grade_level_id,
            'school_year' => $curriculum->school_year,
            'student_type' => 'NO_LRN',
            'enrollee_user_id' => $parent->id,
            'email' => $parent->email,
            'enrollment_status' => 'APPROVED',
        ]);
        $enrollment->subjects()->attach($curriculum->subjects->pluck('id'));
        $enrollment->section()->associate($section)->save();

        StudentAccount::factory()->active((string) $student->lrn)->create([
            'student_id' => $student->id,
            'consent_email' => $parent->email,
            'consent_given_by' => $parent->name,
        ]);

        return [$student->full_name, (string) $student->lrn];
    }

    /**
     * A 14-digit school-issued LRN nobody has yet.
     */
    private function uniqueSchoolLrn(): string
    {
        do {
            $lrn = self::SCHOOL_LRN_PREFIX.fake()->numerify('########');
        } while (Student::query()->where('lrn', $lrn)->exists());

        return $lrn;
    }
}
