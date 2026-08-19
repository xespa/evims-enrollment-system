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
