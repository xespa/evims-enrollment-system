<?php

use App\Enums\AccountRejectionReason;
use App\Enums\AccountStatus;
use App\Enums\AccountType;
use App\Models\EnrolleeUser;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    Storage::fake('local');
});

function rejectedAccount(): EnrolleeUser
{
    return EnrolleeUser::factory()
        ->rejected([AccountRejectionReason::BlurryId], 'The photo is too dark.')
        ->create([
            'email' => 'maria@example.com',
            'valid_id_path' => UploadedFile::fake()->image('dark.jpg')->store('valid-ids', 'local'),
            'reviewed_at' => now(),
        ]);
}

/**
 * The signed form action handed to the page, as the browser would submit to.
 */
function reapplyActionFor(EnrolleeUser $enrollee): string
{
    return URL::temporarySignedRoute('portal.reapplication.store', now()->addHour(), ['enrolleeUser' => $enrollee->id]);
}

/**
 * @return array<string, mixed>
 */
function reapplicationPayload(array $overrides = []): array
{
    return array_merge([
        'account_type' => 'PARENT_GUARDIAN',
        'name' => 'Maria Santos Reyes',
        'password' => 'new-password-123',
        'password_confirmation' => 'new-password-123',
        'valid_id' => UploadedFile::fake()->image('clear.jpg'),
        'terms' => '1',
    ], $overrides);
}

test('the emailed link shows the register form with the previous attempt\'s issues', function () {
    $enrollee = rejectedAccount();

    $this->get($enrollee->reapplicationUrl())
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Portal/Register')
            ->where('reapplication.email', 'maria@example.com')
            ->where('reapplication.reasons.0.label', AccountRejectionReason::BlurryId->label())
            ->where('reapplication.note', 'The photo is too dark.')
            ->has('reapplication.action'));
});

test('creating the account again sends it back for review and logs them in', function () {
    $enrollee = rejectedAccount();
    $oldIdPath = $enrollee->valid_id_path;
    $enrollment = Enrollment::factory()->create(['enrollee_user_id' => $enrollee->id]);

    $this->post(reapplyActionFor($enrollee), reapplicationPayload(['account_type' => 'STUDENT']))
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('portal.account-status'));

    $enrollee->refresh();

    expect($enrollee->account_status)->toBe(AccountStatus::Pending)
        ->and($enrollee->name)->toBe('Maria Santos Reyes')
        ->and($enrollee->account_type)->toBe(AccountType::Student)
        ->and(Hash::check('new-password-123', $enrollee->password))->toBeTrue()
        ->and($enrollee->email)->toBe('maria@example.com')
        ->and($enrollee->terms_accepted_at)->not->toBeNull()
        ->and($enrollment->fresh()->enrollee_user_id)->toBe($enrollee->id);

    Storage::disk('local')->assertExists($enrollee->valid_id_path);
    Storage::disk('local')->assertMissing($oldIdPath);
    $this->assertAuthenticatedAs($enrollee, 'enrollee');
});

test('admins see the account back in the pending queue', function () {
    $enrollee = rejectedAccount();

    $this->post(reapplyActionFor($enrollee), reapplicationPayload());

    $this->actingAs(User::factory()->create(['role' => 'ADMIN']))
        ->get(route('admin.enrollee-accounts.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('accounts.data.0.id', $enrollee->id)
            ->where('accounts.data.0.rejection_reasons', ['BLURRY_ID']));
});

test('the email cannot be changed when trying again', function () {
    $enrollee = rejectedAccount();

    $this->post(reapplyActionFor($enrollee), reapplicationPayload(['email' => 'attacker@example.com']))
        ->assertSessionHasNoErrors();

    expect($enrollee->fresh()->email)->toBe('maria@example.com');
});

test('trying again still needs a valid ID and the terms', function (string $field, mixed $value) {
    $enrollee = rejectedAccount();

    $this->post(reapplyActionFor($enrollee), reapplicationPayload([$field => $value]))
        ->assertSessionHasErrors($field);

    expect($enrollee->fresh()->account_status)->toBe(AccountStatus::Rejected);
})->with([
    'no ID' => ['valid_id', null],
    'terms not accepted' => ['terms', null],
]);

test('links without a valid signature are refused', function () {
    $enrollee = rejectedAccount();

    $this->get(route('portal.reapplication.create', $enrollee))->assertForbidden();
    $this->post(route('portal.reapplication.store', $enrollee), reapplicationPayload())->assertForbidden();

    expect($enrollee->fresh()->account_status)->toBe(AccountStatus::Rejected);
});

test('the link expires after two weeks', function () {
    $url = rejectedAccount()->reapplicationUrl();

    $this->travel(15)->days();

    $this->get($url)->assertForbidden();
});

test('accounts that are no longer rejected cannot be redone from an old link', function () {
    $enrollee = rejectedAccount();
    $url = $enrollee->reapplicationUrl();
    $action = reapplyActionFor($enrollee);
    $enrollee->forceFill(['account_status' => AccountStatus::Approved])->save();

    $this->get($url)->assertRedirect(route('portal.login'));
    $this->post($action, reapplicationPayload())->assertForbidden();
});
