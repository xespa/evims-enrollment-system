<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A plain string, so a new App\Enums\PaymentMethod case doesn't need
     * a schema change.
     */
    public function up(): void
    {
        Schema::table('billing_contracts', function (Blueprint $table) {
            $table->string('payment_channel', 20)->default('COUNTER')->change();
        });
    }

    public function down(): void
    {
        Schema::table('billing_contracts', function (Blueprint $table) {
            $table->enum('payment_channel', ['COUNTER', 'GCASH'])->default('COUNTER')->change();
        });
    }
};
