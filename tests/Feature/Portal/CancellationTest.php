<?php

use App\Models\EnrolleeUser;
use App\Models\Enrollment;

test('owner can cancel a pending enrollment', function () {
    $enrollee = EnrolleeUser::factory()->create();
    $enrollment = Enrollment::factory()->create([
        'enrollee_user_id' => $enrollee->id,
        'enrollment_status' => 'PENDING',
    ]);

    $this->actingAs($enrollee, 'enrollee')
        ->post(route('portal.enrollments.cancel', $enrollment))
        ->assertRedirect();

    expect($enrollment->fresh()->cancelled_at)->not->toBeNull();
});

test('a different account cannot cancel someone elses enrollment', function () {
    $owner = EnrolleeUser::factory()->create();
    $intruder = EnrolleeUser::factory()->create();
    $enrollment = Enrollment::factory()->create([
        'enrollee_user_id' => $owner->id,
        'enrollment_status' => 'PENDING',
    ]);

    $this->actingAs($intruder, 'enrollee')
        ->post(route('portal.enrollments.cancel', $enrollment))
        ->assertForbidden();
});
