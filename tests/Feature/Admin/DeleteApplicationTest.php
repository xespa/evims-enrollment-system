<?php

use App\Models\BillingContract;
use App\Models\Enrollment;
use App\Models\OfficeVerification;
use App\Models\Student;
use App\Models\User;

test('guests cannot delete an application', function () {
    $enrollment = Enrollment::factory()->create();

    $this->delete(route('admin.enrollments.destroy', $enrollment))
        ->assertRedirect(route('login'));

    expect(Enrollment::find($enrollment->id))->not->toBeNull();
});

test('non-admin users cannot delete an application', function () {
    $staff = User::factory()->create(['role' => 'STAFF']);
    $enrollment = Enrollment::factory()->create();

    $this->actingAs($staff)
        ->delete(route('admin.enrollments.destroy', $enrollment))
        ->assertForbidden();

    expect(Enrollment::find($enrollment->id))->not->toBeNull();
});

test('admins can permanently delete an application, cascading its related records but keeping the student', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $student = Student::factory()->create();
    $enrollment = Enrollment::factory()->create(['student_id' => $student->id]);

    $verification = OfficeVerification::create(['enrollment_id' => $enrollment->id]);
    $billingContract = BillingContract::create([
        'enrollment_id' => $enrollment->id,
        'payment_option' => 'MONTHLY',
        'payment_channel' => 'COUNTER',
        'total_fee' => 30000,
    ]);

    $response = $this->actingAs($admin)
        ->delete(route('admin.enrollments.destroy', $enrollment));

    $response->assertRedirect(route('admin.students.index'));

    expect(Enrollment::find($enrollment->id))->toBeNull();
    expect(OfficeVerification::find($verification->id))->toBeNull();
    expect(BillingContract::find($billingContract->id))->toBeNull();

    // The student and their profile data are untouched — only the
    // application itself (and its own child records) were removed.
    expect(Student::find($student->id))->not->toBeNull();
});
