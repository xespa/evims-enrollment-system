<?php

use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\Installment;
use App\Models\Payment;
use App\Models\User;
use App\Services\PayMongoService;
use Illuminate\Support\Facades\URL;
use Illuminate\Testing\TestResponse;
use Mockery\MockInterface;

/**
 * ₱1,000 registration + 10 × ₱900 tuition = ₱10,000, i.e. ten ₱1,000
 * installments on the monthly plan.
 */
function repricingGradeLevel(): GradeLevel
{
    return GradeLevel::factory()->create([
        'registration_fee' => 1000,
        'miscellaneous_fee' => 0,
        'books_fee' => 0,
        'monthly_tuition' => 900,
        'monthly_laboratory_fee' => 0,
    ]);
}

function enrollmentWithBill(GradeLevel $gradeLevel, array $attributes = []): Enrollment
{
    $enrollment = Enrollment::factory()->create([
        'grade_level_id' => $gradeLevel->id,
        'school_year' => Enrollment::currentSchoolYear(),
        'enrollment_status' => 'APPROVED',
        ...$attributes,
    ]);

    $enrollment->billingContract()->create([
        'payment_option' => 'MONTHLY',
        'payment_channel' => 'GCASH',
        'total_fee' => $gradeLevel->tuition_fee,
    ])->generateInstallments();

    return $enrollment;
}

function payTowardInstallment(Installment $installment, float $amount): void
{
    Payment::create([
        'installment_id' => $installment->id,
        'enrollment_id' => $installment->billingContract->enrollment_id,
        'amount' => $amount,
        'method' => 'CASH',
        'status' => 'COMPLETED',
        'paid_at' => now(),
    ]);

    $installment->refreshStatus();
}

/**
 * Raises monthly tuition to ₱1,400: ₱1,000 + 10 × ₱1,400 = ₱15,000,
 * i.e. ₱1,500 per monthly installment.
 */
function raiseTuitionTo1400(GradeLevel $gradeLevel): TestResponse
{
    return test()->actingAs(User::factory()->create(['role' => 'ADMIN']))
        ->patch(route('admin.gradeLevels.update', $gradeLevel), [
            'registration_fee' => 1000,
            'miscellaneous_fee' => 0,
            'monthly_tuition' => 1400,
            'monthly_laboratory_fee' => 0,
            'books_fee' => 0,
        ]);
}

function installmentAmounts(Enrollment $enrollment): array
{
    return $enrollment->billingContract->installments()
        ->orderBy('installment_number')
        ->pluck('amount_due')
        ->map(fn ($amount) => (float) $amount)
        ->all();
}

test('changing fees re-prices unpaid installments of current applications', function () {
    $gradeLevel = repricingGradeLevel();
    $enrollment = enrollmentWithBill($gradeLevel);

    expect(installmentAmounts($enrollment))->toBe(array_fill(0, 10, 1000.0));

    raiseTuitionTo1400($gradeLevel)
        ->assertRedirect()
        ->assertSessionHas('success', "{$gradeLevel->name}'s fees updated. 1 unpaid bill now uses the new fees.");

    $enrollment->refresh();

    expect(installmentAmounts($enrollment))->toBe(array_fill(0, 10, 1500.0))
        ->and((float) $enrollment->billingContract->total_fee)->toBe(15000.0);
});

test('the next GCash checkout charges PayMongo the new price', function () {
    config(['services.paymongo.sandbox_mode' => false]);

    $gradeLevel = repricingGradeLevel();
    $enrollment = enrollmentWithBill($gradeLevel);
    raiseTuitionTo1400($gradeLevel);

    $this->mock(PayMongoService::class, function (MockInterface $mock) {
        $mock->shouldReceive('createGcashSource')
            ->once()
            ->withArgs(fn (float $amountInPesos) => $amountInPesos === 1500.0)
            ->andReturn([
                'id' => 'src_test_reprice',
                'attributes' => ['redirect' => ['checkout_url' => 'https://paymongo.test/checkout']],
            ]);
    });

    $firstInstallment = $enrollment->billingContract->installments()->where('installment_number', 1)->first();

    $this->post(URL::signedRoute('payments.gcash.initiate', [
        'enrollment' => $enrollment->id,
        'installment' => $firstInstallment->id,
    ]))->assertRedirect('https://paymongo.test/checkout');

    expect((float) Payment::where('paymongo_source_id', 'src_test_reprice')->value('amount'))->toBe(1500.0);
});

