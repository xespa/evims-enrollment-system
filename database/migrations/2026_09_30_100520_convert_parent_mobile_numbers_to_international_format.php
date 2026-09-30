<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private const FIELDS = ['father_mobile_no', 'mother_mobile_no'];

    /**
     * Mobile numbers can now be from any country, so the Philippine ones
     * saved as "09171234567" become "+639171234567" like the rest.
     */
    public function up(): void
    {
        foreach (self::FIELDS as $field) {
            DB::table('parent_profiles')
                ->where($field, 'like', '09_________')
                ->orderBy('id')
                ->each(function (object $profile) use ($field) {
                    DB::table('parent_profiles')
                        ->where('id', $profile->id)
                        ->update([$field => '+63'.substr($profile->{$field}, 1)]);
                });
        }
    }

    /**
     * Philippine numbers go back to "09…"; other countries' numbers have no
     * local form to go back to, so they're kept as they are.
     */
    public function down(): void
    {
        foreach (self::FIELDS as $field) {
            DB::table('parent_profiles')
                ->where($field, 'like', '+639_________')
                ->orderBy('id')
                ->each(function (object $profile) use ($field) {
                    DB::table('parent_profiles')
                        ->where('id', $profile->id)
                        ->update([$field => '0'.substr($profile->{$field}, 3)]);
                });
        }
    }
};
