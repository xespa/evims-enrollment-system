<?php

use App\Models\Enrollment;
use Illuminate\Support\Facades\URL;

test('payment page is accessible with a valid signed url', function () {
    $enrollment = Enrollment::factory()->create(['enrollment_status' => 'APPROVED']);

    $response = $this->get(URL::signedRoute('payments.show', $enrollment->id));

    $response->assertOk();
});

test('payment page blocks access when enrollment is not yet approved', function () {
    $enrollment = Enrollment::factory()->create(['enrollment_status' => 'PENDING']);

    $response = $this->get(URL::signedRoute('payments.show', $enrollment->id));

    $response->assertForbidden();
});
