<?php

use App\Models\Address;
use App\Models\BillingContract;
use App\Models\Curriculum;
use App\Models\EnrolleeUser;
use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\OfficeVerification;
use App\Models\Subject;
use App\Models\VitalInformation;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

function actingAsEnrollee(): EnrolleeUser
{
    $enrollee = EnrolleeUser::factory()->create();
    test()->actingAs($enrollee, 'enrollee');

    return $enrollee;
}

test('submitting the admission form creates the full enrollment record set', function () {
    Storage::fake('public');
    actingAsEnrollee();

    $gradeLevel = GradeLevel::factory()->totalFee(30000)->create();
    Subject::create(['curriculum_id' => $gradeLevel->curricula()->first()->id, 'name' => 'Math', 'code' => 'MATH1']);

    $payload = validEnrollmentPayload($gradeLevel, [
        'form_138' => UploadedFile::fake()->create('form138.pdf', 200, 'application/pdf'),
        'birth_certificate' => UploadedFile::fake()->image('birth.jpg'),
        'good_moral_certificate' => UploadedFile::fake()->create('good-moral.pdf', 200, 'application/pdf'),
    ]);

    $response = $this->post(route('admission.store'), $payload);

    $enrollment = Enrollment::first();
    expect($enrollment)->not->toBeNull();
    $response->assertRedirect(route('admission.success', $enrollment->id));

    // Vital information is now actually created (previously a no-op placeholder).
    expect(VitalInformation::where('enrollment_id', $enrollment->id)->exists())->toBeTrue();

    // The PSGC codes picked in the address dropdowns are saved alongside the
    // readable names, not just discarded after validation.
    $address = Address::where('student_id', $enrollment->student_id)->first();
    expect($address)->not->toBeNull();
    expect($address->province_code)->toBe('0826');
    expect($address->city_code)->toBe('0826-01');

    // Billing contract + installment schedule are now actually created.
    $billingContract = BillingContract::where('enrollment_id', $enrollment->id)->first();
    expect($billingContract)->not->toBeNull();
    expect((float) $billingContract->total_fee)->toBe(30000.0);
    expect($billingContract->installments()->count())->toBeGreaterThan(0);

    // Office verification row + the three uploaded documents now exist.
    $verification = OfficeVerification::where('enrollment_id', $enrollment->id)->first();
    expect($verification)->not->toBeNull();
    expect($verification->form_138_path)->not->toBeNull();
    expect($verification->birth_certificate_path)->not->toBeNull();
    expect($verification->good_moral_path)->not->toBeNull();
    Storage::disk('public')->assertExists($verification->form_138_path);
    Storage::disk('public')->assertExists($verification->birth_certificate_path);
    Storage::disk('public')->assertExists($verification->good_moral_path);

    // Newly uploaded documents start unverified — the registrar hasn't looked yet.
    expect($verification->has_form_138)->toBeFalse();
    expect($verification->has_birth_certificate)->toBeFalse();
    expect($verification->has_good_moral_certificate)->toBeFalse();
});

test('the date of application is always the day it is submitted, not the date sent by the form', function () {
    // 7 AM in Manila is still the previous day in UTC.
    $this->travelTo(Carbon::parse('2026-09-30 07:00', 'Asia/Manila'));
    actingAsEnrollee();

    $gradeLevel = GradeLevel::factory()->withCurriculum()->create();
    Subject::create(['curriculum_id' => $gradeLevel->curricula()->first()->id, 'name' => 'Math', 'code' => 'MATH1']);

    $this->post(route('admission.store'), validEnrollmentPayload($gradeLevel, [
        'date_of_application' => '2020-01-01',
    ]))->assertSessionHasNoErrors();

    expect(Enrollment::first()->date_of_application->toDateString())->toBe('2026-09-30');
});

test('documents are optional at submission', function () {
    Storage::fake('public');
    actingAsEnrollee();

    $gradeLevel = GradeLevel::factory()->totalFee(30000)->create();
    Subject::create(['curriculum_id' => $gradeLevel->curricula()->first()->id, 'name' => 'Math', 'code' => 'MATH1']);

    $payload = validEnrollmentPayload($gradeLevel);

    $response = $this->post(route('admission.store'), $payload);

    $enrollment = Enrollment::first();
    $response->assertRedirect(route('admission.success', $enrollment->id));

    $verification = OfficeVerification::where('enrollment_id', $enrollment->id)->first();
    expect($verification)->not->toBeNull();
    expect($verification->form_138_path)->toBeNull();
    expect($verification->birth_certificate_path)->toBeNull();
    expect($verification->good_moral_path)->toBeNull();

    $billingContract = BillingContract::where('enrollment_id', $enrollment->id)->first();
    expect($billingContract)->not->toBeNull();
});

