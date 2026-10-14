<?php

use App\Models\BillingContract;
use App\Models\EnrolleeUser;
use App\Models\Enrollment;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('a counter payment recorded by staff shows on the parent\'s dashboard against its installment', function () {
    $enrollee = EnrolleeUser::factory()->create();
    $enrollment = Enrollment::factory()->create([
        'enrollment_status' => 'APPROVED',
        'enrollee_user_id' => $enrollee->id,
    ]);
    $enrollment->billingContract()->create([
        'payment_option' => 'BI_MONTHLY',
        // A parent who chose GCash can still pay the cashier.
        'payment_channel' => BillingContract::CHANNEL_GCASH,
        'total_fee' => 10000,
    ])->generateInstallments();

    $this->actingAs(User::factory()->create(['role' => 'CASHIER']))
        ->post(route('admin.enrollments.cash-payments.store', $enrollment), [
            'amount' => 3000,
            'receipt_number' => 'OR-500',
        ])
        ->assertSessionHasNoErrors();

    $this->actingAs($enrollee, 'enrollee')
        ->get(route('portal.dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('enrollments.0.remaining_balance', 7000)
            ->where('enrollments.0.billing_contract.installments.0.status', 'PAID')
            ->where('enrollments.0.billing_contract.installments.0.amount_due', '2000.00')
            ->where('enrollments.0.billing_contract.installments.0.payments.0.method', 'CASH')
            ->where('enrollments.0.billing_contract.installments.0.payments.0.receipt_number', 'OR-500')
            ->where('enrollments.0.billing_contract.installments.1.status', 'PARTIALLY_PAID')
            ->where('enrollments.0.billing_contract.installments.2.status', 'UNPAID'));
});

test('staff without the payments ability cannot record a counter payment', function () {
    $enrollment = Enrollment::factory()->create(['enrollment_status' => 'APPROVED']);
    $enrollment->billingContract()->create([
        'payment_option' => 'BI_MONTHLY',
        'total_fee' => 10000,
    ])->generateInstallments();

    $this->actingAs(User::factory()->create(['role' => 'TEACHER']))
        ->post(route('admin.enrollments.cash-payments.store', $enrollment), [
            'amount' => 3000,
            'receipt_number' => 'OR-501',
        ])
        ->assertForbidden();
});
