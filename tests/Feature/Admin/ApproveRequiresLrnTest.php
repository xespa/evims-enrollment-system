<?php

use App\Mail\EnrollmentStatusUpdated;
use App\Models\EnrolleeUser;
use App\Models\Enrollment;
use App\Models\Student;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

test('an application cannot be approved while the student has no lrn', function () {
    Mail::fake();

    $admin = User::factory()->create(['role' => 'ADMIN']);
    $enrollee = EnrolleeUser::factory()->create();
    $student = Student::factory()->create(['lrn' => null]);
    $enrollment = Enrollment::factory()->create([
        'student_id' => $student->id,
        'enrollee_user_id' => $enrollee->id,
        'enrollment_status' => 'PENDING',
        'email' => 'parent@example.com',
    ]);

    $this->actingAs($admin)
        ->from(route('admin.enrollments.show', $enrollment))
        ->patch(route('admin.enrollments.status.update', $enrollment), ['enrollment_status' => 'APPROVED'])
        ->assertRedirect(route('admin.enrollments.show', $enrollment))
        ->assertSessionHasErrors('enrollment_status');

    expect($enrollment->fresh()->enrollment_status)->toBe('PENDING');
    expect($enrollee->notifications()->count())->toBe(0);
    Mail::assertNotSent(EnrollmentStatusUpdated::class);
});

test('an application can be approved once the student has an lrn', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $student = Student::factory()->create(['lrn' => '45250112345678']);
    $enrollment = Enrollment::factory()->create([
        'student_id' => $student->id,
        'enrollment_status' => 'PENDING',
    ]);

    $this->actingAs($admin)
        ->patch(route('admin.enrollments.status.update', $enrollment), ['enrollment_status' => 'APPROVED'])
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    expect($enrollment->fresh()->enrollment_status)->toBe('APPROVED');
});

test('an application without an lrn can still be rejected', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $student = Student::factory()->create(['lrn' => null]);
    $enrollment = Enrollment::factory()->create([
        'student_id' => $student->id,
        'enrollment_status' => 'PENDING',
    ]);

    $this->actingAs($admin)
        ->patch(route('admin.enrollments.status.update', $enrollment), ['enrollment_status' => 'REJECTED'])
        ->assertSessionHasNoErrors();

    expect($enrollment->fresh()->enrollment_status)->toBe('REJECTED');
});

test('the status must be a known value', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $enrollment = Enrollment::factory()->create(['enrollment_status' => 'PENDING']);

    $this->actingAs($admin)
        ->patch(route('admin.enrollments.status.update', $enrollment), ['enrollment_status' => 'ARCHIVED'])
        ->assertSessionHasErrors('enrollment_status');

    expect($enrollment->fresh()->enrollment_status)->toBe('PENDING');
});

test('non-admin users cannot change an application status', function () {
    $staff = User::factory()->create(['role' => 'STAFF']);
    $enrollment = Enrollment::factory()->create(['enrollment_status' => 'PENDING']);

    $this->actingAs($staff)
        ->patch(route('admin.enrollments.status.update', $enrollment), ['enrollment_status' => 'APPROVED'])
        ->assertForbidden();

    expect($enrollment->fresh()->enrollment_status)->toBe('PENDING');
});
