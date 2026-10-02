<?php

use App\Models\EnrolleeUser;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * @return array<string, mixed>
 */
function portalRegistration(array $overrides = []): array
{
    return array_merge([
        'name' => 'Maria Dela Cruz',
        'email' => 'maria@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'valid_id' => UploadedFile::fake()->image('philsys.jpg'),
        'account_type' => 'PARENT_GUARDIAN',
        'terms' => '1',
    ], $overrides);
}

test('registering stores the valid ID on the private disk', function () {
    Notification::fake();
    Storage::fake('local');
    Storage::fake('public');

    $this->post(route('portal.register.store'), portalRegistration())
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('portal.verification.notice'));

    $enrollee = EnrolleeUser::where('email', 'maria@example.com')->sole();

    expect($enrollee->valid_id_path)->toStartWith('valid-ids/');
    Storage::disk('local')->assertExists($enrollee->valid_id_path);
    expect(Storage::disk('public')->allFiles())->toBeEmpty();
});

test('a valid ID is required to register', function () {
    $this->post(route('portal.register.store'), portalRegistration(['valid_id' => null]))
        ->assertSessionHasErrors(['valid_id' => 'Attach a photo or scan of a valid government-issued ID.']);

    expect(EnrolleeUser::count())->toBe(0);
});

test('the valid ID must be an image or PDF of at most 10MB', function (UploadedFile $file) {
    Storage::fake('local');

    $this->post(route('portal.register.store'), portalRegistration(['valid_id' => $file]))
        ->assertSessionHasErrors('valid_id');

    expect(EnrolleeUser::count())->toBe(0);
    expect(Storage::disk('local')->allFiles())->toBeEmpty();
})->with([
    'executable' => fn () => UploadedFile::fake()->create('id.exe', 100, 'application/x-msdownload'),
    'too large' => fn () => UploadedFile::fake()->create('id.pdf', 10241, 'application/pdf'),
]);

test('the valid ID path is never shared with the browser', function () {
    $enrollee = EnrolleeUser::factory()->create();

    $this->actingAs($enrollee, 'enrollee')
        ->get(route('portal.dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('auth.enrollee.id', $enrollee->id)
            ->missing('auth.enrollee.valid_id_path'));
});

test('admins can view a parent\'s valid ID', function () {
    Storage::fake('local');
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $path = UploadedFile::fake()->image('philsys.jpg')->store('valid-ids', 'local');
    $enrollee = EnrolleeUser::factory()->pending()->create(['valid_id_path' => $path]);

    $this->actingAs($admin)
        ->get(route('admin.enrollee-accounts.valid-id.show', $enrollee))
        ->assertOk()
        ->assertHeader('Content-Type', 'image/jpeg');

    $this->actingAs($admin)
        ->get(route('admin.enrollee-accounts.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('accounts.data.0.has_valid_id', true)
            ->where('accounts.data.0.valid_id_is_pdf', false)
            ->missing('accounts.data.0.valid_id_path'));
});

test('admins are told when a valid ID is a pdf so it can be previewed as one', function () {
    Storage::fake('local');
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $path = UploadedFile::fake()->create('philsys.PDF', 100, 'application/pdf')->store('valid-ids', 'local');
    EnrolleeUser::factory()->pending()->create(['valid_id_path' => $path]);

    $this->actingAs($admin)
        ->get(route('admin.enrollee-accounts.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('accounts.data.0.valid_id_is_pdf', true)
            ->missing('accounts.data.0.valid_id_path'));
});

test('accounts without an ID on file return not found', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $enrollee = EnrolleeUser::factory()->create(['valid_id_path' => null]);

    $this->actingAs($admin)
        ->get(route('admin.enrollee-accounts.valid-id.show', $enrollee))
        ->assertNotFound();
});

test('guests and non-admins cannot view a valid ID', function () {
    Storage::fake('local');
    $path = UploadedFile::fake()->image('philsys.jpg')->store('valid-ids', 'local');
    $enrollee = EnrolleeUser::factory()->create(['valid_id_path' => $path]);

    $this->get(route('admin.enrollee-accounts.valid-id.show', $enrollee))
        ->assertRedirect(route('login'));

    $this->actingAs(User::factory()->create(['role' => 'STAFF']))
        ->get(route('admin.enrollee-accounts.valid-id.show', $enrollee))
        ->assertForbidden();
});
