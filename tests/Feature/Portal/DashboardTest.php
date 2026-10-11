<?php

use App\Models\EnrolleeUser;
use App\Models\Enrollment;
use Inertia\Testing\AssertableInertia as Assert;

test('the dashboard gives each application the fields the profile page renders', function () {
    $enrollee = EnrolleeUser::factory()->create();
    $enrollment = Enrollment::factory()->create([
        'enrollee_user_id' => $enrollee->id,
        'enrollment_status' => 'PENDING',
    ]);

    $this->actingAs($enrollee, 'enrollee')
        ->get(route('portal.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Portal/Dashboard')
            ->has('enrollments', 1)
            ->has('enrollments.0', fn (Assert $application) => $application
                ->where('id', $enrollment->id)
                ->where('enrollment_status', 'PENDING')
                ->where('cancelled_at', null)
                ->where('payment_url', null)
                ->where('total_billed', null)
                ->where('remaining_balance', null)
                ->where('is_returning', false)
                ->has('rejection_details')
                ->has('school_year')
                ->has('session_time_preference')
                ->has('student.first_name')
                ->has('student.last_name')
                ->has('grade_level.name')
                ->has('office_verification')
                ->has('document_appointment')
                ->has('billing_contract')
                ->etc()));
});

test('the dashboard only lists the signed-in parents own applications', function () {
    $enrollee = EnrolleeUser::factory()->create();
    $ownEnrollment = Enrollment::factory()->create(['enrollee_user_id' => $enrollee->id]);
    Enrollment::factory()->create(['enrollee_user_id' => EnrolleeUser::factory()->create()->id]);

    $this->actingAs($enrollee, 'enrollee')
        ->get(route('portal.dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('enrollments', 1)
            ->where('enrollments.0.id', $ownEnrollment->id));
});

test('guests are sent to the portal login', function () {
    $this->get(route('portal.dashboard'))
        ->assertRedirect(route('portal.login'));
});

test('accounts still awaiting approval cannot open the dashboard', function () {
    $this->actingAs(EnrolleeUser::factory()->pending()->create(), 'enrollee')
        ->get(route('portal.dashboard'))
        ->assertRedirect();
});
