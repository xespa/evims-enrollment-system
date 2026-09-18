<?php

use App\Models\EnrolleeUser;
use App\Models\Enrollment;
use App\Models\OfficeVerification;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('owner can upload a document for their pending enrollment', function () {
    Storage::fake('public');

    $enrollee = EnrolleeUser::factory()->create();
    $enrollment = Enrollment::factory()->create([
        'enrollee_user_id' => $enrollee->id,
        'enrollment_status' => 'PENDING',
    ]);

    $this->actingAs($enrollee, 'enrollee')
        ->post(route('portal.documents.upload', [$enrollment, 'form_138']), [
            'file' => UploadedFile::fake()->create('form138.pdf', 200, 'application/pdf'),
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $verification = OfficeVerification::where('enrollment_id', $enrollment->id)->first();
    expect($verification)->not->toBeNull();
    expect($verification->form_138_path)->not->toBeNull();
    expect($verification->has_form_138)->toBeFalse();
    Storage::disk('public')->assertExists($verification->form_138_path);
});

test('re-uploading a document deletes the old file and clears its verified flag', function () {
    Storage::fake('public');

    $enrollee = EnrolleeUser::factory()->create();
    $enrollment = Enrollment::factory()->create([
        'enrollee_user_id' => $enrollee->id,
        'enrollment_status' => 'PENDING',
    ]);

    $oldPath = 'documents/old-form138.pdf';
    Storage::disk('public')->put($oldPath, 'old contents');

    OfficeVerification::create([
        'enrollment_id' => $enrollment->id,
        'form_138_path' => $oldPath,
        'has_form_138' => true,
    ]);

    $this->actingAs($enrollee, 'enrollee')
        ->post(route('portal.documents.upload', [$enrollment, 'form_138']), [
            'file' => UploadedFile::fake()->create('new-form138.pdf', 200, 'application/pdf'),
        ])
        ->assertSessionHasNoErrors();

    Storage::disk('public')->assertMissing($oldPath);

    $verification = OfficeVerification::where('enrollment_id', $enrollment->id)->first();
    expect($verification->form_138_path)->not->toBe($oldPath);
    expect($verification->has_form_138)->toBeFalse();
});

test('documents cannot be uploaded once the enrollment is approved', function () {
    Storage::fake('public');

    $enrollee = EnrolleeUser::factory()->create();
    $enrollment = Enrollment::factory()->create([
        'enrollee_user_id' => $enrollee->id,
        'enrollment_status' => 'APPROVED',
    ]);

    $this->actingAs($enrollee, 'enrollee')
        ->post(route('portal.documents.upload', [$enrollment, 'form_138']), [
            'file' => UploadedFile::fake()->create('form138.pdf', 200, 'application/pdf'),
        ])
        ->assertSessionHasErrors('document');

    expect(OfficeVerification::where('enrollment_id', $enrollment->id)->exists())->toBeFalse();
});

test('a different account cannot upload a document for someone elses enrollment', function () {
    $owner = EnrolleeUser::factory()->create();
    $intruder = EnrolleeUser::factory()->create();
    $enrollment = Enrollment::factory()->create([
        'enrollee_user_id' => $owner->id,
        'enrollment_status' => 'PENDING',
    ]);

    $this->actingAs($intruder, 'enrollee')
        ->post(route('portal.documents.upload', [$enrollment, 'form_138']), [
            'file' => UploadedFile::fake()->create('form138.pdf', 200, 'application/pdf'),
        ])
        ->assertForbidden();
});
