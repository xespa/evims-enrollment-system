<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Counter payments recorded by mistake are voided, never deleted or edited:
 * the payment stays on record with who voided it, when, and why, and stops
 * counting toward what's been paid.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->enum('status', ['PENDING', 'COMPLETED', 'FAILED', 'VOIDED'])->default('PENDING')->change();
            $table->timestamp('voided_at')->nullable()->after('paid_at');
            $table->foreignId('voided_by')->nullable()->after('voided_at')->constrained('users');
            $table->string('void_reason')->nullable()->after('voided_by');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('voided_by');
            $table->dropColumn(['voided_at', 'void_reason']);
        });

        // Voided payments were never counted as paid, so they go back to FAILED.
        DB::table('payments')->where('status', 'VOIDED')->update(['status' => 'FAILED']);

        Schema::table('payments', function (Blueprint $table) {
            $table->enum('status', ['PENDING', 'COMPLETED', 'FAILED'])->default('PENDING')->change();
        });
    }
};
