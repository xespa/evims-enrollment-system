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
        Schema::table('billing_contracts', function (Blueprint $table) {
            $table->enum('payment_channel', ['COUNTER', 'GCASH'])->default('COUNTER')->after('payment_option');
        });
    }

    public function down(): void
    {
        Schema::table('billing_contracts', function (Blueprint $table) {
            $table->dropColumn('payment_channel');
        });
    }
};
