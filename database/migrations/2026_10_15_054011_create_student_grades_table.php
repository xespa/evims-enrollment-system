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
        Schema::create('student_grades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('grade_sheet_id')->constrained()->cascadeOnDelete();
            $table->foreignId('enrollment_id')->constrained()->cascadeOnDelete();
            // Each term is filled in as it ends, so all start empty.
            $table->decimal('term_1', 5, 2)->nullable();
            $table->decimal('term_2', 5, 2)->nullable();
            $table->decimal('term_3', 5, 2)->nullable();
            $table->timestamps();

            $table->unique(['grade_sheet_id', 'enrollment_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_grades');
    }
};
