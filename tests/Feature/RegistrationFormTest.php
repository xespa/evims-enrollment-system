<?php

use App\Actions\Enrollment\GenerateRegistrationForm;
use App\Mail\RegistrationFormIssued;
use App\Models\BillingContract;
use App\Models\Curriculum;
use App\Models\EnrolleeUser;
use App\Models\Enrollment;
use App\Models\Student;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

/**
 * A pending Grade 1 application with documents, a parent account, its
 * curriculum fees, subjects, address and parents — everything the form shows.
 *
 * @param  array<string, mixed>  $attributes
 */
function registrableEnrollment(array $attributes = []): Enrollment
{
    $curriculum = Curriculum::factory()->create([
        'school_year' => '2026-2027',
        'registration_fee' => 1725,
        'miscellaneous_fee' => 6325,
        'monthly_tuition' => 2070,
        'monthly_laboratory_fee' => 690,
        'books_fee' => 6024,
    ]);

    $student = Student::factory()->create(['first_name' => 'Juan', 'last_name' => 'Dela Cruz']);
    $student->address()->create([
        'house_number_street' => '12 Santiago St.',
        'barangay' => 'Balud',
        'city_municipality' => 'Borongan City',
        'province' => 'Eastern Samar',
        'country' => 'Philippines',
    ]);
    $student->parentProfile()->create([
        'father_first_name' => 'Pedro',
        'father_last_name' => 'Dela Cruz',
        'mother_first_name' => 'Maria',
        'mother_maiden_last_name' => 'Santos',
        'mother_mobile_no' => '09171234567',
    ]);

    $enrollment = Enrollment::factory()->withDocuments()->create([
        'student_id' => $student->id,
        'grade_level_id' => $curriculum->grade_level_id,
        'school_year' => '2026-2027',
        'enrollee_user_id' => EnrolleeUser::factory()->state(['email' => 'account@example.com']),
        'email' => 'form@example.com',
        'enrollment_status' => 'PENDING',
        'session_time_preference' => 'MORNING_SESSION',
        ...$attributes,
    ]);

    $enrollment->subjects()->sync([
        $curriculum->subjects()->create(['name' => 'Mathematics'])->id,
        $curriculum->subjects()->create(['name' => 'Science'])->id,
    ]);

    $enrollment->billingContract()->create([
        'payment_option' => 'BI_MONTHLY',
        'payment_channel' => BillingContract::CHANNEL_COUNTER,
        'total_fee' => $curriculum->fresh()->tuition_fee,
    ])->generateInstallments();

    return $enrollment;
}

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => 'ADMIN']);
});

test('approving an application emails the registration form to the parent\'s account', function () {
    Mail::fake();
    $enrollment = registrableEnrollment();

    $this->actingAs($this->admin)
        ->patch(route('admin.enrollments.status.update', $enrollment), ['enrollment_status' => 'APPROVED'])
        ->assertSessionHasNoErrors();

    Mail::assertQueued(RegistrationFormIssued::class, fn (RegistrationFormIssued $mail) => $mail->hasTo('account@example.com')
        && ! $mail->hasTo('form@example.com')
        && $mail->enrollment->is($enrollment));
    Mail::assertQueuedCount(1);
});

test('without a portal account, the form goes to the email on the application', function () {
    Mail::fake();
    $enrollment = registrableEnrollment(['enrollee_user_id' => null]);

    $this->actingAs($this->admin)
        ->patch(route('admin.enrollments.status.update', $enrollment), ['enrollment_status' => 'APPROVED']);

    Mail::assertQueued(RegistrationFormIssued::class, fn (RegistrationFormIssued $mail) => $mail->hasTo('form@example.com'));
});

test('no registration form is sent unless the application is newly approved', function (string $from, string $to, array $extra) {
    Mail::fake();
    $enrollment = registrableEnrollment(['enrollment_status' => $from]);

    $this->actingAs($this->admin)
        ->patch(route('admin.enrollments.status.update', $enrollment), ['enrollment_status' => $to, ...$extra]);

    Mail::assertNotQueued(RegistrationFormIssued::class);
})->with([
    'rejected' => ['PENDING', 'REJECTED', ['rejection_reasons' => ['INCOMPLETE_DOCUMENTS']]],
    'still pending' => ['PENDING', 'PENDING', []],
    'already approved' => ['APPROVED', 'APPROVED', []],
]);

