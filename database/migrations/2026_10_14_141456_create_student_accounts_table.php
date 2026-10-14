<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A student's sign-in account, bound to the student (and so to their
     * LRN), created only with a parent or guardian's emailed consent.
     */
    public function up(): void
    {
        Schema::create('student_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('status', 20)->default('AWAITING_CONSENT')->index();
            $table->string('password')->nullable();
            $table->rememberToken();

            // The consent request: who it went to, when, and a hashed
            // one-time token for the emailed link.
            $table->string('consent_email');
            $table->string('consent_token', 64)->nullable()->unique();
            $table->timestamp('consent_requested_at');
            $table->timestamp('consent_expires_at')->nullable();
            $table->foreignId('consent_requested_by')->nullable()->constrained('users')->nullOnDelete();

            // The parent's answer.
            $table->string('consent_given_by')->nullable();
            $table->timestamp('consent_responded_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_accounts');
    }
};
