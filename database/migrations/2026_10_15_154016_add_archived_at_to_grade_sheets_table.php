<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Grade sheets are archived instead of deleted, so their grades can be
 * restored: when, and by whom.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('grade_sheets', function (Blueprint $table) {
            $table->timestamp('archived_at')->nullable()->index()->after('end_time');
            $table->foreignId('archived_by')->nullable()->after('archived_at')->constrained('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('grade_sheets', function (Blueprint $table) {
            $table->dropConstrainedForeignId('archived_by');
            $table->dropColumn('archived_at');
        });
    }
};
