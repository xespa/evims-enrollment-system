<?php

use App\Models\BillingContract;
use App\Models\Enrollment;
use App\Models\OfficeVerification;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('admins can archive an application without deleting any of its records', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $enrollment = Enrollment::factory()->create();
    $verification = OfficeVerification::create(['enrollment_id' => $enrollment->id]);
    $billingContract = BillingContract::create([
        'enrollment_id' => $enrollment->id,
        'payment_option' => 'MONTHLY',
        'payment_channel' => 'COUNTER',
        'total_fee' => 30000,
    ]);

    $this->actingAs($admin)
        ->post(route('admin.enrollments.archive.store', $enrollment))
        ->assertRedirect(route('admin.students.index'))
        ->assertSessionHas('success');

    $enrollment->refresh();
    expect($enrollment->isArchived())->toBeTrue();
    expect($enrollment->archived_by)->toBe($admin->id);
    expect(OfficeVerification::find($verification->id))->not->toBeNull();
    expect(BillingContract::find($billingContract->id))->not->toBeNull();
});

test('admins can restore an archived application', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $enrollment = Enrollment::factory()->create(['archived_at' => now()]);

    $this->actingAs($admin)
        ->delete(route('admin.enrollments.archive.destroy', $enrollment))
        ->assertRedirect()
        ->assertSessionHas('success');

    $enrollment->refresh();
    expect($enrollment->isArchived())->toBeFalse();
    expect($enrollment->archived_by)->toBeNull();
});

test('archived applications are hidden from the students list unless the archived view is chosen', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $active = Enrollment::factory()->create(['school_year' => '2026-2027']);
    $archived = Enrollment::factory()->create(['school_year' => '2026-2027', 'archived_at' => now()]);

    $this->actingAs($admin)
        ->get(route('admin.students.index', ['school_year' => '2026-2027']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('filters.archived', false)
            ->has('applications.data', 1)
            ->where('applications.data.0.id', $active->id));

    $this->actingAs($admin)
        ->get(route('admin.students.index', ['school_year' => '2026-2027', 'archived' => 1]))
        ->assertInertia(fn (Assert $page) => $page
            ->where('filters.archived', true)
            ->has('applications.data', 1)
            ->where('applications.data.0.id', $archived->id));
});

test('an archived application can still be opened', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $enrollment = Enrollment::factory()->create(['archived_at' => now()]);

    $this->actingAs($admin)
        ->get(route('admin.enrollments.show', $enrollment))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->whereNot('enrollment.archived_at', null));
});

test('non-admin users cannot archive or restore applications', function () {
    $staff = User::factory()->create(['role' => 'CASHIER']);
    $enrollment = Enrollment::factory()->create();

    $this->actingAs($staff)
        ->post(route('admin.enrollments.archive.store', $enrollment))
        ->assertForbidden();

    $this->actingAs($staff)
        ->delete(route('admin.enrollments.archive.destroy', $enrollment))
        ->assertForbidden();

    expect($enrollment->fresh()->isArchived())->toBeFalse();
});

test('guests cannot archive applications', function () {
    $enrollment = Enrollment::factory()->create();

    $this->post(route('admin.enrollments.archive.store', $enrollment))
        ->assertRedirect(route('login'));

    expect($enrollment->fresh()->isArchived())->toBeFalse();
});
