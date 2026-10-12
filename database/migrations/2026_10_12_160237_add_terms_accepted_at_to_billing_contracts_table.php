<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * When the parent agreed to the tuition terms and withdrawal procedure
     * while applying. Null for contracts made before the agreement was asked.
     */
    public function up(): void
    {
        Schema::table('billing_contracts', function (Blueprint $table) {
            $table->timestamp('terms_accepted_at')->nullable()->after('total_fee');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('billing_contracts', function (Blueprint $table) {
            $table->dropColumn('terms_accepted_at');
        });
    }
};
