<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Moves each grade level's fees and subjects into a per-school-year
 * curriculum, so a new school year can change them without touching the
 * applications (and bills) of earlier years.
 *
 * Existing fees and subjects become the current school year's curriculum.
 * Existing applications keep pointing at the same subject rows, and their
 * bills were already stored on their billing contracts.
 */
return new class extends Migration
{
    private const FEE_COLUMNS = [
        'registration_fee',
        'miscellaneous_fee',
        'monthly_tuition',
        'monthly_laboratory_fee',
        'books_fee',
        'tuition_fee',
    ];

    public function up(): void
    {
        Schema::create('curricula', function (Blueprint $table) {
            $table->id();
            $table->foreignId('grade_level_id')->constrained()->cascadeOnDelete();
            $table->string('school_year', 9);
            $table->decimal('registration_fee', 10, 2)->default(0);
            $table->decimal('miscellaneous_fee', 10, 2)->default(0);
            $table->decimal('monthly_tuition', 10, 2)->default(0);
            $table->decimal('monthly_laboratory_fee', 10, 2)->default(0);
            $table->decimal('books_fee', 10, 2)->default(0);
            $table->decimal('tuition_fee', 10, 2)->default(0);
            $table->timestamps();

            $table->unique(['grade_level_id', 'school_year']);
        });

        $schoolYear = $this->currentSchoolYear();
        $now = now();

        foreach (DB::table('grade_levels')->get() as $gradeLevel) {
            DB::table('curricula')->insert([
                'grade_level_id' => $gradeLevel->id,
                'school_year' => $schoolYear,
                ...collect(self::FEE_COLUMNS)->mapWithKeys(fn (string $column) => [$column => $gradeLevel->{$column}])->all(),
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        Schema::table('subjects', function (Blueprint $table) {
            $table->foreignId('curriculum_id')->nullable()->after('id')->constrained('curricula')->cascadeOnDelete();
        });

        foreach (DB::table('curricula')->get(['id', 'grade_level_id']) as $curriculum) {
            DB::table('subjects')
                ->where('grade_level_id', $curriculum->grade_level_id)
                ->update(['curriculum_id' => $curriculum->id]);
        }

        Schema::table('subjects', function (Blueprint $table) {
            $table->foreignId('curriculum_id')->nullable(false)->change();
            $table->dropConstrainedForeignId('grade_level_id');
        });

        Schema::table('grade_levels', function (Blueprint $table) {
            $table->dropColumn(self::FEE_COLUMNS);
        });
    }

    public function down(): void
    {
        Schema::table('grade_levels', function (Blueprint $table) {
            foreach (self::FEE_COLUMNS as $column) {
                $table->decimal($column, 10, 2)->default(0);
            }
        });

        Schema::table('subjects', function (Blueprint $table) {
            $table->foreignId('grade_level_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
        });

        // Each grade level gets back its most recent school year's fees.
        foreach (DB::table('curricula')->orderBy('school_year')->get() as $curriculum) {
            DB::table('grade_levels')->where('id', $curriculum->grade_level_id)->update(
                collect(self::FEE_COLUMNS)->mapWithKeys(fn (string $column) => [$column => $curriculum->{$column}])->all(),
            );

            DB::table('subjects')
                ->where('curriculum_id', $curriculum->id)
                ->update(['grade_level_id' => $curriculum->grade_level_id]);
        }

        Schema::table('subjects', function (Blueprint $table) {
            $table->dropConstrainedForeignId('curriculum_id');
        });

        Schema::dropIfExists('curricula');
    }

    /**
     * Mirrors Enrollment::currentSchoolYear(), inlined so this migration
     * doesn't depend on the model as it changes over time.
     */
    private function currentSchoolYear(): string
    {
        $startYear = now()->month >= 6 ? now()->year : now()->year - 1;

        return $startYear.'-'.($startYear + 1);
    }
};
