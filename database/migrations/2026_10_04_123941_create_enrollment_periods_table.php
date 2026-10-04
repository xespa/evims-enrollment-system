<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * When applications for a school year are accepted. The *_sent_at columns
 * record which reminders the admins already got for the current dates, so
 * the daily reminder run never sends one twice.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('enrollment_periods', function (Blueprint $table) {
            $table->id();
            $table->string('school_year', 9)->unique();
            $table->date('opens_on');
            $table->date('closes_on');
            $table->timestamp('opening_reminder_sent_at')->nullable();
            $table->timestamp('closing_reminder_sent_at')->nullable();
            $table->timestamp('closed_notice_sent_at')->nullable();
            $table->timestamps();

            $table->index(['opens_on', 'closes_on']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('enrollment_periods');
    }
};
