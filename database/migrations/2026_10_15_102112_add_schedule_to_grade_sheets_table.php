<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * When the class meets, printed on the grade sheet. Optional, so sheets
 * made before this simply have no schedule until one is set.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('grade_sheets', function (Blueprint $table) {
            $table->json('schedule_days')->nullable()->after('teacher_id');
            $table->time('start_time')->nullable()->after('schedule_days');
            $table->time('end_time')->nullable()->after('start_time');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('grade_sheets', function (Blueprint $table) {
            $table->dropColumn(['schedule_days', 'start_time', 'end_time']);
        });
    }
};
