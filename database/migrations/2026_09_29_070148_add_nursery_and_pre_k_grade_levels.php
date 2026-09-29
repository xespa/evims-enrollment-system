<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Pre-Elementary becomes three levels: Nursery (age 3), Pre-K 1 (age 4)
     * and Pre-K 2 (age 5). The existing Kinder level is renamed to Pre-K 2 so
     * its enrollments and subjects carry over, and every level shifts down
     * two places to make room for the new ones at the front.
     */
    public function up(): void
    {
        $preK2 = DB::table('grade_levels')->where('name', 'Kinder')->first();

        if (! $preK2) {
            return;
        }

        DB::table('grade_levels')->increment('level_order', 2);
        DB::table('grade_levels')->where('id', $preK2->id)->update(['name' => 'Pre-K 2']);

        $fees = [
            'registration_fee' => $preK2->registration_fee,
            'miscellaneous_fee' => $preK2->miscellaneous_fee,
            'monthly_tuition' => $preK2->monthly_tuition,
            'monthly_laboratory_fee' => $preK2->monthly_laboratory_fee,
            'books_fee' => $preK2->books_fee,
            'tuition_fee' => $preK2->tuition_fee,
        ];

        $subjects = DB::table('subjects')->where('grade_level_id', $preK2->id)->get(['name', 'code']);

        foreach (['Nursery' => 0, 'Pre-K 1' => 1] as $name => $levelOrder) {
            $gradeLevelId = DB::table('grade_levels')->insertGetId([
                'name' => $name,
                'level_order' => $levelOrder,
                ...$fees,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('subjects')->insert($subjects->map(fn ($subject) => [
                'grade_level_id' => $gradeLevelId,
                'name' => $subject->name,
                'code' => $subject->code,
                'created_at' => now(),
                'updated_at' => now(),
            ])->all());
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $preK2 = DB::table('grade_levels')->where('name', 'Pre-K 2')->first();

        if (! $preK2) {
            return;
        }

        DB::table('grade_levels')->whereIn('name', ['Nursery', 'Pre-K 1'])->delete();
        DB::table('grade_levels')->where('id', $preK2->id)->update(['name' => 'Kinder']);
        DB::table('grade_levels')->decrement('level_order', 2);
    }
};
