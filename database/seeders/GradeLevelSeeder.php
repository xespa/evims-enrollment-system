<?php

namespace Database\Seeders;

use App\Models\GradeLevel;
use Illuminate\Database\Seeder;

class GradeLevelSeeder extends Seeder
{
    public function run(): void
    {
        $levels = [
            ['name' => 'Kinder', 'level_order' => 0],
            ['name' => 'Grade 1', 'level_order' => 1],
            ['name' => 'Grade 2', 'level_order' => 2],
            ['name' => 'Grade 3', 'level_order' => 3],
            ['name' => 'Grade 4', 'level_order' => 4],
            ['name' => 'Grade 5', 'level_order' => 5],
            ['name' => 'Grade 6', 'level_order' => 6],
            ['name' => 'Grade 7', 'level_order' => 7],
            ['name' => 'Grade 8', 'level_order' => 8],
            ['name' => 'Grade 9', 'level_order' => 9],
            ['name' => 'Grade 10', 'level_order' => 10],
        ];

        foreach ($levels as $level) {
            GradeLevel::create($level);
        }
    }
}