test('document uploads are validated for file type', function () {
    actingAsEnrollee();
    $gradeLevel = GradeLevel::factory()->totalFee(30000)->create();
    Subject::create(['curriculum_id' => $gradeLevel->curricula()->first()->id, 'name' => 'Math', 'code' => 'MATH1']);

    $payload = validEnrollmentPayload($gradeLevel, [
        'form_138' => UploadedFile::fake()->create('form138.exe', 200, 'application/x-msdownload'),
    ]);

    $this->post(route('admission.store'), $payload)
        ->assertSessionHasErrors('form_138');

    expect(Enrollment::count())->toBe(0);
});

test('a second application for the same school year is rejected while the first is still active', function () {
    actingAsEnrollee();
    $gradeLevel = GradeLevel::factory()->totalFee(30000)->create();
    Subject::create(['curriculum_id' => $gradeLevel->curricula()->first()->id, 'name' => 'Math', 'code' => 'MATH1']);

    $payload = validEnrollmentPayload($gradeLevel, [
        'student_type' => 'WITH_LRN',
        'lrn' => '12345678901234',
    ]);

    $this->post(route('admission.store'), $payload)->assertRedirect();
    expect(Enrollment::count())->toBe(1);
    expect(Enrollment::first()->enrollment_status)->toBe('PENDING');

    // Same LRN, same school year, application still pending — blocked.
    $this->post(route('admission.store'), $payload)
        ->assertSessionHasErrors('school_year');

    expect(Enrollment::count())->toBe(1);
});

test('a student can reapply for the same school year after their prior application was rejected', function () {
    actingAsEnrollee();
    $gradeLevel = GradeLevel::factory()->totalFee(30000)->create();
    Subject::create(['curriculum_id' => $gradeLevel->curricula()->first()->id, 'name' => 'Math', 'code' => 'MATH1']);

    $payload = validEnrollmentPayload($gradeLevel, [
        'student_type' => 'WITH_LRN',
        'lrn' => '12345678901234',
    ]);

    $this->post(route('admission.store'), $payload)->assertRedirect();
    $firstEnrollment = Enrollment::first();
    $firstEnrollment->update(['enrollment_status' => 'REJECTED']);

    // Same LRN, same school year, but the only prior application was rejected — allowed.
    $this->post(route('admission.store'), $payload)->assertRedirect();

    expect(Enrollment::count())->toBe(2);
});

test('guests cannot submit an application and are sent to log in', function () {
    $gradeLevel = GradeLevel::factory()->totalFee(30000)->create();
    Subject::create(['curriculum_id' => $gradeLevel->curricula()->first()->id, 'name' => 'Math', 'code' => 'MATH1']);

    $this->post(route('admission.store'), validEnrollmentPayload($gradeLevel))
        ->assertRedirect(route('portal.login'));

    expect(Enrollment::count())->toBe(0);
});

test('registering goes to the verification notice', function () {
    Storage::fake('local');

    $this->post(route('portal.register.store'), [
        'name' => 'Juan Dela Cruz',
        'email' => 'parent@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'valid_id' => UploadedFile::fake()->image('valid-id.jpg'),
        'account_type' => 'PARENT_GUARDIAN',
        'terms' => '1',
    ])->assertRedirect(route('portal.verification.notice'));

    expect(Enrollment::count())->toBe(0);
});

test('a student can reapply for the same school year after their prior application was cancelled', function () {
    actingAsEnrollee();
    $gradeLevel = GradeLevel::factory()->totalFee(30000)->create();
    Subject::create(['curriculum_id' => $gradeLevel->curricula()->first()->id, 'name' => 'Math', 'code' => 'MATH1']);

    $payload = validEnrollmentPayload($gradeLevel, [
        'student_type' => 'WITH_LRN',
        'lrn' => '12345678901234',
    ]);

    $this->post(route('admission.store'), $payload)->assertRedirect();
    $firstEnrollment = Enrollment::first();
    $firstEnrollment->update(['cancelled_at' => now()]);

    // Same LRN, same school year, but the only prior application was cancelled — allowed.
    $this->post(route('admission.store'), $payload)->assertRedirect();

    expect(Enrollment::count())->toBe(2);
});

