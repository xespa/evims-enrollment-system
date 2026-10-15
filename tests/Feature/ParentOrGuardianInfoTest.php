<?php

use App\Actions\Enrollment\GenerateRegistrationForm;
use App\Enums\ParentInfoType;
use App\Models\EnrolleeUser;
use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\ParentProfile;
use App\Models\Subject;

/**
 * A grade level open for applications, with a subject to enroll in, and a
 * signed-in portal account to apply from.
 */
function gradeLevelToApplyFor(): GradeLevel
{
    test()->actingAs(EnrolleeUser::factory()->create(), 'enrollee');

    $gradeLevel = GradeLevel::factory()->totalFee(30000)->create();
    Subject::create(['curriculum_id' => $gradeLevel->curricula()->first()->id, 'name' => 'Math']);

    return $gradeLevel;
}

/**
 * @return array<string, string>
 */
function guardianDetails(): array
{
    return [
        'parent_info_type' => 'GUARDIAN',
        'guardian_last_name' => 'Santos',
        'guardian_first_name' => 'Maria',
        'guardian_middle_name' => 'Reyes',
        'guardian_relationship' => 'Grandmother',
        'guardian_occupation' => 'Retired teacher',
        'guardian_name_of_office' => 'None',
        'guardian_mobile_no' => '0917 123 4567',
    ];
}

test('choosing guardian saves only the guardian\'s details', function () {
    $gradeLevel = gradeLevelToApplyFor();

    $this->post(route('admission.store'), validEnrollmentPayload($gradeLevel, [
        ...guardianDetails(),
        // Typed in before switching to Guardian; not kept.
        'father_last_name' => 'Dela Cruz',
        'mother_first_name' => 'Ana',
    ]))->assertSessionHasNoErrors();

    $profile = Enrollment::sole()->student->parentProfile;

    expect($profile->info_type)->toBe(ParentInfoType::Guardian)
        ->and($profile->guardian_last_name)->toBe('Santos')
        ->and($profile->guardian_first_name)->toBe('Maria')
        ->and($profile->guardian_relationship)->toBe('Grandmother')
        ->and($profile->guardian_mobile_no)->toBe('+639171234567')
        ->and($profile->father_last_name)->toBeNull()
        ->and($profile->mother_first_name)->toBeNull()
        ->and($profile->contactMobileNo())->toBe('+639171234567');
});

test('choosing parents saves only the parents\' details', function () {
    $gradeLevel = gradeLevelToApplyFor();

    $this->post(route('admission.store'), validEnrollmentPayload($gradeLevel, [
        ...guardianDetails(),
        'parent_info_type' => 'PARENTS',
        'father_last_name' => 'Dela Cruz',
        'mother_mobile_no' => '0918 765 4321',
    ]))->assertSessionHasNoErrors();

    $profile = Enrollment::sole()->student->parentProfile;

    expect($profile->info_type)->toBe(ParentInfoType::Parents)
        ->and($profile->father_last_name)->toBe('Dela Cruz')
        ->and($profile->guardian_last_name)->toBeNull()
        ->and($profile->guardian_mobile_no)->toBeNull()
        ->and($profile->contactMobileNo())->toBe('+639187654321');
});

test('a guardian needs a name and their relationship to the child', function (string $field) {
    $gradeLevel = gradeLevelToApplyFor();

    $this->post(route('admission.store'), validEnrollmentPayload($gradeLevel, [...guardianDetails(), $field => '']))
        ->assertSessionHasErrors($field);

    expect(Enrollment::count())->toBe(0);
})->with(['guardian_last_name', 'guardian_first_name', 'guardian_relationship']);

test('the guardian\'s mobile number must be valid', function () {
    $gradeLevel = gradeLevelToApplyFor();

    $this->post(route('admission.store'), validEnrollmentPayload($gradeLevel, [...guardianDetails(), 'guardian_mobile_no' => 'call me']))
        ->assertSessionHasErrors('guardian_mobile_no');
});

test('the form must say whose details are given', function (?string $type) {
    $gradeLevel = gradeLevelToApplyFor();

    $this->post(route('admission.store'), validEnrollmentPayload($gradeLevel, ['parent_info_type' => $type]))
        ->assertSessionHasErrors('parent_info_type');
})->with([
    'missing' => [null],
    'unknown' => ['NEIGHBOR'],
]);

test('the registration form prints the guardian in place of the parents', function () {
    $enrollment = Enrollment::factory()->create();
    ParentProfile::create([
        'student_id' => $enrollment->student_id,
        'info_type' => ParentInfoType::Guardian,
        'guardian_last_name' => 'Santos',
        'guardian_first_name' => 'Maria',
        'guardian_relationship' => 'Grandmother',
    ]);

    $html = view('pdf.registration-form', app(GenerateRegistrationForm::class)->viewData($enrollment))->render();

    expect($html)->toContain("GUARDIAN'S INFORMATION")
        ->toContain('SANTOS, MARIA')
        ->toContain('GRANDMOTHER')
        ->not->toContain("PARENT'S INFORMATION");
});
