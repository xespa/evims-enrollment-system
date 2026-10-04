<?php

use App\Models\EnrolleeUser;
use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\OfficeVerification;
use App\Models\Student;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->travelTo(Carbon::parse('2026-10-04 10:00', 'Asia/Manila'));
    Storage::fake('public');

    $this->enrollee = EnrolleeUser::factory()->create();
    $this->gradeLevel = GradeLevel::factory()->totalFee(30000)->create();
    Subject::create(['curriculum_id' => $this->gradeLevel->curricula()->first()->id, 'name' => 'Math', 'code' => 'MATH1']);

    $this->student = Student::factory()->create([
        'lrn' => '45250112345678',
        'psa_birth_cert_no' => '123-4567-89012',
        'last_name' => 'Dela Cruz',
        'first_name' => 'Juan',
        'middle_name' => 'Santos',
        'extension_name' => null,
        'date_of_birth' => '2015-05-10',
        'sex' => 'MALE',
    ]);
});

/**
 * Last school year's approved application for the student, with all three
 * documents uploaded and verified.
 */
function approvedLastYear(array $attributes = []): Enrollment
{
    $enrollment = Enrollment::factory()->create([
        'student_id' => test()->student->id,
        'enrollee_user_id' => test()->enrollee->id,
        'school_year' => '2025-2026',
        'enrollment_status' => 'APPROVED',
        ...$attributes,
    ]);

    $enrollment->officeVerification()->create([
        'form_138_path' => UploadedFile::fake()->create('old-form-138.pdf', 100, 'application/pdf')->store('documents', 'public'),
        'birth_certificate_path' => UploadedFile::fake()->create('psa.pdf', 100, 'application/pdf')->store('documents', 'public'),
        'good_moral_path' => UploadedFile::fake()->image('good-moral.jpg')->store('documents', 'public'),
        'has_form_138' => true,
        'has_birth_certificate' => true,
        'has_good_moral_certificate' => true,
    ]);

    return $enrollment;
}

function returningPayload(array $overrides = []): array
{
    return validEnrollmentPayload(test()->gradeLevel, [
        'student_type' => 'WITH_LRN',
        'lrn' => '45250112345678',
        ...$overrides,
    ]);
}

function submittedVerification(): OfficeVerification
{
    return Enrollment::where('school_year', '2026-2027')->sole()->officeVerification;
}

test('a returning student keeps their PSA and good moral from last year, verified, but not their Form 138', function () {
    $lastYear = approvedLastYear()->officeVerification;

    $this->actingAs($this->enrollee, 'enrollee')
        ->post(route('admission.store'), returningPayload())
        ->assertSessionHasNoErrors();

    $verification = submittedVerification();

    expect($verification->birth_certificate_path)->not->toBeNull()->not->toBe($lastYear->birth_certificate_path)
        ->and($verification->has_birth_certificate)->toBeTrue()
        ->and($verification->good_moral_path)->not->toBeNull()->not->toBe($lastYear->good_moral_path)
        ->and($verification->has_good_moral_certificate)->toBeTrue()
        ->and($verification->form_138_path)->toBeNull()
        ->and($verification->has_form_138)->toBeFalse();

    // Copies, so replacing one year's file never deletes the other's.
    Storage::disk('public')->assertExists($verification->birth_certificate_path);
    Storage::disk('public')->assertExists($verification->good_moral_path);
    Storage::disk('public')->assertExists($lastYear->birth_certificate_path);
});

test('a newly uploaded PSA is used instead of the one on file', function () {
    approvedLastYear();

    $this->actingAs($this->enrollee, 'enrollee')
        ->post(route('admission.store'), returningPayload([
            'birth_certificate' => UploadedFile::fake()->create('new-psa.pdf', 100, 'application/pdf'),
        ]))
        ->assertSessionHasNoErrors();

    $verification = submittedVerification();

    expect($verification->has_birth_certificate)->toBeFalse()
        ->and($verification->has_good_moral_certificate)->toBeTrue();
});

test('the PSA on file is not kept when details printed on it changed', function (array $changed) {
    approvedLastYear();

    $this->actingAs($this->enrollee, 'enrollee')
        ->post(route('admission.store'), returningPayload($changed))
        ->assertSessionHasNoErrors();

    $verification = submittedVerification();

    expect($verification->birth_certificate_path)->toBeNull()
        ->and($verification->has_birth_certificate)->toBeFalse()
        ->and($verification->good_moral_path)->not->toBeNull();
})->with([
    'last name' => [['last_name' => 'Reyes']],
    'birth date' => [['date_of_birth' => '2015-05-11']],
    'PSA number' => [['psa_birth_cert_no' => '999-9999-99999']],
]);

test('parents of a returning student cannot upload a Form 138', function () {
    approvedLastYear();

    $this->actingAs($this->enrollee, 'enrollee')
        ->post(route('admission.store'), returningPayload([
            'form_138' => UploadedFile::fake()->create('form138.pdf', 100, 'application/pdf'),
        ]))
        ->assertSessionHasErrors(['form_138' => 'Returning students don’t need to upload a Form 138 — the registrar will attach their latest report card from EVIMS.']);

    expect(Enrollment::where('school_year', '2026-2027')->exists())->toBeFalse();
});

