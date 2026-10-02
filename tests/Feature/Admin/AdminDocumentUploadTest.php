<?php

use App\Models\Enrollment;
use App\Models\OfficeVerification;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('admins can upload a document for a returning student and it is marked verified', function () {
    Storage::fake('public');

    $admin = User::factory()->create(['role' => 'ADMIN']);
    $enrollment = Enrollment::factory()->create(['student_type' => 'RETURNEE']);

    $this->actingAs($admin)
        ->post(route('admin.enrollments.documents.store', [$enrollment, 'form_138']), [
            'file' => UploadedFile::fake()->create('report-card.pdf', 200, 'application/pdf'),
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    $verification = $enrollment->officeVerification()->first();
    expect($verification->form_138_path)->not->toBeNull();
    expect($verification->has_form_138)->toBeTrue();
    expect($verification->verified_by)->toBe($admin->id);
    Storage::disk('public')->assertExists($verification->form_138_path);
});

test('uploading again replaces the old file', function () {
    Storage::fake('public');

    $admin = User::factory()->create(['role' => 'ADMIN']);
    $enrollment = Enrollment::factory()->create(['enrollment_status' => 'APPROVED']);
    $oldPath = UploadedFile::fake()->create('old.pdf', 100, 'application/pdf')->store('documents', 'public');
    OfficeVerification::create(['enrollment_id' => $enrollment->id, 'good_moral_path' => $oldPath]);

    $this->actingAs($admin)
        ->post(route('admin.enrollments.documents.store', [$enrollment, 'good_moral']), [
            'file' => UploadedFile::fake()->image('good-moral.jpg'),
        ])
        ->assertSessionHasNoErrors();

    $newPath = $enrollment->officeVerification()->first()->good_moral_path;
    expect($newPath)->not->toBe($oldPath);
    Storage::disk('public')->assertMissing($oldPath);
    Storage::disk('public')->assertExists($newPath);
});

test('the upload must be a pdf or image', function () {
    Storage::fake('public');

    $admin = User::factory()->create(['role' => 'ADMIN']);
    $enrollment = Enrollment::factory()->create();

    $this->actingAs($admin)
        ->post(route('admin.enrollments.documents.store', [$enrollment, 'birth_certificate']), [
            'file' => UploadedFile::fake()->create('notes.txt', 10, 'text/plain'),
        ])
        ->assertSessionHasErrors('file');

    expect($enrollment->officeVerification()->first()?->birth_certificate_path)->toBeNull();
});

test('a file is required', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $enrollment = Enrollment::factory()->create();

    $this->actingAs($admin)
        ->post(route('admin.enrollments.documents.store', [$enrollment, 'form_138']))
        ->assertSessionHasErrors('file');
});

test('unknown document types are not found', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $enrollment = Enrollment::factory()->create();

    $this->actingAs($admin)
        ->post("/admin/enrollments/{$enrollment->id}/documents/passport", [
            'file' => UploadedFile::fake()->create('passport.pdf', 100, 'application/pdf'),
        ])
        ->assertNotFound();
});

test('non-admin users cannot upload documents', function () {
    Storage::fake('public');

    $staff = User::factory()->create(['role' => 'STAFF']);
    $enrollment = Enrollment::factory()->create();

    $this->actingAs($staff)
        ->post(route('admin.enrollments.documents.store', [$enrollment, 'form_138']), [
            'file' => UploadedFile::fake()->create('report-card.pdf', 200, 'application/pdf'),
        ])
        ->assertForbidden();
});

test('guests cannot upload documents', function () {
    $enrollment = Enrollment::factory()->create();

    $this->post(route('admin.enrollments.documents.store', [$enrollment, 'form_138']))
        ->assertRedirect(route('login'));
});
