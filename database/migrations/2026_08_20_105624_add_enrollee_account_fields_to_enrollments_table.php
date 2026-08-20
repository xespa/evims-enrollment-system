<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('enrollments', function (Blueprint $table) {
            $table->foreignId('enrollee_user_id')->nullable()->after('student_id')
                ->constrained('enrollee_users')->nullOnDelete();
            $table->timestamp('cancelled_at')->nullable()->after('enrollment_status');
        });
    }

    public function down(): void
    {
        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('enrollee_user_id');
            $table->dropColumn('cancelled_at');
        });
    }
};