test('documents are not kept when last year\'s application was not approved', function (array $lastYear) {
    approvedLastYear($lastYear);

    $this->actingAs($this->enrollee, 'enrollee')
        ->post(route('admission.store'), returningPayload([
            'form_138' => UploadedFile::fake()->create('form138.pdf', 100, 'application/pdf'),
        ]))
        ->assertSessionHasNoErrors();

    $verification = submittedVerification();

    expect($verification->form_138_path)->not->toBeNull()
        ->and($verification->birth_certificate_path)->toBeNull()
        ->and($verification->good_moral_path)->toBeNull();
})->with([
    'rejected' => [['enrollment_status' => 'REJECTED']],
    'cancelled' => [['cancelled_at' => '2025-06-01 00:00:00']],
]);

test('another family\'s documents are never carried over', function () {
    approvedLastYear(['enrollee_user_id' => EnrolleeUser::factory()->create()->id]);

    $this->actingAs($this->enrollee, 'enrollee')
        ->post(route('admission.store'), returningPayload())
        ->assertSessionHasNoErrors();

    $verification = Enrollment::where('enrollee_user_id', $this->enrollee->id)->sole()->officeVerification;

    expect($verification->birth_certificate_path)->toBeNull()
        ->and($verification->good_moral_path)->toBeNull();
});

test('the LRN check tells the form which documents are on file', function () {
    approvedLastYear();

    $this->actingAs($this->enrollee, 'enrollee')
        ->postJson(route('admission.verify-lrn'), ['lrn' => '45250112345678'])
        ->assertOk()
        ->assertJsonPath('documentsOnFile', [
            'schoolYear' => '2025-2026',
            'birth_certificate' => true,
            'good_moral_certificate' => true,
        ]);
});

test('the LRN check has no documents on file without an approved earlier year', function () {
    approvedLastYear(['enrollment_status' => 'REJECTED']);

    $this->actingAs($this->enrollee, 'enrollee')
        ->postJson(route('admission.verify-lrn'), ['lrn' => '45250112345678'])
        ->assertOk()
        ->assertJsonPath('documentsOnFile', null);
});

test('parents cannot upload a returning student\'s Form 138 from the portal', function () {
    approvedLastYear();
    $enrollment = Enrollment::factory()->create([
        'student_id' => $this->student->id,
        'enrollee_user_id' => $this->enrollee->id,
        'school_year' => '2026-2027',
    ]);

    $this->actingAs($this->enrollee, 'enrollee')
        ->post(route('portal.enrollments.documents.store', [$enrollment, 'form_138']), [
            'file' => UploadedFile::fake()->create('form138.pdf', 100, 'application/pdf'),
        ])
        ->assertSessionHasErrors('document');

    expect($enrollment->officeVerification()->first()?->form_138_path)->toBeNull();
});

test('the admin dashboard reminds the registrar to upload returning students\' Form 138', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    approvedLastYear();
    $returning = Enrollment::factory()->create([
        'student_id' => $this->student->id,
        'school_year' => '2026-2027',
    ]);
    $newStudent = Enrollment::factory()->create(['school_year' => '2026-2027']);

    $this->actingAs($admin)
        ->get(route('admin.dashboard', ['school_year' => '2026-2027']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('awaitingForm138', 1)
            ->where('awaitingForm138.0.id', $returning->id)
        );

    $this->actingAs($admin)
        ->post(route('admin.enrollments.documents.store', [$returning, 'form_138']), [
            'file' => UploadedFile::fake()->create('form138.pdf', 100, 'application/pdf'),
        ])
        ->assertSessionHasNoErrors();

    $this->actingAs($admin)
        ->get(route('admin.dashboard', ['school_year' => '2026-2027']))
        ->assertInertia(fn (Assert $page) => $page->has('awaitingForm138', 0));

    expect($newStudent->isReturning())->toBeFalse();
});

test('the enrollment page tells the admin the student is returning', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    approvedLastYear();
    $returning = Enrollment::factory()->create([
        'student_id' => $this->student->id,
        'school_year' => '2026-2027',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.enrollments.show', $returning))
        ->assertInertia(fn (Assert $page) => $page->where('previousSchoolYear', '2025-2026'));
});

test('admins cannot remind the parent about a returning student\'s Form 138', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    approvedLastYear();
    $returning = Enrollment::factory()->create([
        'student_id' => $this->student->id,
        'enrollee_user_id' => $this->enrollee->id,
        'school_year' => '2026-2027',
    ]);

    $this->actingAs($admin)
        ->post(route('admin.enrollments.documents.remind', [$returning, 'form_138']), [
            'reason' => 'NOT_SUBMITTED',
        ])
        ->assertSessionHasErrors('reminder');

    expect($this->enrollee->notifications()->count())->toBe(0);
});
