<?php

use App\Models\EnrolleeUser;
use App\Models\Enrollment;
use App\Models\User;
use App\Notifications\VerifyEnrolleeEmail;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Inertia\Testing\AssertableInertia as Assert;

test('registering sends a verification email', function () {
    Notification::fake();
    Storage::fake('local');

    $this->post(route('portal.register.store'), [
        'name' => 'Juan Dela Cruz',
        'email' => 'juan@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'valid_id' => UploadedFile::fake()->image('valid-id.jpg'),
        'account_type' => 'PARENT_GUARDIAN',
        'terms' => '1',
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

/**
 * The link from the verification email.
 */
function verificationUrl(EnrolleeUser $enrollee, ?string $hash = null): string
{
    return URL::temporarySignedRoute('portal.verification.verify', now()->addHour(), [
        'id' => $enrollee->id,
        'hash' => $hash ?? sha1($enrollee->email),
    ]);
}

test('the link works in a browser that is not signed in to the portal', function () {
    $enrollee = EnrolleeUser::factory()->unverified()->create();

    $this->get(verificationUrl($enrollee))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Portal/EmailVerified')
            ->where('email', $enrollee->email));

    expect($enrollee->fresh()->hasVerifiedEmail())->toBeTrue();
});

test('the link never lands on the admin panel when staff are signed in', function () {
    $enrollee = EnrolleeUser::factory()->unverified()->create();

    $this->actingAs(User::factory()->admin()->create())
        ->get(verificationUrl($enrollee))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Portal/EmailVerified'));

    expect($enrollee->fresh()->hasVerifiedEmail())->toBeTrue();
});

test('an admin page left as the intended url is ignored', function () {
    $enrollee = EnrolleeUser::factory()->unverified()->create();

    $this->actingAs($enrollee, 'enrollee')
        ->withSession(['url.intended' => route('admin.dashboard')])
        ->get(verificationUrl($enrollee))
        ->assertRedirect(route('portal.dashboard'));
});

test('a tampered or unsigned link does not verify the email', function (Closure $url) {
    $enrollee = EnrolleeUser::factory()->unverified()->create();

    $this->get($url($enrollee))->assertForbidden();

    expect($enrollee->fresh()->hasVerifiedEmail())->toBeFalse();
})->with([
    'unsigned' => [fn (EnrolleeUser $enrollee) => route('portal.verification.verify', ['id' => $enrollee->id, 'hash' => sha1($enrollee->email)])],
    'wrong email hash' => [fn (EnrolleeUser $enrollee) => verificationUrl($enrollee, sha1('someone@else.com'))],
]);