test('the billed total and installments follow the grade level fee breakdown', function () {
    actingAsEnrollee();

    // Grade 1 fees from the S.Y. 2026-2027 flyer.
    $gradeLevel = GradeLevel::factory()->withCurriculum([
        'registration_fee' => 1725,
        'miscellaneous_fee' => 6325,
        'monthly_tuition' => 2070,
        'monthly_laboratory_fee' => 690,
        'books_fee' => 5099,
    ])->create();
    Subject::create(['curriculum_id' => $gradeLevel->curricula()->first()->id, 'name' => 'Math', 'code' => 'MATH1']);

    $this->post(route('admission.store'), validEnrollmentPayload($gradeLevel, ['payment_option' => 'MONTHLY']));

    $billingContract = Enrollment::first()->billingContract;
    $installments = $billingContract->installments;

    expect((float) $billingContract->total_fee)->toBe(40749.0)
        ->and($installments)->toHaveCount(10)
        ->and($installments->pluck('amount_due')->map(fn ($amount) => (float) $amount)->unique()->values()->all())->toBe([4074.9])
        ->and(round($installments->sum('amount_due'), 2))->toBe(40749.0);
});

test('an application is always for the newest open school year and priced from its fees', function () {
    actingAsEnrollee();
    $gradeLevel = GradeLevel::factory()->create();
    [$start] = explode('-', Enrollment::currentSchoolYear());
    $nextSchoolYear = ($start + 1).'-'.($start + 2);

    Curriculum::factory()->for($gradeLevel)->totalFee(30000)->create();
    $nextYear = Curriculum::factory()->for($gradeLevel)->totalFee(33000)->create(['school_year' => $nextSchoolYear]);
    $nextYearSubject = Subject::factory()->for($nextYear)->create();

    // The form sending the current year doesn't matter.
    $this->post(route('admission.store'), validEnrollmentPayload($gradeLevel, [
        'school_year' => Enrollment::currentSchoolYear(),
        'subject_ids' => [$nextYearSubject->id],
    ]))->assertRedirect();

    $enrollment = Enrollment::sole();

    expect($enrollment->school_year)->toBe($nextSchoolYear)
        ->and((float) $enrollment->billingContract->total_fee)->toBe(33000.0)
        ->and($enrollment->subjects->pluck('id')->all())->toBe([$nextYearSubject->id]);
});

test('a grade level not set up for the open school year cannot be applied for', function () {
    actingAsEnrollee();
    $gradeLevel = GradeLevel::factory()->totalFee(30000)->create();
    Subject::create(['curriculum_id' => $gradeLevel->curricula()->first()->id, 'name' => 'Math']);
    [$start] = explode('-', Enrollment::currentSchoolYear());
    $notSetUp = ($start + 1).'-'.($start + 2);
    // Another grade level opens next school year, but this one doesn't.
    Curriculum::factory()->for(GradeLevel::factory())->create(['school_year' => $notSetUp]);

    $this->post(route('admission.store'), validEnrollmentPayload($gradeLevel))
        ->assertSessionHasErrors(['school_year' => "Enrollment for S.Y. {$notSetUp} isn't open for this grade level yet."]);

    expect(Enrollment::count())->toBe(0);
});

test('subjects from another school year are rejected', function () {
    actingAsEnrollee();
    $gradeLevel = GradeLevel::factory()->totalFee(30000)->create();
    $thisYearSubject = Subject::create(['curriculum_id' => $gradeLevel->curricula()->first()->id, 'name' => 'Math']);
    [$start] = explode('-', Enrollment::currentSchoolYear());
    Curriculum::factory()->for($gradeLevel)->create(['school_year' => ($start + 1).'-'.($start + 2)]);

    // Next school year is the open one, so this year's subjects no longer count.
    $this->post(route('admission.store'), validEnrollmentPayload($gradeLevel, ['subject_ids' => [$thisYearSubject->id]]))
        ->assertSessionHasErrors('subject_ids.0');

    expect(Enrollment::count())->toBe(0);
});

test('mobile numbers are saved in international form however they were typed', function (string $typed, string $saved) {
    actingAsEnrollee();
    $gradeLevel = GradeLevel::factory()->totalFee(30000)->create();
    Subject::create(['curriculum_id' => $gradeLevel->curricula()->first()->id, 'name' => 'Math']);

    $this->post(route('admission.store'), validEnrollmentPayload($gradeLevel, [
        'father_mobile_no' => $typed,
        'mother_mobile_no' => $typed,
    ]))->assertSessionHasNoErrors();

    $parents = Enrollment::sole()->student->parentProfile;

    expect($parents->father_mobile_no)->toBe($saved)
        ->and($parents->mother_mobile_no)->toBe($saved);
})->with([
    'plain' => ['09171234567', '+639171234567'],
    'grouped with spaces' => ['0917 123 4567', '+639171234567'],
    'with dashes' => ['0917-123-4567', '+639171234567'],
    'international' => ['+63 917 123 4567', '+639171234567'],
    'without the leading zero' => ['917 123 4567', '+639171234567'],
    'united states' => ['+1 415 555 2671', '+14155552671'],
    'united kingdom' => ['+44 7911 123456', '+447911123456'],
    'with a 00 international prefix' => ['0044 7911 123456', '+447911123456'],
]);

