<?php

use App\Models\Address;
use App\Models\BillingContract;
use App\Models\Curriculum;
use App\Models\EnrolleeUser;
use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\OfficeVerification;
use App\Models\Subject;
use App\Models\User;
use App\Models\VitalInformation;
use Illuminate\Http\UploadedFile;
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

test('guests are sent to create an account instead of submitting directly', function () {
    $gradeLevel = GradeLevel::factory()->totalFee(30000)->create();
    Subject::create(['curriculum_id' => $gradeLevel->curricula()->first()->id, 'name' => 'Math', 'code' => 'MATH1']);

    $payload = validEnrollmentPayload($gradeLevel);

    $response = $this->post(route('admission.store'), $payload);

    $response->assertRedirect(route('portal.register', [
        'name' => 'Juan Dela Cruz',
        'email' => 'parent@example.com',
    ]));
    expect(Enrollment::count())->toBe(0);
});

test('a guest application is submitted as soon as they register', function () {
    Storage::fake('public');
    Storage::fake('local');

    $gradeLevel = GradeLevel::factory()->totalFee(30000)->create();
    Subject::create(['curriculum_id' => $gradeLevel->curricula()->first()->id, 'name' => 'Math', 'code' => 'MATH1']);

    $this->post(route('admission.store'), validEnrollmentPayload($gradeLevel, [
        'form_138' => UploadedFile::fake()->create('form138.pdf', 200, 'application/pdf'),
    ]));
    expect(Enrollment::count())->toBe(0);

    $this->get(route('portal.register'))
        ->assertInertia(fn ($page) => $page->where('hasPendingApplication', true));

    $response = $this->post(route('portal.register.store'), [
        'name' => 'Juan Dela Cruz',
        'email' => 'parent@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $enrollment = Enrollment::with('student', 'officeVerification')->sole();
    $response->assertRedirect(route('admission.success', $enrollment->id));

    expect($enrollment->enrollee_user_id)->toBe(EnrolleeUser::where('email', 'parent@example.com')->value('id'))
        ->and($enrollment->enrollment_status)->toBe('PENDING')
        ->and($enrollment->student->first_name)->toBe('Juan');

    // The upload survives the detour through registration, moving from the
    // private holding area onto the public disk like any other document.
    Storage::disk('public')->assertExists($enrollment->officeVerification->form_138_path);
    expect(Storage::disk('local')->allFiles('pending-documents'))->toBeEmpty();

    // Submitted exactly once — nothing is left waiting in the session.
    $response->assertSessionMissing('pending_enrollment');
});

test('a guest application is submitted as soon as they log in to an existing account', function () {
    $enrollee = EnrolleeUser::factory()->create();
    $gradeLevel = GradeLevel::factory()->totalFee(30000)->create();
    Subject::create(['curriculum_id' => $gradeLevel->curricula()->first()->id, 'name' => 'Math', 'code' => 'MATH1']);

    $this->post(route('admission.store'), validEnrollmentPayload($gradeLevel));

    $response = $this->post(route('portal.login.store'), [
        'email' => $enrollee->email,
        'password' => 'password',
    ]);

    $enrollment = Enrollment::sole();
    $response->assertRedirect(route('admission.success', $enrollment->id));
    expect($enrollment->enrollee_user_id)->toBe($enrollee->id);
});

test('a guest application submitted after registering shows up for the admin', function () {
    $gradeLevel = GradeLevel::factory()->totalFee(30000)->create();
    Subject::create(['curriculum_id' => $gradeLevel->curricula()->first()->id, 'name' => 'Math', 'code' => 'MATH1']);

    $this->post(route('admission.store'), validEnrollmentPayload($gradeLevel));
    $this->post(route('portal.register.store'), [
        'name' => 'Juan Dela Cruz',
        'email' => 'parent@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $admin = User::factory()->create(['role' => 'ADMIN']);

    $this->actingAs($admin)
        ->get(route('admin.students.index'))
        ->assertInertia(fn ($page) => $page
            ->has('applications.data', 1)
            ->where('applications.data.0.student.first_name', 'Juan'));
});

test('a newer guest submission replaces the held one and its uploads', function () {
    Storage::fake('local');

    $gradeLevel = GradeLevel::factory()->totalFee(30000)->create();
    Subject::create(['curriculum_id' => $gradeLevel->curricula()->first()->id, 'name' => 'Math', 'code' => 'MATH1']);

    $this->post(route('admission.store'), validEnrollmentPayload($gradeLevel, [
        'form_138' => UploadedFile::fake()->create('first.pdf', 200, 'application/pdf'),
    ]));
    $this->post(route('admission.store'), validEnrollmentPayload($gradeLevel, [
        'first_name' => 'Pedro',
        'form_138' => UploadedFile::fake()->create('second.pdf', 200, 'application/pdf'),
    ]));

    expect(Storage::disk('local')->allFiles('pending-documents'))->toHaveCount(1);

    $this->post(route('portal.register.store'), [
        'name' => 'Pedro Dela Cruz',
        'email' => 'parent@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    expect(Enrollment::with('student')->sole()->student->first_name)->toBe('Pedro');
});

test('registering without a held application goes to the verification notice', function () {
    $this->post(route('portal.register.store'), [
        'name' => 'Juan Dela Cruz',
        'email' => 'parent@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
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

test('an application is priced from the chosen school year\'s fees', function () {
    actingAsEnrollee();
    $gradeLevel = GradeLevel::factory()->create();
    [$start] = explode('-', Enrollment::currentSchoolYear());
    $nextSchoolYear = ($start + 1).'-'.($start + 2);

    Curriculum::factory()->for($gradeLevel)->totalFee(30000)->create();
    $nextYear = Curriculum::factory()->for($gradeLevel)->totalFee(33000)->create(['school_year' => $nextSchoolYear]);
    $nextYearSubject = Subject::factory()->for($nextYear)->create();

    $this->post(route('admission.store'), validEnrollmentPayload($gradeLevel, [
        'school_year' => $nextSchoolYear,
        'subject_ids' => [$nextYearSubject->id],
    ]))->assertRedirect();

    $enrollment = Enrollment::sole();

    expect((float) $enrollment->billingContract->total_fee)->toBe(33000.0)
        ->and($enrollment->subjects->pluck('id')->all())->toBe([$nextYearSubject->id]);
});

test('a school year that is not set up for the grade level cannot be applied for', function () {
    actingAsEnrollee();
    $gradeLevel = GradeLevel::factory()->totalFee(30000)->create();
    Subject::create(['curriculum_id' => $gradeLevel->curricula()->first()->id, 'name' => 'Math']);
    [$start] = explode('-', Enrollment::currentSchoolYear());
    $notSetUp = ($start + 1).'-'.($start + 2);

    $this->post(route('admission.store'), validEnrollmentPayload($gradeLevel, ['school_year' => $notSetUp]))
        ->assertSessionHasErrors(['school_year' => "Enrollment for S.Y. {$notSetUp} isn't open for this grade level yet."]);

    expect(Enrollment::count())->toBe(0);
});

test('subjects from another school year are rejected', function () {
    actingAsEnrollee();
    $gradeLevel = GradeLevel::factory()->totalFee(30000)->create();
    Subject::create(['curriculum_id' => $gradeLevel->curricula()->first()->id, 'name' => 'Math']);
    [$start] = explode('-', Enrollment::currentSchoolYear());
    $otherYear = Curriculum::factory()->for($gradeLevel)->create(['school_year' => ($start + 1).'-'.($start + 2)]);
    $otherYearSubject = Subject::factory()->for($otherYear)->create();

    $this->post(route('admission.store'), validEnrollmentPayload($gradeLevel, ['subject_ids' => [$otherYearSubject->id]]))
        ->assertSessionHasErrors('subject_ids.0');

    expect(Enrollment::count())->toBe(0);
});
