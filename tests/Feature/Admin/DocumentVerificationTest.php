<?php

use App\Models\Enrollment;
use App\Models\OfficeVerification;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('registrar can verify a document even when no verification row exists yet', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $enrollment = Enrollment::factory()->create();

    // Simulate legacy data: no OfficeVerification row for this enrollment at all.
    expect(OfficeVerification::where('enrollment_id', $enrollment->id)->exists())->toBeFalse();

    $this->actingAs($admin)
        ->patch(route('admin.enrollments.updateVerification', $enrollment), [
            'has_form_138' => true,
            'has_birth_certificate' => false,
            'has_good_moral_certificate' => false,
        ])
        ->assertSessionHasNoErrors();

    $verification = OfficeVerification::where('enrollment_id', $enrollment->id)->first();
    expect($verification)->not->toBeNull();
    expect($verification->has_form_138)->toBeTrue();
    expect($verification->verified_by)->toBe($admin->id);
});

test('registrar sees uploaded document paths on the enrollment detail page', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $enrollment = Enrollment::factory()->create();

    OfficeVerification::create([
        'enrollment_id' => $enrollment->id,
        'form_138_path' => 'documents/form138-test.pdf',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.enrollments.show', $enrollment))
        ->assertInertia(fn (Assert $page) => $page
            ->where('enrollment.office_verification.form_138_path', 'documents/form138-test.pdf')
            ->where('enrollment.office_verification.has_form_138', false)
        );
});
