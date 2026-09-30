<?php

use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\Subject;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| The closure you provide to your test functions is always bound to a specific PHPUnit test
| case class. By default, that class is "PHPUnit\Framework\TestCase". Of course, you may
| need to change it using the "pest()" function to bind different classes or traits.
|
*/

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
|
| When you're writing tests, you often need to check that values meet certain conditions. The
| "expect()" function gives you access to a set of "expectations" methods that you can use
| to assert different things. Of course, you may extend the Expectation API at any time.
|
*/

expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
|
| While Pest is very powerful out-of-the-box, you may have some testing code specific to your
| project that you don't want to repeat in every file. Here you can also expose helpers as
| global functions to help you to reduce the number of lines of code in your test files.
|
*/

function something()
{
    // ..
}

/**
 * A complete, valid admission form submission for the given grade level,
 * applying for the current school year with all of that year's subjects.
 *
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function validEnrollmentPayload(GradeLevel $gradeLevel, array $overrides = []): array
{
    return array_merge([
        'student_type' => 'NO_LRN',
        'lrn' => null,
        'psa_birth_cert_no' => '123-4567-89012',
        'last_name' => 'Dela Cruz',
        'first_name' => 'Juan',
        'middle_name' => 'Santos',
        'extension_name' => null,
        'date_of_birth' => '2015-05-10',
        'sex' => 'MALE',

        'grade_level_id' => $gradeLevel->id,
        'school_year' => Enrollment::currentSchoolYear(),
        'date_of_application' => now()->toDateString(),
        'age' => 10,
        'session_time_preference' => 'MORNING_SESSION',
        'email' => 'parent@example.com',

        'barangay' => 'Balud',
        'city_municipality' => 'Borongan City',
        'city_code' => '0826-01',
        'province' => 'Eastern Samar',
        'province_code' => '0826',
        'country' => 'Philippines',
        'zip_code' => '6800',

        'subject_ids' => Subject::whereIn('curriculum_id', $gradeLevel->curricula()->pluck('id'))->pluck('id')->toArray(),

        'payment_option' => 'MONTHLY',
        'payment_channel' => 'COUNTER',
    ], $overrides);
}
