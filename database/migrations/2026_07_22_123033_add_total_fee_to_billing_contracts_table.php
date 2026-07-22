<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('billing_contracts', function (Blueprint $table) {
            $table->decimal('total_fee', 10, 2)->after('payment_option');
        });

        DB::statement("ALTER TABLE billing_contracts MODIFY payment_option ENUM('MONTHLY', 'BI_MONTHLY', 'FULL_PAYMENT') NOT NULL");
    }

    public function down(): void
    {
        Schema::table('billing_contracts', function (Blueprint $table) {
            $table->dropColumn('total_fee');
        });

        DB::statement("ALTER TABLE billing_contracts MODIFY payment_option ENUM('MONTHLY', 'BI_MONTHLY') NOT NULL");
    }
};
