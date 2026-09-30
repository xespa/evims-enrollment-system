<?php

use App\Models\ParentProfile;
use App\Models\Student;

function convertMobileNumbersMigration(): object
{
    return require database_path('migrations/2026_09_30_100520_convert_parent_mobile_numbers_to_international_format.php');
}

test('saved philippine mobile numbers are converted to international form', function () {
    $profile = ParentProfile::create([
        'student_id' => Student::factory()->create()->id,
        'father_mobile_no' => '09171234567',
        'mother_mobile_no' => '09281234567',
    ]);

    convertMobileNumbersMigration()->up();

    expect($profile->fresh())
        ->father_mobile_no->toBe('+639171234567')
        ->mother_mobile_no->toBe('+639281234567');
});

test('numbers that are not saved philippine mobiles are left alone', function () {
    $profile = ParentProfile::create([
        'student_id' => Student::factory()->create()->id,
        'father_mobile_no' => '+14155552671',
        'mother_mobile_no' => null,
    ]);

    convertMobileNumbersMigration()->up();

    expect($profile->fresh())
        ->father_mobile_no->toBe('+14155552671')
        ->mother_mobile_no->toBeNull();
});

test('rolling back turns philippine numbers back into their local form', function () {
    $profile = ParentProfile::create([
        'student_id' => Student::factory()->create()->id,
        'father_mobile_no' => '+639171234567',
        'mother_mobile_no' => '+447911123456',
    ]);

    convertMobileNumbersMigration()->down();

    expect($profile->fresh())
        ->father_mobile_no->toBe('09171234567')
        ->mother_mobile_no->toBe('+447911123456');
});
