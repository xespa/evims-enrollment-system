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
        Schema::table('office_verifications', function (Blueprint $table) {
            $table->string('form_138_path')->nullable()->after('has_good_moral_certificate');
            $table->string('birth_certificate_path')->nullable()->after('form_138_path');
            $table->string('good_moral_path')->nullable()->after('birth_certificate_path');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('office_verifications', function (Blueprint $table) {
            $table->dropColumn(['form_138_path', 'birth_certificate_path', 'good_moral_path']);
        });
    }
};
