<?php

use App\Models\EnrolleeUser;
use App\Notifications\ConfirmEmailReminder;
use App\Notifications\EmailConfirmed;
use App\Notifications\VerifyEnrolleeEmail;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Inertia\Testing\AssertableInertia as Assert;

function verificationUrlFor(EnrolleeUser $enrollee): string
{
    return URL::signedRoute('portal.verification.verify', [
        'id' => $enrollee->id,
        'hash' => sha1($enrollee->email),
    ]);
}

test('registering puts a "confirm your email" reminder in the bell', function () {
    Storage::fake('local');
    Notification::fake();

    $this->post(route('portal.register.store'), [
        'account_type' => 'PARENT_GUARDIAN',
        'name' => 'Ana Reyes',
        'email' => 'ana@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'valid_id' => UploadedFile::fake()->image('id.jpg'),
        'terms' => '1',
    ])->assertRedirect(route('portal.verification.notice'));

    $enrollee = EnrolleeUser::sole();

    Notification::assertSentTo($enrollee, VerifyEnrolleeEmail::class);
    Notification::assertSentTo($enrollee, ConfirmEmailReminder::class);
});

test('the reminder says where the link went and links to the notice page', function () {
    $enrollee = EnrolleeUser::factory()->unverified()->create(['email' => 'ana@example.com']);

    $enrollee->notify(new ConfirmEmailReminder);

    $this->actingAs($enrollee, 'enrollee')
        ->getJson(route('portal.notifications.index'))
        ->assertOk()
        ->assertJsonPath('unread_count', 1)
        ->assertJsonPath('notifications.0.data.type', 'confirm_email')
        ->assertJsonPath('notifications.0.data.url', '/portal/email/verify')
        ->assertJsonPath('notifications.0.data.message', fn (string $message) => str_contains($message, 'ana@example.com'));
});

test('confirming the email clears the reminder and adds an "email confirmed" notification', function () {
    $enrollee = EnrolleeUser::factory()->unverified()->pending()->create();
    $enrollee->notify(new ConfirmEmailReminder);

    $this->actingAs($enrollee, 'enrollee')->get(verificationUrlFor($enrollee));

    $isReadByType = $enrollee->fresh()->notifications
        ->mapWithKeys(fn ($notification) => [$notification->data['type'] => $notification->read_at !== null]);

    expect($isReadByType->keys()->sort()->values()->all())->toBe(['confirm_email', 'email_confirmed'])
        ->and($isReadByType['confirm_email'])->toBeTrue()
        ->and($isReadByType['email_confirmed'])->toBeFalse();
});

test('opening the link again does not add a second "email confirmed" notification', function () {
    Notification::fake();
    $enrollee = EnrolleeUser::factory()->unverified()->create();

    $this->actingAs($enrollee, 'enrollee')->get(verificationUrlFor($enrollee));
    $this->actingAs($enrollee, 'enrollee')->get(verificationUrlFor($enrollee));

    Notification::assertSentToTimes($enrollee, EmailConfirmed::class, 1);
});

test('the notice page shows the address the link was sent to', function () {
    $enrollee = EnrolleeUser::factory()->unverified()->create(['email' => 'ana@gmail.com']);

    $this->actingAs($enrollee, 'enrollee')
        ->get(route('portal.verification.notice'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Portal/VerifyEmail')
            ->where('email', 'ana@gmail.com'));
});

test('resending confirms which address it went to', function () {
    Notification::fake();
    $enrollee = EnrolleeUser::factory()->unverified()->create(['email' => 'ana@example.com']);

    $this->actingAs($enrollee, 'enrollee')
        ->from(route('portal.verification.notice'))
        ->post(route('portal.verification.send'))
        ->assertRedirect(route('portal.verification.notice'))
        ->assertSessionHas('success', 'We sent a new link to ana@example.com.');

    Notification::assertSentTo($enrollee, VerifyEnrolleeEmail::class);
});

test('resending is rate limited', function () {
    Notification::fake();
    $enrollee = EnrolleeUser::factory()->unverified()->create();

    foreach (range(1, 6) as $attempt) {
        $this->actingAs($enrollee, 'enrollee')->post(route('portal.verification.send'));
    }

    $this->actingAs($enrollee, 'enrollee')
        ->post(route('portal.verification.send'))
        ->assertTooManyRequests();
});
