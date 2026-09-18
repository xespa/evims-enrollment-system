<?php

use App\Models\BillingContract;
use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\OfficeVerification;
use App\Models\Subject;
use App\Models\VitalInformation;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

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
        'school_year' => '2026-2027',
        'date_of_application' => now()->toDateString(),
        'age' => 10,
        'session_time_preference' => 'MORNING_SESSION',
        'email' => 'parent@example.com',

        'barangay' => 'Balud',
        'city_municipality' => 'Borongan City',
        'province' => 'Eastern Samar',
        'country' => 'Philippines',
        'zip_code' => '6800',

        'subject_ids' => $gradeLevel->subjects()->pluck('id')->toArray(),

        'payment_option' => 'MONTHLY',
        'payment_channel' => 'COUNTER',
    ], $overrides);
}

test('submitting the admission form creates the full enrollment record set', function () {
    Storage::fake('public');

    $gradeLevel = GradeLevel::factory()->create(['tuition_fee' => 30000]);
    Subject::create(['grade_level_id' => $gradeLevel->id, 'name' => 'Math', 'code' => 'MATH1']);

    $payload = validEnrollmentPayload($gradeLevel, [
        'form_138' => UploadedFile::fake()->create('form138.pdf', 200, 'application/pdf'),
        'birth_certificate' => UploadedFile::fake()->image('birth.jpg'),
        'good_moral_certificate' => UploadedFile::fake()->create('good-moral.pdf', 200, 'application/pdf'),
        'scanned_contract' => UploadedFile::fake()->create('contract.pdf', 200, 'application/pdf'),
    ]);

    $response = $this->post(route('enrollment.store'), $payload);

    $enrollment = Enrollment::first();
    expect($enrollment)->not->toBeNull();
    $response->assertRedirect(route('enrollment.success', $enrollment->id));

    // Vital information is now actually created (previously a no-op placeholder).
    expect(VitalInformation::where('enrollment_id', $enrollment->id)->exists())->toBeTrue();

    // Billing contract + installment schedule are now actually created.
    $billingContract = BillingContract::where('enrollment_id', $enrollment->id)->first();
    expect($billingContract)->not->toBeNull();
    expect((float) $billingContract->total_fee)->toBe(30000.0);
    expect($billingContract->installments()->count())->toBeGreaterThan(0);
    Storage::disk('public')->assertExists($billingContract->scanned_contract_url);

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

test('documents are optional at submission', function () {
    Storage::fake('public');

    $gradeLevel = GradeLevel::factory()->create(['tuition_fee' => 30000]);
    Subject::create(['grade_level_id' => $gradeLevel->id, 'name' => 'Math', 'code' => 'MATH1']);

    $payload = validEnrollmentPayload($gradeLevel);

    $response = $this->post(route('enrollment.store'), $payload);

    $enrollment = Enrollment::first();
    $response->assertRedirect(route('enrollment.success', $enrollment->id));

    $verification = OfficeVerification::where('enrollment_id', $enrollment->id)->first();
    expect($verification)->not->toBeNull();
    expect($verification->form_138_path)->toBeNull();
    expect($verification->birth_certificate_path)->toBeNull();
    expect($verification->good_moral_path)->toBeNull();

    $billingContract = BillingContract::where('enrollment_id', $enrollment->id)->first();
    expect($billingContract->scanned_contract_url)->toBeNull();
});

test('document uploads are validated for file type', function () {
    $gradeLevel = GradeLevel::factory()->create(['tuition_fee' => 30000]);
    Subject::create(['grade_level_id' => $gradeLevel->id, 'name' => 'Math', 'code' => 'MATH1']);

    $payload = validEnrollmentPayload($gradeLevel, [
        'form_138' => UploadedFile::fake()->create('form138.exe', 200, 'application/x-msdownload'),
    ]);

    $this->post(route('enrollment.store'), $payload)
        ->assertSessionHasErrors('form_138');

    expect(Enrollment::count())->toBe(0);
});

test('a second application for the same school year is rejected while the first is still active', function () {
    $gradeLevel = GradeLevel::factory()->create(['tuition_fee' => 30000]);
    Subject::create(['grade_level_id' => $gradeLevel->id, 'name' => 'Math', 'code' => 'MATH1']);

    $payload = validEnrollmentPayload($gradeLevel, [
        'student_type' => 'WITH_LRN',
        'lrn' => '12345678901234',
    ]);

    $this->post(route('enrollment.store'), $payload)->assertRedirect();
    expect(Enrollment::count())->toBe(1);
    expect(Enrollment::first()->enrollment_status)->toBe('PENDING');

    // Same LRN, same school year, application still pending — blocked.
    $this->post(route('enrollment.store'), $payload)
        ->assertSessionHasErrors('school_year');

    expect(Enrollment::count())->toBe(1);
});

test('a student can reapply for the same school year after their prior application was rejected', function () {
    $gradeLevel = GradeLevel::factory()->create(['tuition_fee' => 30000]);
    Subject::create(['grade_level_id' => $gradeLevel->id, 'name' => 'Math', 'code' => 'MATH1']);

    $payload = validEnrollmentPayload($gradeLevel, [
        'student_type' => 'WITH_LRN',
        'lrn' => '12345678901234',
    ]);

    $this->post(route('enrollment.store'), $payload)->assertRedirect();
    $firstEnrollment = Enrollment::first();
    $firstEnrollment->update(['enrollment_status' => 'REJECTED']);

    // Same LRN, same school year, but the only prior application was rejected — allowed.
    $this->post(route('enrollment.store'), $payload)->assertRedirect();

    expect(Enrollment::count())->toBe(2);
});

test('a student can reapply for the same school year after their prior application was cancelled', function () {
    $gradeLevel = GradeLevel::factory()->create(['tuition_fee' => 30000]);
    Subject::create(['grade_level_id' => $gradeLevel->id, 'name' => 'Math', 'code' => 'MATH1']);

    $payload = validEnrollmentPayload($gradeLevel, [
        'student_type' => 'WITH_LRN',
        'lrn' => '12345678901234',
    ]);

    $this->post(route('enrollment.store'), $payload)->assertRedirect();
    $firstEnrollment = Enrollment::first();
    $firstEnrollment->update(['cancelled_at' => now()]);

    // Same LRN, same school year, but the only prior application was cancelled — allowed.
    $this->post(route('enrollment.store'), $payload)->assertRedirect();

    expect(Enrollment::count())->toBe(2);
});