test('the email attaches the registration form as a PDF', function () {
    $enrollment = registrableEnrollment(['enrollment_status' => 'APPROVED']);
    $mail = new RegistrationFormIssued($enrollment);

    $mail->assertHasSubject('Registration Form for Juan Dela Cruz (S.Y. 2026-2027)');
    $mail->assertSeeInHtml('Juan Dela Cruz');
    $mail->assertSeeInHtml('attached as a PDF');

    $attachments = $mail->attachments();

    expect($attachments)->toHaveCount(1)
        ->and($attachments[0]->as)->toBe('registration-form-2026-2027-dela-cruz-juan.pdf')
        ->and($attachments[0]->mime)->toBe('application/pdf');
});

test('the form shows the student, subjects, fees and payment schedule', function () {
    $enrollment = registrableEnrollment(['enrollment_status' => 'APPROVED']);

    $html = view('pdf.registration-form', app(GenerateRegistrationForm::class)->viewData($enrollment))->render();

    expect($html)
        ->toContain('REGISTRATION FORM')
        ->toContain('Dela Cruz, Juan')
        ->toContain($enrollment->student->lrn)
        ->toContain('12 Santiago St., Balud, Borongan City, Eastern Samar')
        ->toContain('Pedro')
        ->toContain('09171234567')
        ->toContain('Mathematics')
        ->toContain('Science')
        ->toContain('Morning session')
        ->toContain('₱1,725.00')
        ->toContain('₱20,700.00')
        ->toContain('₱41,674.00')
        ->toContain('Bi-monthly (5 installments)')
        ->toContain('Paid at the school cashier')
        ->and(substr_count($html, '₱8,334.80'))->toBe(5);
});

test('a parent can download their approved child\'s registration form', function () {
    $enrollment = registrableEnrollment(['enrollment_status' => 'APPROVED']);

    $response = $this->actingAs($enrollment->enrolleeUser, 'enrollee')
        ->get(route('portal.enrollments.registration-form.show', $enrollment))
        ->assertOk()
        ->assertDownload('registration-form-2026-2027-dela-cruz-juan.pdf');

    expect($response->headers->get('Content-Type'))->toBe('application/pdf')
        ->and(substr($response->getContent(), 0, 4))->toBe('%PDF');
});

test('a parent cannot download a form that is not approved yet', function () {
    $enrollment = registrableEnrollment();

    $this->actingAs($enrollment->enrolleeUser, 'enrollee')
        ->get(route('portal.enrollments.registration-form.show', $enrollment))
        ->assertNotFound();
});

test('a parent cannot download another family\'s registration form', function () {
    $enrollment = registrableEnrollment(['enrollment_status' => 'APPROVED']);

    $this->actingAs(EnrolleeUser::factory()->create(), 'enrollee')
        ->get(route('portal.enrollments.registration-form.show', $enrollment))
        ->assertForbidden();
});

test('guests are sent to the portal login', function () {
    $enrollment = registrableEnrollment(['enrollment_status' => 'APPROVED']);

    $this->get(route('portal.enrollments.registration-form.show', $enrollment))
        ->assertRedirect(route('portal.login'));
});

test('staff can download an approved application\'s registration form', function () {
    $enrollment = registrableEnrollment(['enrollment_status' => 'APPROVED']);

    $this->actingAs(User::factory()->registrar()->create())
        ->get(route('admin.enrollments.registration-form.show', $enrollment))
        ->assertOk()
        ->assertDownload('registration-form-2026-2027-dela-cruz-juan.pdf');

    $this->actingAs($this->admin)
        ->get(route('admin.enrollments.registration-form.show', registrableEnrollment(['enrollee_user_id' => null])))
        ->assertNotFound();
});
