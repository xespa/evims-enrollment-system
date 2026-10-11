<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The rest of what the cashier writes on the paper acknowledgement receipt:
 * who handed over the money, and whether it was paid in cash or by check
 * (with the check's bank, number and date).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->string('received_from', 150)->nullable()->after('receipt_number');
            $table->string('payment_form', 10)->nullable()->after('received_from');
            $table->string('check_bank', 100)->nullable()->after('payment_form');
            $table->string('check_number', 50)->nullable()->after('check_bank');
            $table->date('check_date')->nullable()->after('check_number');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn(['received_from', 'payment_form', 'check_bank', 'check_number', 'check_date']);
        });
    }
};
