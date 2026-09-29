<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('grade_levels', function (Blueprint $table) {
            $table->decimal('registration_fee', 10, 2)->default(0)->after('level_order');
            $table->decimal('miscellaneous_fee', 10, 2)->default(0)->after('registration_fee');
            $table->decimal('monthly_tuition', 10, 2)->default(0)->after('miscellaneous_fee');
            $table->decimal('monthly_laboratory_fee', 10, 2)->default(0)->after('monthly_tuition');
            $table->decimal('books_fee', 10, 2)->default(0)->after('monthly_laboratory_fee');
        });

        // Backfill the S.Y. 2026-2027 fee schedule from the school's flyer.
        // tuition_fee stays the billed total: one-time fees + books + 10 months.
        $preElementary = ['registration_fee' => 1725, 'miscellaneous_fee' => 5175, 'monthly_tuition' => 1725, 'monthly_laboratory_fee' => 0];
        $elementary = ['registration_fee' => 1725, 'miscellaneous_fee' => 6325, 'monthly_tuition' => 2070, 'monthly_laboratory_fee' => 690];
        $juniorHigh = ['registration_fee' => 1725, 'miscellaneous_fee' => 6125, 'monthly_tuition' => 1380, 'monthly_laboratory_fee' => 590];

        $schedule = [
            'Kinder' => [...$preElementary, 'books_fee' => 5251],
            'Grade 1' => [...$elementary, 'books_fee' => 5099],
            'Grade 2' => [...$elementary, 'books_fee' => 6194],
            'Grade 3' => [...$elementary, 'books_fee' => 7105],
            'Grade 4' => [...$elementary, 'books_fee' => 8041],
            'Grade 5' => [...$elementary, 'books_fee' => 8661],
            'Grade 6' => [...$elementary, 'books_fee' => 8621],
            'Grade 7' => [...$juniorHigh, 'books_fee' => 8841],
            'Grade 8' => [...$juniorHigh, 'books_fee' => 8841],
            'Grade 9' => [...$juniorHigh, 'books_fee' => 8841],
            'Grade 10' => [...$juniorHigh, 'books_fee' => 8841],
        ];

        foreach ($schedule as $name => $fees) {
            $fees['tuition_fee'] = $fees['registration_fee'] + $fees['miscellaneous_fee'] + $fees['books_fee']
                + 10 * ($fees['monthly_tuition'] + $fees['monthly_laboratory_fee']);

            DB::table('grade_levels')->where('name', $name)->update($fees);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('grade_levels', function (Blueprint $table) {
            $table->dropColumn([
                'registration_fee',
                'miscellaneous_fee',
                'monthly_tuition',
                'monthly_laboratory_fee',
                'books_fee',
            ]);
        });
    }
};
