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
            // Nullable only for accounts created before the ID was required.
            $table->string('valid_id_path')->nullable()->after('profile_photo_path');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('enrollee_users', function (Blueprint $table) {
            $table->dropColumn('valid_id_path');
        });
    }
};
