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
        Schema::table('enrollee_users', function (Blueprint $table) {
            // The reasons an admin picked; rejection_reason stays as their note.
            $table->json('rejection_reasons')->nullable()->after('reviewed_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('enrollee_users', function (Blueprint $table) {
            $table->dropColumn('rejection_reasons');
        });
    }
};
