<?php

use App\Models\EnrolleeUser;
use App\Models\Enrollment;
use App\Models\User;
use App\Notifications\DocumentReminder;

test('guests cannot send a document reminder', function () {
    $enrollment = Enrollment::factory()->create();

    $this->post(route('admin.enrollments.documents.remind', [$enrollment, 'form_138']), [
        'reason' => 'NOT_SUBMITTED',
    ])->assertRedirect(route('login'));
});

test('non-admins cannot send a document reminder', function () {
    $staff = User::factory()->create(['role' => 'STAFF']);
    $enrollment = Enrollment::factory()->create();

    $this->actingAs($staff)
        ->post(route('admin.enrollments.documents.remind', [$enrollment, 'form_138']), [
            'reason' => 'NOT_SUBMITTED',
        ])
        ->assertForbidden();
});

test('admin can remind an applicant that a document was not submitted', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $enrollee = EnrolleeUser::factory()->create();
    $enrollment = Enrollment::factory()->create(['enrollee_user_id' => $enrollee->id]);

    $this->actingAs($admin)
        ->post(route('admin.enrollments.documents.remind', [$enrollment, 'form_138']), [
            'reason' => 'NOT_SUBMITTED',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    $enrollee->refresh();
    expect($enrollee->unreadNotifications()->count())->toBe(1);

    $notification = $enrollee->notifications()->first();
    expect($notification->type)->toBe(DocumentReminder::class);
    expect($notification->data['document'])->toBe('Form 138 (Report Card)');
    expect($notification->data['reason'])->toBe('This document has not been submitted yet.');
    expect($notification->data['note'])->toBeNull();
});

test('admin can flag a submitted document as blurry with an optional note', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $enrollee = EnrolleeUser::factory()->create();
    $enrollment = Enrollment::factory()->create(['enrollee_user_id' => $enrollee->id]);

    $this->actingAs($admin)
        ->post(route('admin.enrollments.documents.remind', [$enrollment, 'birth_certificate']), [
            'reason' => 'BLURRY',
            'note' => 'Please retake in better lighting.',
        ])
        ->assertSessionHasNoErrors();

    $notification = $enrollee->notifications()->first();
    expect($notification->data['document'])->toBe('PSA Birth Certificate');
    expect($notification->data['reason'])->toBe('The uploaded image is blurry or hard to read.');
    expect($notification->data['note'])->toBe('Please retake in better lighting.');
});

test('a custom note is required when the reason is other', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $enrollee = EnrolleeUser::factory()->create();
    $enrollment = Enrollment::factory()->create(['enrollee_user_id' => $enrollee->id]);

    $this->actingAs($admin)
        ->post(route('admin.enrollments.documents.remind', [$enrollment, 'good_moral']), [
            'reason' => 'OTHER',
        ])
        ->assertSessionHasErrors('note');

    expect($enrollee->notifications()->count())->toBe(0);

    $this->actingAs($admin)
        ->post(route('admin.enrollments.documents.remind', [$enrollment, 'good_moral']), [
            'reason' => 'OTHER',
            'note' => 'Signed by the wrong principal.',
        ])
        ->assertSessionHasNoErrors();

    $notification = $enrollee->notifications()->first();
    expect($notification->data['reason'])->toBe('Signed by the wrong principal.');
});

test('reminder cannot be sent when the application has no linked portal account', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $enrollment = Enrollment::factory()->create(['enrollee_user_id' => null]);

    $this->actingAs($admin)
        ->post(route('admin.enrollments.documents.remind', [$enrollment, 'form_138']), [
            'reason' => 'NOT_SUBMITTED',
        ])
        ->assertSessionHasErrors('reminder');
});

test('an unknown document type is rejected', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $enrollment = Enrollment::factory()->create();

    $this->actingAs($admin)
        ->post(route('admin.enrollments.documents.remind', [$enrollment, 'not_a_real_document']), [
            'reason' => 'NOT_SUBMITTED',
        ])
        ->assertNotFound();
});
