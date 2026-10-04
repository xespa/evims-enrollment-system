<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * When a parent is to bring documents to the registrar's office in person,
 * for applications whose documents can't be uploaded yet. One per
 * application; rescheduling replaces it.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('enrollment_id')->unique()->constrained()->cascadeOnDelete();
            $table->date('scheduled_on');
            $table->time('scheduled_time')->nullable();
            $table->json('documents');
            $table->string('note', 500)->nullable();
            $table->foreignId('scheduled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('scheduled_on');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_appointments');
    }
};