test('mobile numbers must be a valid number for their country', function (string $typed) {
    actingAsEnrollee();
    $gradeLevel = GradeLevel::factory()->totalFee(30000)->create();
    Subject::create(['curriculum_id' => $gradeLevel->curricula()->first()->id, 'name' => 'Math']);

    $this->post(route('admission.store'), validEnrollmentPayload($gradeLevel, ['father_mobile_no' => $typed]))
        ->assertSessionHasErrors([
            'father_mobile_no' => 'Enter a valid mobile number with its country code. Philippine numbers are +63 followed by 10 digits starting with 9, e.g. +63 917 123 4567.',
        ]);

    expect(Enrollment::count())->toBe(0);
})->with([
    'letters' => 'call me',
    'digits mixed with letters' => '0917abc4567',
    'too short' => '0917 123',
    'too long' => '0917 123 45678',
    'landline' => '(053) 123 4567',
    'philippine landline with country code' => '+63 53 123 4567',
    'too short for another country' => '+1 415',
    'too long for any country' => '+44 7911 1234 5678 90',
]);

test('mobile numbers are optional', function () {
    actingAsEnrollee();
    $gradeLevel = GradeLevel::factory()->totalFee(30000)->create();
    Subject::create(['curriculum_id' => $gradeLevel->curricula()->first()->id, 'name' => 'Math']);

    $this->post(route('admission.store'), validEnrollmentPayload($gradeLevel, [
        'father_mobile_no' => '',
        'mother_mobile_no' => null,
    ]))->assertSessionHasNoErrors();

    expect(Enrollment::sole()->student->parentProfile->father_mobile_no)->toBeNull();
});

test('nursery applications must be No LRN', function (array $overrides, string $field, string $message) {
    actingAsEnrollee();
    $nursery = GradeLevel::factory()->nursery()->totalFee(30000)->create();
    Subject::create(['curriculum_id' => $nursery->curricula()->first()->id, 'name' => 'Numeracy']);

    $this->post(route('admission.store'), validEnrollmentPayload($nursery, $overrides))
        ->assertSessionHasErrors([$field => $message]);

    expect(Enrollment::count())->toBe(0);
})->with([
    'with LRN' => [
        ['student_type' => 'WITH_LRN', 'lrn' => '45250112345678'],
        'student_type',
        'Nursery students don’t have an LRN yet, so the student type must be No LRN.',
    ],
    'returnee' => [
        ['student_type' => 'RETURNEE'],
        'student_type',
        'Nursery students don’t have an LRN yet, so the student type must be No LRN.',
    ],
    'no LRN but one filled in anyway' => [
        ['student_type' => 'NO_LRN', 'lrn' => '45250112345678'],
        'lrn',
        'Nursery students don’t have an LRN yet. Leave this blank.',
    ],
]);

test('nursery applications with No LRN go through', function () {
    actingAsEnrollee();
    $nursery = GradeLevel::factory()->nursery()->totalFee(30000)->create();
    Subject::create(['curriculum_id' => $nursery->curricula()->first()->id, 'name' => 'Numeracy']);

    $this->post(route('admission.store'), validEnrollmentPayload($nursery, ['student_type' => 'NO_LRN', 'lrn' => null]))
        ->assertSessionHasNoErrors();

    expect(Enrollment::sole()->student_type)->toBe('NO_LRN');
});

test('pre-K students can apply with an LRN', function (string $gradeName) {
    actingAsEnrollee();
    $gradeLevel = GradeLevel::factory()->totalFee(30000)->create(['name' => $gradeName]);
    Subject::create(['curriculum_id' => $gradeLevel->curricula()->first()->id, 'name' => 'Numeracy']);

    $this->post(route('admission.store'), validEnrollmentPayload($gradeLevel, [
        'student_type' => 'WITH_LRN',
        'lrn' => '45250112345678',
    ]))->assertSessionHasNoErrors();

    expect(Enrollment::sole()->student_type)->toBe('WITH_LRN')
        ->and(Enrollment::sole()->student->lrn)->toBe('45250112345678');
})->with(['Pre-K 1', 'Pre-K 2']);
