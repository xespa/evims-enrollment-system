<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A newly set-up school year starts as a draft the admin reviews, then
 * saves (opening it for enrollment) or cancels (discarding it).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('curricula', function (Blueprint $table) {
            $table->boolean('is_draft')->default(false)->after('school_year');
        });
    }

    public function down(): void
    {
        Schema::table('curricula', function (Blueprint $table) {
            $table->dropColumn('is_draft');
        });
    }
};
