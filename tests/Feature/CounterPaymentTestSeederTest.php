<?php

use App\Models\Curriculum;
use App\Models\Enrollment;
use App\Models\Payment;
use Database\Seeders\CounterPaymentTestSeeder;

test('it seeds ten approved counter-paying enrollees with a mix of receipts', function () {
    Curriculum::factory()->count(3)->create(['school_year' => '2026-2027']);

    $this->seed(CounterPaymentTestSeeder::class);

    $enrollments = Enrollment::with('billingContract.installments', 'enrolleeUser')->get();

    expect($enrollments)->toHaveCount(10)
        ->and($enrollments->pluck('enrollment_status')->unique()->all())->toBe(['APPROVED'])
        ->and($enrollments->every(fn (Enrollment $enrollment) => $enrollment->billingContract?->payment_channel === 'COUNTER'
            && $enrollment->billingContract->installments->isNotEmpty()
            && $enrollment->enrolleeUser !== null))->toBeTrue()
        ->and(Payment::where('payment_form', 'CHECK')->exists())->toBeTrue()
        ->and(Payment::where('status', 'VOIDED')->exists())->toBeTrue()
        ->and(Payment::distinct()->count('receipt_number'))->toBe(7);
});

test('it seeds nothing without curricula to bill from', function () {
    $this->seed(CounterPaymentTestSeeder::class);

    expect(Enrollment::count())->toBe(0);
});
