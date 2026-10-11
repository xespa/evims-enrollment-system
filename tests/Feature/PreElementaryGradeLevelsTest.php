<?php

use App\Models\Curriculum;
use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\GradeLevelSeeder;
use Database\Seeders\StaffAccountSeeder;
use Database\Seeders\SubjectSeeder;

test('a full seed bills every grade level its total fee, not ₱0', function () {
    $this->seed(DatabaseSeeder::class);

    $curricula = Curriculum::all();

    expect($curricula)->toHaveCount(13)
        ->and($curricula->every(fn (Curriculum $curriculum) => (float) $curriculum->tuition_fee === $curriculum->computeTotalFee()
            && $curriculum->computeTotalFee() > 0))->toBeTrue();
});

test('a full seed creates one sign-in for every staff role', function () {
    $this->seed(DatabaseSeeder::class);

    expect(User::orderBy('email')->pluck('role', 'email')->map->value->all())->toBe([
        'admin@example.com' => 'ADMIN',
        'cashier@example.com' => 'CASHIER',
        'registrar@example.com' => 'REGISTRAR',
        'teacher@example.com' => 'TEACHER',
        'test@example.com' => 'CASHIER',
    ]);
});

test('the staff accounts can be seeded again without duplicates', function () {
    $this->seed(StaffAccountSeeder::class);
    $this->seed(StaffAccountSeeder::class);

    expect(User::count())->toBe(3);
});

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
