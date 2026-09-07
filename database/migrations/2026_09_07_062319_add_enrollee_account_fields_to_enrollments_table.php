<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('enrollments', function (Blueprint $table) {
            if (! Schema::hasColumn('enrollments', 'enrollee_user_id')) {
                $table->foreignId('enrollee_user_id')->nullable()->after('student_id')
                    ->constrained('enrollee_users')->nullOnDelete();
            }

            if (! Schema::hasColumn('enrollments', 'cancelled_at')) {
                $table->timestamp('cancelled_at')->nullable()->after('enrollment_status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('enrollments', function (Blueprint $table) {
            if (Schema::hasColumn('enrollments', 'enrollee_user_id')) {
                $table->dropConstrainedForeignId('enrollee_user_id');
            }

            if (Schema::hasColumn('enrollments', 'cancelled_at')) {
                $table->dropColumn('cancelled_at');
            }
        });
    }
};
