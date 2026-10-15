<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Lets the admission form take a guardian's details in place of the
 * father's and mother's. Existing profiles are parents' details.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('parent_profiles', function (Blueprint $table) {
            $table->string('info_type', 20)->default('PARENTS')->after('student_id');
            $table->string('guardian_last_name')->nullable()->after('mother_mobile_no');
            $table->string('guardian_first_name')->nullable()->after('guardian_last_name');
            $table->string('guardian_middle_name')->nullable()->after('guardian_first_name');
            $table->string('guardian_relationship')->nullable()->after('guardian_middle_name');
            $table->string('guardian_occupation')->nullable()->after('guardian_relationship');
            $table->string('guardian_name_of_office')->nullable()->after('guardian_occupation');
            $table->string('guardian_mobile_no', 20)->nullable()->after('guardian_name_of_office');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('parent_profiles', function (Blueprint $table) {
            $table->dropColumn([
                'info_type',
                'guardian_last_name',
                'guardian_first_name',
                'guardian_middle_name',
                'guardian_relationship',
                'guardian_occupation',
                'guardian_name_of_office',
                'guardian_mobile_no',
            ]);
        });
    }
};
