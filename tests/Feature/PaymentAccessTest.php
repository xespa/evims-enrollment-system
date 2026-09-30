<?php

use App\Models\BillingContract;
use App\Models\Enrollment;
use Illuminate\Support\Facades\URL;

function enrollmentPayingBy(string $channel, string $status = 'APPROVED'): Enrollment
{
    $enrollment = Enrollment::factory()->create(['enrollment_status' => $status]);

    $enrollment->billingContract()->create([
        'payment_option' => 'MONTHLY',
        'payment_channel' => $channel,
        'total_fee' => 10000,
    ])->generateInstallments();

    return $enrollment;
}

test('payment page is accessible with a valid signed url', function () {
    $enrollment = enrollmentPayingBy(BillingContract::CHANNEL_GCASH);

    $response = $this->get(URL::signedRoute('payments.show', $enrollment->id));

    $response->assertOk();
});

test('payment page blocks access when enrollment is not yet approved', function () {
    $enrollment = enrollmentPayingBy(BillingContract::CHANNEL_GCASH, 'PENDING');

    $response = $this->get(URL::signedRoute('payments.show', $enrollment->id));

    $response->assertForbidden();
});

test('counter payers cannot open the online payment page, even with a signed link', function () {
    $enrollment = enrollmentPayingBy(BillingContract::CHANNEL_COUNTER);

    $this->get(URL::signedRoute('payments.show', $enrollment->id))
        ->assertForbidden();
});

test('counter payers cannot start a GCash checkout', function () {
    $enrollment = enrollmentPayingBy(BillingContract::CHANNEL_COUNTER);
    $installment = $enrollment->billingContract->installments()->first();

    $this->post(URL::signedRoute('payments.gcash.initiate', [
        'enrollment' => $enrollment->id,
        'installment' => $installment->id,
    ]))->assertForbidden();

    expect($installment->payments()->count())->toBe(0);
});