test('fully paid installments and payments already made are kept', function () {
    $gradeLevel = repricingGradeLevel();
    $enrollment = enrollmentWithBill($gradeLevel);
    $installments = $enrollment->billingContract->installments()->orderBy('installment_number')->get();

    payTowardInstallment($installments[0], 1000);
    payTowardInstallment($installments[1], 400);

    raiseTuitionTo1400($gradeLevel);

    $installments = $enrollment->billingContract->installments()->orderBy('installment_number')->get();

    expect((float) $installments[0]->amount_due)->toBe(1000.0)
        ->and($installments[0]->status)->toBe('PAID')
        ->and((float) $installments[1]->amount_due)->toBe(1500.0)
        ->and($installments[1]->status)->toBe('PARTIALLY_PAID')
        ->and($installments[1]->totalPaid())->toBe(400.0)
        ->and((float) $enrollment->billingContract->fresh()->total_fee)->toBe(1000.0 + 9 * 1500.0)
        ->and(Payment::count())->toBe(2);
});

test('lowering fees never bills an installment below what was already paid', function () {
    $gradeLevel = repricingGradeLevel();
    $enrollment = enrollmentWithBill($gradeLevel);
    $firstInstallment = $enrollment->billingContract->installments()->where('installment_number', 1)->first();

    payTowardInstallment($firstInstallment, 900);

    // ₱1,000 + 10 × ₱400 = ₱5,000, i.e. ₱500 per installment.
    $this->actingAs(User::factory()->create(['role' => 'ADMIN']))
        ->patch(route('admin.gradeLevels.update', $gradeLevel), [
            'registration_fee' => 1000,
            'miscellaneous_fee' => 0,
            'monthly_tuition' => 400,
            'monthly_laboratory_fee' => 0,
            'books_fee' => 0,
        ]);

    $firstInstallment->refresh();

    expect((float) $firstInstallment->amount_due)->toBe(900.0)
        ->and($firstInstallment->status)->toBe('PAID')
        ->and(array_slice(installmentAmounts($enrollment), 1))->toBe(array_fill(0, 9, 500.0));
});

test('cancelled, rejected, and past school year applications keep their bill', function () {
    $gradeLevel = repricingGradeLevel();
    $startYear = (int) explode('-', Enrollment::currentSchoolYear())[0];

    $cancelled = enrollmentWithBill($gradeLevel, ['cancelled_at' => now()]);
    $rejected = enrollmentWithBill($gradeLevel, ['enrollment_status' => 'REJECTED']);
    $pastYear = enrollmentWithBill($gradeLevel, [
        'school_year' => ($startYear - 1).'-'.$startYear,
    ]);

    raiseTuitionTo1400($gradeLevel)
        ->assertSessionHas('success', "{$gradeLevel->name}'s fees updated.");

    foreach ([$cancelled, $rejected, $pastYear] as $enrollment) {
        expect(installmentAmounts($enrollment->fresh()))->toBe(array_fill(0, 10, 1000.0));
    }
});

test('applications in other grade levels are not affected', function () {
    $gradeLevel = repricingGradeLevel();
    $otherGradeEnrollment = enrollmentWithBill(repricingGradeLevel());

    raiseTuitionTo1400($gradeLevel);

    expect(installmentAmounts($otherGradeEnrollment->fresh()))->toBe(array_fill(0, 10, 1000.0));
});

test('an installment re-priced to nothing owed counts as paid', function () {
    $gradeLevel = repricingGradeLevel();
    $enrollment = enrollmentWithBill($gradeLevel);
    $installment = $enrollment->billingContract->installments()->first();

    $installment->amount_due = 0;
    $installment->refreshStatus();

    expect($installment->fresh()->status)->toBe('PAID');
});
