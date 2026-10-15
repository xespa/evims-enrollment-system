<?php

namespace Database\Seeders;

use App\Models\Curriculum;
use App\Models\Enrollment;
use Database\Seeders\Concerns\SeedsStudentsWithAccounts;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Fills the free slots of Nursery Section A this school year with approved
 * students, each with a parent account and an active student account (see
 * SeedsStudentsWithAccounts). Run it on its own; it isn't part of
 * DatabaseSeeder.
 */
class NurserySectionSeeder extends Seeder
{
    use SeedsStudentsWithAccounts;

    public const SECTION_NAME = 'A';

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
            ->map(fn () => $this->seedStudentInSection($curriculum, $section)->student)
            ->map(fn ($student) => [$student->full_name, (string) $student->lrn]));

        $this->command->info("Seeded {$freeSlots} Nursery students in Section A for S.Y. {$schoolYear}. Each signs in as a Student on the sign-in page with their LRN as both LRN and password:");
        $this->command->table(['Student', 'LRN / starting password'], $seeded->all());
    }
}
