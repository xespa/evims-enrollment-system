<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Who made each grade sheet: the teacher, or an admin making one for them.
 * Sheets made before this are credited to their teacher.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('grade_sheets', function (Blueprint $table) {
            $table->foreignId('created_by')->nullable()->after('teacher_id')->constrained('users')->nullOnDelete();
        });

        DB::table('grade_sheets')->whereNull('created_by')->update(['created_by' => DB::raw('teacher_id')]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('grade_sheets', function (Blueprint $table) {
            $table->dropConstrainedForeignId('created_by');
        });
    }
};
