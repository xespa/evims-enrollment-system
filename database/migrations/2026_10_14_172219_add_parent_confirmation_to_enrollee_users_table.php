<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A student's portal account needs a parent or guardian to confirm it
     * from an emailed one-time link before the school reviews it. Parent
     * accounts leave these empty.
     */
    public function up(): void
    {
        Schema::table('enrollee_users', function (Blueprint $table) {
            $table->string('parent_email')->nullable()->after('account_type');
            $table->string('parent_confirmation_status', 20)->nullable()->after('parent_email')->index();
            $table->string('parent_confirmation_token', 64)->nullable()->unique()->after('parent_confirmation_status');
            $table->timestamp('parent_confirmation_expires_at')->nullable()->after('parent_confirmation_token');
            $table->timestamp('parent_responded_at')->nullable()->after('parent_confirmation_expires_at');
        });
    }

    public function down(): void
    {
        Schema::table('enrollee_users', function (Blueprint $table) {
            $table->dropIndex(['parent_confirmation_status']);
            $table->dropUnique(['parent_confirmation_token']);
            $table->dropColumn([
                'parent_email',
                'parent_confirmation_status',
                'parent_confirmation_token',
                'parent_confirmation_expires_at',
                'parent_responded_at',
            ]);
        });
    }
};
