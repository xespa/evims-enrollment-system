<?php

use App\Models\BillingContract;
use App\Models\EnrolleeUser;
use App\Models\Enrollment;
use App\Models\Payment;

function billedEnrollmentFor(EnrolleeUser $enrollee, string $status = 'APPROVED'): Enrollment
{
    $enrollment = Enrollment::factory()->create([
        'enrollment_status' => $status,
        'enrollee_user_id' => $enrollee->id,
    ]);

    $enrollment->billingContract()->create([
        'payment_option' => 'BI_MONTHLY',
        'payment_channel' => BillingContract::CHANNEL_COUNTER,
        'total_fee' => 10000,
    ])->generateInstallments();

    return $enrollment;
}

test('choosing GCash from Pay Tuition goes on to the online payment page', function () {
    $enrollee = EnrolleeUser::factory()->create();
    $enrollment = billedEnrollmentFor($enrollee);

    $response = $this->actingAs($enrollee, 'enrollee')
        ->put(route('portal.enrollments.payment-method.update', $enrollment), ['payment_channel' => 'GCASH'])
        ->assertSessionHasNoErrors();

    expect($response->headers->get('Location'))->toContain("/payments/{$enrollment->id}");
    expect($enrollment->billingContract->fresh()->paysOnline())->toBeTrue();
});

test('cash is not a Pay Tuition option; the cashier records cash payments', function () {
    $enrollee = EnrolleeUser::factory()->create();
    $enrollment = billedEnrollmentFor($enrollee);
    $enrollment->billingContract->update(['payment_channel' => BillingContract::CHANNEL_GCASH]);

    $this->actingAs($enrollee, 'enrollee')
        ->put(route('portal.enrollments.payment-method.update', $enrollment), ['payment_channel' => 'COUNTER'])
        ->assertSessionHasErrors('payment_channel');

    expect($enrollment->billingContract->fresh()->payment_channel)->toBe(BillingContract::CHANNEL_GCASH);
});

test('choosing GCash gives the dashboard an online payment link', function () {
    $enrollee = EnrolleeUser::factory()->create();
    $enrollment = billedEnrollmentFor($enrollee);

    $this->actingAs($enrollee, 'enrollee')
        ->put(route('portal.enrollments.payment-method.update', $enrollment), ['payment_channel' => 'GCASH']);

    $this->get(route('portal.dashboard'))
        ->assertInertia(fn ($page) => $page
            ->where('enrollments.0.billing_contract.payment_channel', 'GCASH')
            ->where('enrollments.0.payment_url', fn (?string $url) => str_contains((string) $url, '/payments/')));
});

test('Pay Tuition lists the online methods only, with the unfinished ones marked unavailable', function () {
    $enrollee = EnrolleeUser::factory()->create();
    billedEnrollmentFor($enrollee);

    $this->actingAs($enrollee, 'enrollee')
        ->get(route('portal.dashboard'))
        ->assertInertia(fn ($page) => $page
            ->has('paymentMethods', 4)
            ->where('paymentMethods.0', ['value' => 'GCASH', 'label' => 'GCash', 'description' => 'Pay online with your GCash account', 'logo' => '/images/payment-methods/gcash.svg', 'available' => true])
            ->where('paymentMethods.1.value', 'MAYA')
            ->where('paymentMethods.1.available', false)
            ->where('paymentMethods.2.value', 'SEABANK')
            ->where('paymentMethods.2.available', false)
            ->where('paymentMethods.3.value', 'PAYPAL')
            ->where('paymentMethods.3.available', false)
            ->where('paymentMethods.1.logo', '/images/payment-methods/maya.svg')
            ->where('paymentMethods.2.logo', '/images/payment-methods/seabank.svg')
            ->where('paymentMethods.3.logo', '/images/payment-methods/paypal.svg'));

    foreach (['gcash', 'maya', 'seabank', 'paypal'] as $logo) {
        expect(public_path("images/payment-methods/{$logo}.svg"))->toBeFile();
    }
});

test('a coming-soon payment method cannot be chosen yet', function (string $method) {
    $enrollee = EnrolleeUser::factory()->create();
    $enrollment = billedEnrollmentFor($enrollee);

    $this->actingAs($enrollee, 'enrollee')
        ->put(route('portal.enrollments.payment-method.update', $enrollment), ['payment_channel' => $method])
        ->assertSessionHasErrors('payment_channel');

    expect($enrollment->billingContract->fresh()->payment_channel)->toBe(BillingContract::CHANNEL_COUNTER);
})->with(['MAYA', 'SEABANK', 'PAYPAL']);

test('the payment method must be a known one', function () {
    $enrollee = EnrolleeUser::factory()->create();
    $enrollment = billedEnrollmentFor($enrollee);

    $this->actingAs($enrollee, 'enrollee')
        ->put(route('portal.enrollments.payment-method.update', $enrollment), ['payment_channel' => 'BANK'])
        ->assertSessionHasErrors('payment_channel');

    expect($enrollment->billingContract->fresh()->payment_channel)->toBe(BillingContract::CHANNEL_COUNTER);
});

test('a fully paid application cannot change its payment method', function () {
    $enrollee = EnrolleeUser::factory()->create();
    $enrollment = billedEnrollmentFor($enrollee);

    foreach ($enrollment->billingContract->installments as $installment) {
        Payment::create([
            'installment_id' => $installment->id,
            'enrollment_id' => $enrollment->id,
            'amount' => $installment->amount_due,
            'method' => 'CASH',
            'receipt_number' => 'OR-1',
            'status' => 'COMPLETED',
            'paid_at' => now(),
        ]);
    }

    $this->actingAs($enrollee, 'enrollee')
        ->put(route('portal.enrollments.payment-method.update', $enrollment), ['payment_channel' => 'GCASH'])
        ->assertSessionHasErrors('payment_channel');

    expect($enrollment->billingContract->fresh()->payment_channel)->toBe(BillingContract::CHANNEL_COUNTER);
});

test('a parent cannot choose the payment method for an application that is not approved', function () {
    $enrollee = EnrolleeUser::factory()->create();
    $enrollment = billedEnrollmentFor($enrollee, 'PENDING');

    $this->actingAs($enrollee, 'enrollee')
        ->put(route('portal.enrollments.payment-method.update', $enrollment), ['payment_channel' => 'GCASH'])
        ->assertForbidden();
});

test('a parent cannot change the payment method of someone else\'s application', function () {
    $enrollment = billedEnrollmentFor(EnrolleeUser::factory()->create());

    $this->actingAs(EnrolleeUser::factory()->create(), 'enrollee')
        ->put(route('portal.enrollments.payment-method.update', $enrollment), ['payment_channel' => 'GCASH'])
        ->assertForbidden();

    expect($enrollment->billingContract->fresh()->payment_channel)->toBe(BillingContract::CHANNEL_COUNTER);
});

test('guests are sent to the portal login', function () {
    $enrollment = billedEnrollmentFor(EnrolleeUser::factory()->create());

    $this->put(route('portal.enrollments.payment-method.update', $enrollment), ['payment_channel' => 'GCASH'])
        ->assertRedirect(route('portal.login'));
});
