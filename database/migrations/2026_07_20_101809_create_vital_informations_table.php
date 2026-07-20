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
        Schema::create('vital_informations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('enrollment_id')->constrained()->cascadeOnDelete();
            $table->boolean('has_attended_summer_school')->default(false);
            $table->boolean('has_emotional_mental_physical_difficulties')->default(false);
            $table->boolean('has_learning_difficulties')->default(false);
            $table->boolean('has_extended_absences')->default(false);
            $table->boolean('shows_special_abilities_interests')->default(false);
            $table->boolean('has_been_expelled')->default(false);
            $table->boolean('has_been_suspended')->default(false);
            $table->boolean('has_repeated_a_grade')->default(false);
            $table->text('history_particulars')->nullable();
            $table->text('special_health_problems')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vital_informations');
    }
};
