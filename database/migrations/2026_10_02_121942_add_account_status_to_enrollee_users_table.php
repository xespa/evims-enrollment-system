<?php

use App\Enums\AccountStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('enrollee_users', function (Blueprint $table) {
            $table->string('account_status')->default(AccountStatus::Pending->value)->after('password')->index();
            $table->timestamp('reviewed_at')->nullable()->after('account_status');
            $table->foreignId('reviewed_by')->nullable()->after('reviewed_at')->constrained('users')->nullOnDelete();
            $table->string('rejection_reason', 500)->nullable()->after('reviewed_by');
        });

        // Accounts that already use the portal keep their access.
        DB::table('enrollee_users')->update([
            'account_status' => AccountStatus::Approved->value,
            'reviewed_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('enrollee_users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('reviewed_by');
            $table->dropColumn(['account_status', 'reviewed_at', 'rejection_reason']);
        });
    }
};
