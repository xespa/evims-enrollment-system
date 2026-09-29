<?php

use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\Subject;
use Database\Seeders\GradeLevelSeeder;
use Database\Seeders\SubjectSeeder;

test('the migration renames Kinder to Pre-K 2 and adds Nursery and Pre-K 1 before it', function () {
    $kinder = GradeLevel::factory()->create([
        'name' => 'Kinder',
        'level_order' => 0,
        'registration_fee' => 1725,
        'miscellaneous_fee' => 5175,
        'monthly_tuition' => 1725,
        'monthly_laboratory_fee' => 0,
        'books_fee' => 5251,
    ]);
    $gradeOne = GradeLevel::factory()->create(['name' => 'Grade 1', 'level_order' => 1]);
    Subject::factory()->for($kinder)->create(['name' => 'Numeracy']);
    $enrollment = Enrollment::factory()->create(['grade_level_id' => $kinder->id]);

    $migration = require database_path('migrations/2026_09_29_070148_add_nursery_and_pre_k_grade_levels.php');
    $migration->up();

    expect(GradeLevel::orderBy('level_order')->pluck('name')->all())
        ->toBe(['Nursery', 'Pre-K 1', 'Pre-K 2', 'Grade 1'])
        ->and($kinder->fresh()->name)->toBe('Pre-K 2')
        ->and($gradeOne->fresh()->level_order)->toBe(3)
        ->and($enrollment->fresh()->grade_level_id)->toBe($kinder->id);

    foreach (['Nursery', 'Pre-K 1'] as $name) {
        $gradeLevel = GradeLevel::where('name', $name)->first();

        expect((float) $gradeLevel->tuition_fee)->toBe(29401.0)
            ->and($gradeLevel->subjects()->pluck('name')->all())->toBe(['Numeracy']);
    }
});

test('the seeders create the pre-elementary levels with their fees and subjects', function () {
    $this->seed([GradeLevelSeeder::class, SubjectSeeder::class]);

    $levels = GradeLevel::orderBy('level_order')->get();

    expect($levels->pluck('name')->take(4)->all())->toBe(['Nursery', 'Pre-K 1', 'Pre-K 2', 'Grade 1'])
        ->and($levels)->toHaveCount(13)
        ->and($levels->where('name', 'Grade 10')->first()->level_order)->toBe(12);

    foreach (['Nursery', 'Pre-K 1', 'Pre-K 2'] as $name) {
        $gradeLevel = $levels->firstWhere('name', $name);

        expect((float) $gradeLevel->tuition_fee)->toBe(29401.0)
            ->and($gradeLevel->subjects()->count())->toBe(5);
    }
});
