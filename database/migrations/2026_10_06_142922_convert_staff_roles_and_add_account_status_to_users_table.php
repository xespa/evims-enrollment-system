<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Roles move from a database enum to a string backed by App\Enums\UserRole,
     * and the old catch-all STAFF role becomes CASHIER.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role', 20)->default('CASHIER')->change();
            $table->timestamp('invited_at')->nullable()->after('role');
            $table->timestamp('deactivated_at')->nullable()->after('invited_at');
            $table->index('role');
        });

        DB::table('users')->where('role', 'STAFF')->update(['role' => 'CASHIER']);
    }

    public function down(): void
    {
        DB::table('users')->whereNot('role', 'ADMIN')->update(['role' => 'STAFF']);

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['role']);
            $table->dropColumn(['invited_at', 'deactivated_at']);
            $table->enum('role', ['ADMIN', 'STAFF'])->default('STAFF')->change();
        });
    }
};
