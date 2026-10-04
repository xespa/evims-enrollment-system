<?php

use App\Enums\AccountRejectionReason;
use App\Enums\AccountStatus;
use App\Models\EnrolleeUser;
use App\Models\User;
use App\Notifications\EnrolleeAccountAwaitingReview;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    Storage::fake('local');
});

function rejectedEnrolleeWithStoredId(): EnrolleeUser
{
    $path = UploadedFile::fake()->image('blurry.jpg')->store('valid-ids', 'local');

    return EnrolleeUser::factory()
        ->rejected([AccountRejectionReason::BlurryId])
        ->create(['valid_id_path' => $path, 'reviewed_at' => now()]);
}

test('a rejected account can upload a new ID and goes back to review', function () {
    $enrollee = rejectedEnrolleeWithStoredId();
    $oldPath = $enrollee->valid_id_path;

    $this->actingAs($enrollee, 'enrollee')
        ->put(route('portal.valid-id.update'), [
            'valid_id' => UploadedFile::fake()->image('clear.jpg'),
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('portal.account-status'));

    $enrollee->refresh();

    expect($enrollee->account_status)->toBe(AccountStatus::Pending)
        ->and($enrollee->valid_id_path)->not->toBe($oldPath);
    Storage::disk('local')->assertExists($enrollee->valid_id_path);
    Storage::disk('local')->assertMissing($oldPath);
});

test('after resubmitting, the account page says the new ID was received', function () {
    $enrollee = rejectedEnrolleeWithStoredId();

    $this->actingAs($enrollee, 'enrollee')
        ->put(route('portal.valid-id.update'), ['valid_id' => UploadedFile::fake()->image('clear.jpg')]);

    $this->actingAs($enrollee, 'enrollee')
        ->get(route('portal.account-status'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('status', 'PENDING')
            ->where('hasResubmittedId', true));
});

test('admins see resubmitted accounts in the pending queue with the earlier reasons', function () {
    $enrollee = rejectedEnrolleeWithStoredId();

    $this->actingAs($enrollee, 'enrollee')
        ->put(route('portal.valid-id.update'), ['valid_id' => UploadedFile::fake()->image('clear.jpg')]);

    $this->actingAs(User::factory()->create(['role' => 'ADMIN']))
        ->get(route('admin.enrollee-accounts.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('accounts.data.0.id', $enrollee->id)
            ->where('accounts.data.0.rejection_reasons', ['BLURRY_ID'])
            ->whereNot('accounts.data.0.reviewed_at', null));
});

test('the new ID must be an image or PDF', function (?UploadedFile $file) {
    $enrollee = rejectedEnrolleeWithStoredId();

    $this->actingAs($enrollee, 'enrollee')
        ->put(route('portal.valid-id.update'), ['valid_id' => $file])
        ->assertSessionHasErrors('valid_id');

    expect($enrollee->fresh()->account_status)->toBe(AccountStatus::Rejected);
})->with([
    'missing' => fn () => null,
    'executable' => fn () => UploadedFile::fake()->create('id.exe', 50, 'application/x-msdownload'),
    'too large' => fn () => UploadedFile::fake()->create('id.pdf', 10241, 'application/pdf'),
]);

test('approved accounts cannot replace their ID', function () {
    $enrollee = EnrolleeUser::factory()->create();

    $this->actingAs($enrollee, 'enrollee')
        ->put(route('portal.valid-id.update'), ['valid_id' => UploadedFile::fake()->image('id.jpg')])
        ->assertForbidden();
});

test('guests cannot upload an ID', function () {
    $this->put(route('portal.valid-id.update'), ['valid_id' => UploadedFile::fake()->image('id.jpg')])
        ->assertRedirect(route('portal.login'));
});

test('a name mismatch sends the account to the full sign-up form, not just an ID upload', function (array $reasons) {
    $enrollee = EnrolleeUser::factory()->rejected($reasons)->create();

    $response = $this->actingAs($enrollee, 'enrollee')->get(route('portal.account-status'));

    $response->assertRedirect();
    expect($response->headers->get('Location'))->toStartWith(route('portal.reapplication.create', $enrollee));

    $this->actingAs($enrollee, 'enrollee')
        ->get($response->headers->get('Location'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Portal/Register')
            ->where('reapplication.email', $enrollee->email)
            ->where('reapplication.name', $enrollee->name)
            ->has('reapplication.reasons', count($reasons)));
})->with([
    'name mismatch' => [[AccountRejectionReason::NameMismatch]],
    'name mismatch and a blurry ID' => [[AccountRejectionReason::BlurryId, AccountRejectionReason::NameMismatch]],
    'other reason' => [[AccountRejectionReason::Other]],
]);

test('ID-only problems keep the quick upload form', function () {
    $enrollee = EnrolleeUser::factory()->rejected([AccountRejectionReason::ExpiredId])->create();

    $this->actingAs($enrollee, 'enrollee')
        ->get(route('portal.account-status'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Portal/AccountStatus'));
});

test('a name mismatch cannot be fixed by only uploading a new ID', function () {
    $enrollee = rejectedEnrolleeWithStoredId();
    $enrollee->forceFill(['rejection_reasons' => [AccountRejectionReason::NameMismatch]])->save();

    $this->actingAs($enrollee, 'enrollee')
        ->put(route('portal.valid-id.update'), ['valid_id' => UploadedFile::fake()->image('id.jpg')])
        ->assertForbidden();

    expect($enrollee->fresh()->account_status)->toBe(AccountStatus::Rejected);
});

test('admins are notified when a rejected account sends a new ID', function () {
    Notification::fake();
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $enrollee = rejectedEnrolleeWithStoredId();

    $this->actingAs($enrollee, 'enrollee')
        ->put(route('portal.valid-id.update'), ['valid_id' => UploadedFile::fake()->image('clear.jpg')]);

    Notification::assertSentTo($admin, EnrolleeAccountAwaitingReview::class, fn (EnrolleeAccountAwaitingReview $notification) => $notification->isResubmission);
});
