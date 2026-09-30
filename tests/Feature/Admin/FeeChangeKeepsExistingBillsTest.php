<?php

use App\Models\Curriculum;
use App\Models\EnrolleeUser;
use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\Installment;
use App\Models\Payment;
use App\Models\Subject;
use App\Models\User;
use App\Services\PayMongoService;
use Illuminate\Support\Facades\URL;
use Illuminate\Testing\TestResponse;
use Mockery\MockInterface;

/**
 * ₱1,000 registration + 10 × ₱900 tuition = ₱10,000, i.e. ten ₱1,000
 * installments on the monthly plan.
 */
function lockedFeesCurriculum(): Curriculum
{
    return Curriculum::factory()->create([
        'registration_fee' => 1000,
        'miscellaneous_fee' => 0,
        'books_fee' => 0,
        'monthly_tuition' => 900,
        'monthly_laboratory_fee' => 0,
    ]);
}

function enrollmentBilledFrom(Curriculum $curriculum, array $attributes = []): Enrollment
{
    $enrollment = Enrollment::factory()->create([
        'grade_level_id' => $curriculum->grade_level_id,
        'school_year' => $curriculum->school_year,
        'enrollment_status' => 'APPROVED',
        ...$attributes,
    ]);

    $enrollment->billingContract()->create([
        'payment_option' => 'MONTHLY',
        'payment_channel' => 'GCASH',
        'total_fee' => $curriculum->tuition_fee,
    ])->generateInstallments();

    return $enrollment;
}

/**
 * Raises monthly tuition to ₱1,400: ₱1,000 + 10 × ₱1,400 = ₱15,000.
 */
function raiseMonthlyTuitionTo1400(Curriculum $curriculum): TestResponse
{
    return test()->actingAs(User::factory()->create(['role' => 'ADMIN']))
        ->patch(route('admin.curricula.update', $curriculum), [
            'registration_fee' => 1000,
            'miscellaneous_fee' => 0,
            'monthly_tuition' => 1400,
            'monthly_laboratory_fee' => 0,
            'books_fee' => 0,
        ]);
}

function billedInstallmentAmounts(Enrollment $enrollment): array
{
    return $enrollment->billingContract->installments()
        ->orderBy('installment_number')
        ->pluck('amount_due')
        ->map(fn ($amount) => (float) $amount)
        ->all();
}

test('changing fees keeps the bills of applications already made', function () {
    $curriculum = lockedFeesCurriculum();
    $enrollment = enrollmentBilledFrom($curriculum);
    $gradeLevel = $curriculum->gradeLevel;

    raiseMonthlyTuitionTo1400($curriculum)
        ->assertRedirect()
        ->assertSessionHas(
            'success',
            "{$gradeLevel->name}'s {$curriculum->school_year} fees updated. The 1 application already made keeps its original price.",
        );

    $enrollment->refresh();

    expect((float) $curriculum->fresh()->tuition_fee)->toBe(15000.0)
        ->and(billedInstallmentAmounts($enrollment))->toBe(array_fill(0, 10, 1000.0))
        ->and((float) $enrollment->billingContract->total_fee)->toBe(10000.0);
});

test('partly paid bills are untouched by a fee change', function () {
    $curriculum = lockedFeesCurriculum();
    $enrollment = enrollmentBilledFrom($curriculum);
    $installment = $enrollment->billingContract->installments()->orderBy('installment_number')->first();

    Payment::create([
        'installment_id' => $installment->id,
        'enrollment_id' => $enrollment->id,
        'amount' => 400,
        'method' => 'CASH',
        'status' => 'COMPLETED',
        'paid_at' => now(),
    ]);
    $installment->refreshStatus();

    raiseMonthlyTuitionTo1400($curriculum);

    $installment->refresh();

    expect((float) $installment->amount_due)->toBe(1000.0)
        ->and($installment->status)->toBe('PARTIALLY_PAID')
        ->and($installment->totalPaid())->toBe(400.0);
});

test('the next GCash checkout still charges the original price', function () {
    config(['services.paymongo.sandbox_mode' => false]);

    $curriculum = lockedFeesCurriculum();
    $enrollment = enrollmentBilledFrom($curriculum);
    raiseMonthlyTuitionTo1400($curriculum);

    $this->mock(PayMongoService::class, function (MockInterface $mock) {
        $mock->shouldReceive('createGcashSource')
            ->once()
            ->withArgs(fn (float $amountInPesos) => $amountInPesos === 1000.0)
            ->andReturn([
                'id' => 'src_test_locked',
                'attributes' => ['redirect' => ['checkout_url' => 'https://paymongo.test/checkout']],
            ]);
    });

    $firstInstallment = $enrollment->billingContract->installments()->where('installment_number', 1)->first();

    $this->post(URL::signedRoute('payments.gcash.initiate', [
        'enrollment' => $enrollment->id,
        'installment' => $firstInstallment->id,
    ]))->assertRedirect('https://paymongo.test/checkout');
});

test('applications made after a fee change use the new fees', function () {
    $curriculum = lockedFeesCurriculum();
    $subject = Subject::factory()->for($curriculum)->create();
    raiseMonthlyTuitionTo1400($curriculum);

    $this->actingAs(EnrolleeUser::factory()->create(), 'enrollee')
        ->post(route('admission.store'), validEnrollmentPayload($curriculum->gradeLevel, [
            'subject_ids' => [$subject->id],
        ]))
        ->assertRedirect();

    expect((float) Enrollment::sole()->billingContract->total_fee)->toBe(15000.0);
});

test('a fee change with no applications yet says nothing about existing bills', function () {
    $curriculum = lockedFeesCurriculum();

    raiseMonthlyTuitionTo1400($curriculum)
        ->assertSessionHas('success', "{$curriculum->gradeLevel->name}'s {$curriculum->school_year} fees updated.");
});

test('an installment re-priced to nothing owed counts as paid', function () {
    $enrollment = enrollmentBilledFrom(lockedFeesCurriculum());
    $installment = $enrollment->billingContract->installments()->first();

    $installment->amount_due = 0;
    $installment->refreshStatus();

    expect($installment->fresh()->status)->toBe('PAID');
});

test('fees can differ between grade levels in the same school year', function () {
    $gradeOne = lockedFeesCurriculum();
    $gradeTwo = Curriculum::factory()->for(GradeLevel::factory())->totalFee(20000)->create();

    raiseMonthlyTuitionTo1400($gradeOne);

    expect((float) $gradeTwo->fresh()->tuition_fee)->toBe(20000.0);
});
