<?php

use App\Models\EnrolleeUser;
use App\Models\Enrollment;
use App\Models\User;
use App\Notifications\ApplicationCancelled;
use Illuminate\Support\Facades\Notification;

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

test('admins are notified when a parent cancels an application', function () {
    Notification::fake();
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $enrollee = EnrolleeUser::factory()->create();
    $enrollment = Enrollment::factory()->create([
        'enrollee_user_id' => $enrollee->id,
        'enrollment_status' => 'PENDING',
    ]);

    $this->actingAs($enrollee, 'enrollee')->post(route('portal.enrollments.cancel', $enrollment));

    Notification::assertSentTo($admin, ApplicationCancelled::class, fn (ApplicationCancelled $notification) => $notification->enrollment->is($enrollment));
});

test('admins are not notified when a cancellation is refused', function () {
    Notification::fake();
    User::factory()->create(['role' => 'ADMIN']);
    $enrollee = EnrolleeUser::factory()->create();
    $enrollment = Enrollment::factory()->create([
        'enrollee_user_id' => $enrollee->id,
        'enrollment_status' => 'APPROVED',
    ]);

    $this->actingAs($enrollee, 'enrollee')
        ->post(route('portal.enrollments.cancel', $enrollment))
        ->assertSessionHasErrors('enrollment');

    Notification::assertNothingSent();
});
