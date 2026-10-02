<?php

use App\Enums\EnrollmentRejectionReason;
use App\Mail\EnrollmentStatusUpdated;
use App\Models\EnrolleeUser;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;

test('rejecting an application records the reasons and tells the parent why by email and notification', function () {
    Mail::fake();

    $admin = User::factory()->create(['role' => 'ADMIN']);
    $enrollee = EnrolleeUser::factory()->create();
    $enrollment = Enrollment::factory()->create([
        'enrollee_user_id' => $enrollee->id,
        'enrollment_status' => 'PENDING',
        'email' => 'parent@example.com',
    ]);

    $this->actingAs($admin)
        ->patch(route('admin.enrollments.status.update', $enrollment), [
            'enrollment_status' => 'REJECTED',
            'rejection_reasons' => ['INCOMPLETE_GRADES', 'MISSING_REQUIREMENTS'],
            'rejection_note' => 'Math and Science grades are still incomplete.',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    $enrollment->refresh();
    expect($enrollment->enrollment_status)->toBe('REJECTED');
    expect($enrollment->rejection_reasons->all())->toBe([
        EnrollmentRejectionReason::IncompleteGrades,
        EnrollmentRejectionReason::MissingRequirements,
    ]);
    expect($enrollment->rejection_note)->toBe('Math and Science grades are still incomplete.');

    Mail::assertSent(EnrollmentStatusUpdated::class, function (EnrollmentStatusUpdated $mail) {
        $html = $mail->render();

        return $mail->hasTo('parent@example.com')
            && str_contains($html, 'Incomplete grades')
            && str_contains($html, 'Missing requirements')
            && str_contains($html, 'Math and Science grades are still incomplete.');
    });

    $notification = $enrollee->notifications()->first();
    expect($notification->data['title'])->toBe('Application not approved');
    expect($notification->data['message'])
        ->toContain('Incomplete grades')
        ->toContain('Missing requirements')
        ->toContain('Math and Science grades are still incomplete.');
});

test('a rejection needs at least one reason', function () {
    Mail::fake();

    $admin = User::factory()->create(['role' => 'ADMIN']);
    $enrollment = Enrollment::factory()->create(['enrollment_status' => 'PENDING']);

    $this->actingAs($admin)
        ->patch(route('admin.enrollments.status.update', $enrollment), ['enrollment_status' => 'REJECTED'])
        ->assertSessionHasErrors('rejection_reasons');

    expect($enrollment->fresh()->enrollment_status)->toBe('PENDING');
    Mail::assertNotSent(EnrollmentStatusUpdated::class);
});

test('rejection reasons must be known values', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $enrollment = Enrollment::factory()->create(['enrollment_status' => 'PENDING']);

    $this->actingAs($admin)
        ->patch(route('admin.enrollments.status.update', $enrollment), [
            'enrollment_status' => 'REJECTED',
            'rejection_reasons' => ['NOT_A_REASON'],
        ])
        ->assertSessionHasErrors('rejection_reasons.0');
});

test('the other reason needs a note', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $enrollment = Enrollment::factory()->create(['enrollment_status' => 'PENDING']);

    $this->actingAs($admin)
        ->patch(route('admin.enrollments.status.update', $enrollment), [
            'enrollment_status' => 'REJECTED',
            'rejection_reasons' => ['OTHER'],
        ])
        ->assertSessionHasErrors('rejection_note');
});

test('reasons cannot be sent when approving', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $enrollment = Enrollment::factory()->create(['enrollment_status' => 'PENDING']);

    $this->actingAs($admin)
        ->patch(route('admin.enrollments.status.update', $enrollment), [
            'enrollment_status' => 'APPROVED',
            'rejection_reasons' => ['INCOMPLETE_GRADES'],
        ])
        ->assertSessionHasErrors('rejection_reasons');
});

test('moving a rejected application back to pending clears its rejection reasons', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $enrollment = Enrollment::factory()->create([
        'enrollment_status' => 'REJECTED',
        'rejection_reasons' => [EnrollmentRejectionReason::IncompleteGrades],
        'rejection_note' => 'Grades are incomplete.',
    ]);

    $this->actingAs($admin)
        ->patch(route('admin.enrollments.status.update', $enrollment), ['enrollment_status' => 'PENDING'])
        ->assertSessionHasNoErrors();

    $enrollment->refresh();
    expect($enrollment->rejection_reasons)->toBeNull();
    expect($enrollment->rejection_note)->toBeNull();
});

test('the parent portal shows why an application was rejected', function () {
    $enrollee = EnrolleeUser::factory()->create();
    Enrollment::factory()->create([
        'enrollee_user_id' => $enrollee->id,
        'enrollment_status' => 'REJECTED',
        'rejection_reasons' => [EnrollmentRejectionReason::IncompleteGrades],
        'rejection_note' => 'Grades are incomplete.',
    ]);

    $this->actingAs($enrollee, 'enrollee')
        ->get(route('portal.dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Portal/Dashboard')
            ->where('enrollments.0.rejection_details.0.label', 'Incomplete grades')
            ->where('enrollments.0.rejection_note', 'Grades are incomplete.'));
});

test('the admin page lists the rejection reasons to choose from', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $enrollment = Enrollment::factory()->create();

    $this->actingAs($admin)
        ->get(route('admin.enrollments.show', $enrollment))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Enrollments/Show')
            ->has('rejectionReasons', count(EnrollmentRejectionReason::cases()))
            ->where('rejectionReasons.0', ['value' => 'INCOMPLETE_GRADES', 'label' => 'Incomplete grades']));
});
