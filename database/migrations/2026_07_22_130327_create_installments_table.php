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
        Schema::create('installments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('billing_contract_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('installment_number');
            $table->decimal('amount_due', 10, 2);
            $table->date('due_date');
            $table->enum('status', ['UNPAID', 'PARTIALLY_PAID', 'PAID'])->default('UNPAID');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('installments');
    }
};
