<?php

use App\Mail\EnrollmentStatusUpdated;
use App\Models\EnrolleeUser;
use App\Models\Enrollment;
use App\Models\OfficeVerification;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

test('an application cannot be approved while documents are missing, and the admin is told which ones', function () {
    Mail::fake();

    $admin = User::factory()->create(['role' => 'ADMIN']);
    $enrollee = EnrolleeUser::factory()->create();
    $enrollment = Enrollment::factory()->create([
        'enrollee_user_id' => $enrollee->id,
        'enrollment_status' => 'PENDING',
        'email' => 'parent@example.com',
    ]);
    OfficeVerification::create([
        'enrollment_id' => $enrollment->id,
        'birth_certificate_path' => 'documents/birth-certificate.pdf',
    ]);

    $this->actingAs($admin)
        ->from(route('admin.enrollments.show', $enrollment))
        ->patch(route('admin.enrollments.status.update', $enrollment), ['enrollment_status' => 'APPROVED'])
        ->assertRedirect(route('admin.enrollments.show', $enrollment))
        ->assertSessionHasErrors('missing_documents');

    $message = session('errors')->first('missing_documents');
    expect($message)
        ->toContain('Form 138 (Report Card)')
        ->toContain('Good Moral Certificate')
        ->not->toContain('PSA Birth Certificate');

    expect($enrollment->fresh()->enrollment_status)->toBe('PENDING');
    expect($enrollee->notifications()->count())->toBe(0);
    Mail::assertNotSent(EnrollmentStatusUpdated::class);
});

test('an application without any documents on record lists all of them as missing', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $enrollment = Enrollment::factory()->create(['enrollment_status' => 'PENDING']);

    $this->actingAs($admin)
        ->patch(route('admin.enrollments.status.update', $enrollment), ['enrollment_status' => 'APPROVED'])
        ->assertSessionHasErrors('missing_documents');

    expect(session('errors')->first('missing_documents'))
        ->toContain('Form 138 (Report Card), PSA Birth Certificate, Good Moral Certificate');
});

test('an application with every document uploaded can be approved', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $enrollment = Enrollment::factory()->withDocuments()->create(['enrollment_status' => 'PENDING']);

    $this->actingAs($admin)
        ->patch(route('admin.enrollments.status.update', $enrollment), ['enrollment_status' => 'APPROVED'])
        ->assertSessionHasNoErrors();

    expect($enrollment->fresh()->enrollment_status)->toBe('APPROVED');
});

test('an application with missing documents can still be rejected or reset to pending', function (string $status, array $extra) {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $enrollment = Enrollment::factory()->create(['enrollment_status' => 'REJECTED']);

    $this->actingAs($admin)
        ->patch(route('admin.enrollments.status.update', $enrollment), ['enrollment_status' => $status, ...$extra])
        ->assertSessionHasNoErrors();

    expect($enrollment->fresh()->enrollment_status)->toBe($status);
})->with([
    'pending' => ['PENDING', []],
    'rejected' => ['REJECTED', ['rejection_reasons' => ['MISSING_REQUIREMENTS']]],
]);
