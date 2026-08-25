<?php

use App\Models\Enrollment;
use Illuminate\Support\Facades\URL;

test('payment page requires a valid signature', function () {
    $enrollment = Enrollment::factory()->create();

    $response = $this->get(route('payments.show', $enrollment->id, absolute: false));

    $response->assertForbidden();
});

test('payment page is accessible with a valid signed url', function () {
    $enrollment = Enrollment::factory()->create();

    $response = $this->get(URL::signedRoute('payments.show', $enrollment->id));

    $response->assertOk();
});

test('gcash initiate rejects a tampered signed url', function () {
    $enrollment = Enrollment::factory()->create();
    $badUrl = URL::signedRoute('payments.gcash.initiate', [
        'enrollment' => $enrollment->id,
        'installment' => 999, // signed for a different installment id than we'll actually hit
    ]);

    // Swap the installment segment in the path without re-signing — this must fail.
    $tampered = preg_replace('/installments\/\d+/', 'installments/1', $badUrl);

    $response = $this->post($tampered);

    $response->assertForbidden();
});
