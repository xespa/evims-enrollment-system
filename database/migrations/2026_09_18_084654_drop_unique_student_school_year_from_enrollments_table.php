<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * The hard DB-level uniqueness on (student_id, school_year) can't tell a
     * rejected/cancelled application from an active one, so a student whose
     * prior application was rejected could never re-apply for that same
     * school year. That distinction is now enforced at the application layer
     * instead (see StoreEnrollmentRequest), scoped to active applications only.
     */
    public function up(): void
    {
        Schema::table('enrollments', function (Blueprint $table) {
            // Add the replacement index BEFORE dropping the unique one — MySQL
            // refuses to drop an index that's currently the only one backing
            // the student_id foreign key.
            $table->index(['student_id', 'school_year']);
        });

        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropUnique(['student_id', 'school_year']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('enrollments', function (Blueprint $table) {
            $table->unique(['student_id', 'school_year']);
        });

        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropIndex(['student_id', 'school_year']);
        });
    }
};
