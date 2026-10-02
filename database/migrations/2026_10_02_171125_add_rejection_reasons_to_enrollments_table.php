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
        Schema::table('enrollments', function (Blueprint $table) {
            // The reasons an admin picked when rejecting, plus their own note.
            $table->json('rejection_reasons')->nullable()->after('enrollment_status');
            $table->string('rejection_note', 500)->nullable()->after('rejection_reasons');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropColumn(['rejection_reasons', 'rejection_note']);
        });
    }
};
