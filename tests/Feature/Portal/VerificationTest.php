<?php

use App\Models\EnrolleeUser;
use App\Models\Enrollment;
use App\Notifications\VerifyEnrolleeEmail;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;

test('registering sends a verification email', function () {
    Notification::fake();

    $this->post(route('portal.register.store'), [
        'name' => 'Juan Dela Cruz',
        'email' => 'juan@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ])->assertRedirect(route('portal.verification.notice'));

    $enrollee = EnrolleeUser::where('email', 'juan@example.com')->first();

    Notification::assertSentTo($enrollee, VerifyEnrolleeEmail::class);
});

test('verifying email links matching guest enrollments', function () {
    $enrollee = EnrolleeUser::factory()->unverified()->create(['email' => 'parent@example.com']);
    $enrollment = Enrollment::factory()->create(['email' => 'parent@example.com', 'enrollee_user_id' => null]);

    $url = URL::signedRoute('portal.verification.verify', [
        'id' => $enrollee->id,
        'hash' => sha1($enrollee->email),
    ]);

    $this->actingAs($enrollee, 'enrollee')->get($url)->assertRedirect(route('portal.dashboard'));

    expect($enrollee->fresh()->hasVerifiedEmail())->toBeTrue();
    expect($enrollment->fresh()->enrollee_user_id)->toBe($enrollee->id);
});
