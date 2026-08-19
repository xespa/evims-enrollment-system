<?php

use App\Mail\EnrollmentStatusUpdated;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

test('approving an enrollment emails the applicant', function () {
    Mail::fake();

    $admin = User::factory()->create(['role' => 'ADMIN']);
    $enrollment = Enrollment::factory()->create([
        'enrollment_status' => 'PENDING',
        'email' => 'parent@example.com',
    ]);

    $this->actingAs($admin)
        ->patch(route('admin.enrollments.updateStatus', $enrollment), [
            'enrollment_status' => 'APPROVED',
        ])
        ->assertRedirect();

    Mail::assertSent(EnrollmentStatusUpdated::class, fn ($mail) => $mail->hasTo($enrollment->email));
});

test('no email is sent when status is unchanged', function () {
    Mail::fake();

    $admin = User::factory()->create(['role' => 'ADMIN']);
    $enrollment = Enrollment::factory()->create([
        'enrollment_status' => 'PENDING',
        'email' => 'parent@example.com',
    ]);

    $this->actingAs($admin)
        ->patch(route('admin.enrollments.updateStatus', $enrollment), [
            'enrollment_status' => 'PENDING',
        ]);

    Mail::assertNotSent(EnrollmentStatusUpdated::class);
});
