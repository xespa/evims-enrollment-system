<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('grade_level_id')->constrained();
            $table->string('school_year', 9); // e.g. "2026-2027"
            $table->enum('student_type', ['NO_LRN', 'WITH_LRN', 'RETURNEE']);
            $table->date('date_of_application');
            $table->unsignedTinyInteger('age');
            $table->enum('session_time_preference', ['MORNING_SESSION', 'AFTERNOON_SESSION', 'SCHOOL_SERVICE']);
            $table->enum('enrollment_status', ['PENDING', 'APPROVED', 'REJECTED'])->default('PENDING');
            $table->timestamps();

            $table->unique(['student_id', 'school_year']); // one application per student per year
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('enrollments');
    }
};
