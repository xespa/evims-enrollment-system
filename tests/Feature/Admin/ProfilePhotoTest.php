<?php

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    Storage::fake('public');
});

test('admins can upload a profile photo', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);

    $response = $this
        ->actingAs($admin)
        ->from(route('admin.settings.profile.edit'))
        ->put(route('admin.settings.profile-photo.update'), [
            'photo' => UploadedFile::fake()->image('me.jpg', 400, 400),
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('admin.settings.profile.edit'));

    $path = $admin->refresh()->profile_photo_path;

    expect($path)->toStartWith('avatars/');
    Storage::disk('public')->assertExists($path);
});

test('uploading a new profile photo removes the old one', function () {
    $oldPath = UploadedFile::fake()->image('old.jpg')->store('avatars', 'public');
    $admin = User::factory()->create(['role' => 'ADMIN', 'profile_photo_path' => $oldPath]);

    $this
        ->actingAs($admin)
        ->put(route('admin.settings.profile-photo.update'), [
            'photo' => UploadedFile::fake()->image('new.png'),
        ])
        ->assertSessionHasNoErrors();

    Storage::disk('public')->assertMissing($oldPath);
    Storage::disk('public')->assertExists($admin->refresh()->profile_photo_path);
});

test('the profile photo must be an image of at most 2MB', function (UploadedFile $photo) {
    $admin = User::factory()->create(['role' => 'ADMIN']);

    $this
        ->actingAs($admin)
        ->from(route('admin.settings.profile.edit'))
        ->put(route('admin.settings.profile-photo.update'), ['photo' => $photo])
        ->assertSessionHasErrors('photo')
        ->assertRedirect(route('admin.settings.profile.edit'));

    expect($admin->refresh()->profile_photo_path)->toBeNull();
})->with([
    'not an image' => fn () => UploadedFile::fake()->create('notes.pdf', 100, 'application/pdf'),
    'too large' => fn () => UploadedFile::fake()->image('huge.jpg')->size(3000),
]);

test('a profile photo is required', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);

    $this
        ->actingAs($admin)
        ->put(route('admin.settings.profile-photo.update'))
        ->assertSessionHasErrors('photo');
});

test('admins can remove their profile photo', function () {
    $path = UploadedFile::fake()->image('me.jpg')->store('avatars', 'public');
    $admin = User::factory()->create(['role' => 'ADMIN', 'profile_photo_path' => $path]);

    $this
        ->actingAs($admin)
        ->from(route('admin.settings.profile.edit'))
        ->delete(route('admin.settings.profile-photo.destroy'))
        ->assertRedirect(route('admin.settings.profile.edit'));

    expect($admin->refresh()->profile_photo_path)->toBeNull();
    Storage::disk('public')->assertMissing($path);
});

test('deleting an admin account also deletes its profile photo', function () {
    $path = UploadedFile::fake()->image('me.jpg')->store('avatars', 'public');
    $admin = User::factory()->create(['role' => 'ADMIN', 'profile_photo_path' => $path]);
    User::factory()->admin()->create();

    $this
        ->actingAs($admin)
        ->delete(route('admin.settings.destroy'), ['password' => 'password'])
        ->assertSessionHasNoErrors();

    Storage::disk('public')->assertMissing($path);
});

test('the profile photo url is shared with admin pages', function () {
    $path = UploadedFile::fake()->image('me.jpg')->store('avatars', 'public');
    $admin = User::factory()->create(['role' => 'ADMIN', 'profile_photo_path' => $path]);

    $this
        ->actingAs($admin)
        ->get(route('admin.dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('auth.user.profile_photo_url', Storage::disk('public')->url($path))
        );
});

test('guests cannot change a profile photo', function () {
    $photo = UploadedFile::fake()->image('me.jpg');

    $this->put(route('admin.settings.profile-photo.update'), ['photo' => $photo])
        ->assertRedirect(route('login'));
    $this->delete(route('admin.settings.profile-photo.destroy'))
        ->assertRedirect(route('login'));
});

test('every staff role can change their own profile photo', function (string $role) {
    $staff = User::factory()->create(['role' => $role]);

    $this->actingAs($staff)
        ->put(route('admin.settings.profile-photo.update'), [
            'photo' => UploadedFile::fake()->image('me.jpg'),
        ])
        ->assertSessionHasNoErrors();

    expect($staff->refresh()->profile_photo_path)->not->toBeNull();
})->with(['REGISTRAR', 'TEACHER', 'CASHIER']);
