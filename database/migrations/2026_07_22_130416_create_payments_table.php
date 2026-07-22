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
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('installment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('enrollment_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 10, 2);
            $table->enum('method', ['CASH', 'GCASH']);
            $table->enum('status', ['PENDING', 'COMPLETED', 'FAILED'])->default('PENDING');
            $table->foreignId('recorded_by')->nullable()->constrained('users');
            $table->string('paymongo_payment_intent_id')->nullable();
            $table->string('paymongo_source_id')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });
    }
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
