<?php

use App\Models\Enrollment;
use App\Models\GradeLevel;
use Database\Seeders\GradeLevelSeeder;
use Database\Seeders\SubjectSeeder;

test('the seeders create the pre-elementary levels with their fees and subjects', function () {
    $this->seed([GradeLevelSeeder::class, SubjectSeeder::class]);

    $levels = GradeLevel::orderBy('level_order')->get();

    expect($levels->pluck('name')->take(4)->all())->toBe(['Nursery', 'Pre-K 1', 'Pre-K 2', 'Grade 1'])
        ->and($levels)->toHaveCount(13)
        ->and($levels->where('name', 'Grade 10')->first()->level_order)->toBe(12);

    foreach (['Nursery', 'Pre-K 1', 'Pre-K 2'] as $name) {
        $curriculum = $levels->firstWhere('name', $name)->curriculumFor(Enrollment::currentSchoolYear());

        expect((float) $curriculum->tuition_fee)->toBe(29401.0)
            ->and($curriculum->subjects()->count())->toBe(5);
    }
});
