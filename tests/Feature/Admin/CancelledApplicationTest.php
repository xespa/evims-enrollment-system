<?php

use App\Mail\EnrollmentStatusUpdated;
use App\Models\EnrolleeUser;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;

test('a cancelled application cannot be approved or rejected', function (string $status, array $extra) {
    Mail::fake();

    $admin = User::factory()->create(['role' => 'ADMIN']);
    $enrollee = EnrolleeUser::factory()->create();
    $enrollment = Enrollment::factory()->withDocuments()->create([
        'enrollee_user_id' => $enrollee->id,
        'enrollment_status' => 'PENDING',
        'email' => 'parent@example.com',
        'cancelled_at' => now(),
    ]);

    $this->actingAs($admin)
        ->patch(route('admin.enrollments.status.update', $enrollment), ['enrollment_status' => $status, ...$extra])
        ->assertSessionHasErrors('enrollment_status');

    expect(session('errors')->first('enrollment_status'))->toContain('cancelled by the parent');
    expect($enrollment->fresh()->enrollment_status)->toBe('PENDING');
    expect($enrollee->notifications()->count())->toBe(0);
    Mail::assertNotSent(EnrollmentStatusUpdated::class);
})->with([
    'approve' => ['APPROVED', []],
    'reject' => ['REJECTED', ['rejection_reasons' => ['OTHER'], 'rejection_note' => 'Withdrawn by parent.']],
]);

test('the admin application page and students list show that an application was cancelled', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $enrollment = Enrollment::factory()->create([
        'school_year' => '2026-2027',
        'cancelled_at' => now(),
    ]);

    $this->actingAs($admin)
        ->get(route('admin.enrollments.show', $enrollment))
        ->assertInertia(fn (Assert $page) => $page->whereNot('enrollment.cancelled_at', null));

    $this->actingAs($admin)
        ->get(route('admin.students.index', ['school_year' => '2026-2027']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('applications.data.0.id', $enrollment->id)
            ->whereNot('applications.data.0.cancelled_at', null));
});
