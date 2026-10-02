<?php

use App\Models\EnrolleeUser;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    Notification::fake();
    Storage::fake('local');
});

/**
 * @return array<string, mixed>
 */
function registrationWithTerms(mixed $terms): array
{
    return array_filter([
        'account_type' => 'PARENT_GUARDIAN',
        'name' => 'Ana Reyes',
        'email' => 'ana@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'valid_id' => UploadedFile::fake()->image('philsys.jpg'),
        'terms' => $terms,
    ], fn (mixed $value) => $value !== null);
}

test('agreeing to the terms is recorded on the account', function () {
    $this->freezeTime();

    $this->post(route('portal.register.store'), registrationWithTerms('1'))
        ->assertSessionHasNoErrors();

    expect(EnrolleeUser::sole()->terms_accepted_at?->toDateTimeString())->toBe(now()->toDateTimeString());
});

test('an account cannot be created without agreeing to the terms', function (?string $terms) {
    $this->post(route('portal.register.store'), registrationWithTerms($terms))
        ->assertSessionHasErrors(['terms' => 'Please read and agree to the Terms and Conditions to create an account.']);

    expect(EnrolleeUser::count())->toBe(0);
    expect(Storage::disk('local')->allFiles())->toBeEmpty();
})->with([
    'not ticked' => [null],
    'declined' => ['0'],
]);

test('anyone can read the terms and conditions', function () {
    $this->get(route('site.terms'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Site/Terms'));
});
