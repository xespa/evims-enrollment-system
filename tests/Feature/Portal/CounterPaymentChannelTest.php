<?php

use App\Mail\EnrollmentStatusUpdated;
use App\Models\BillingContract;
use App\Models\EnrolleeUser;
use App\Models\Enrollment;
use App\Models\GradeLevel;
use Inertia\Testing\AssertableInertia as Assert;

function approvedEnrollmentFor(EnrolleeUser $enrollee, string $channel): Enrollment
{
    $enrollment = Enrollment::factory()->create([
        'enrollment_status' => 'APPROVED',
        'enrollee_user_id' => $enrollee->id,
    ]);

    $enrollment->billingContract()->create([
        'payment_option' => 'MONTHLY',
        'payment_channel' => $channel,
        'total_fee' => 10000,
    ])->generateInstallments();

    return $enrollment;
}

test('counter payers get no online payment link on their dashboard', function () {
    $enrollee = EnrolleeUser::factory()->create();
    approvedEnrollmentFor($enrollee, BillingContract::CHANNEL_COUNTER);

    $this->actingAs($enrollee, 'enrollee')
        ->get(route('portal.dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('enrollments.0.payment_url', null)
            ->where('enrollments.0.billing_contract.payment_channel', 'COUNTER')
            ->where('enrollments.0.remaining_balance', 10000));
});

test('GCash payers still get their online payment link', function () {
    $enrollee = EnrolleeUser::factory()->create();
    approvedEnrollmentFor($enrollee, BillingContract::CHANNEL_GCASH);

    $this->actingAs($enrollee, 'enrollee')
        ->get(route('portal.dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('enrollments.0.payment_url', fn (?string $url) => str_contains((string) $url, '/payments/')));
});

test('the approval email tells counter payers to pay at the cashier', function () {
    $enrollment = approvedEnrollmentFor(EnrolleeUser::factory()->create(), BillingContract::CHANNEL_COUNTER);

    (new EnrollmentStatusUpdated($enrollment))
        ->assertSeeInHtml('school cashier')
        ->assertDontSeeInHtml('View Payment Details');
});

test('the approval email gives GCash payers the payment link', function () {
    $enrollment = approvedEnrollmentFor(EnrolleeUser::factory()->create(), BillingContract::CHANNEL_GCASH);

    (new EnrollmentStatusUpdated($enrollment))
        ->assertSeeInHtml('View Payment Details')
        ->assertDontSeeInHtml('school cashier');
});

test('an unknown payment channel is rejected when applying', function () {
    $this->actingAs(EnrolleeUser::factory()->create(), 'enrollee');
    $gradeLevel = GradeLevel::factory()->totalFee(30000)->create();

    $this->post(route('admission.store'), validEnrollmentPayload($gradeLevel, ['payment_channel' => 'BANK']))
        ->assertSessionHasErrors('payment_channel');
});
