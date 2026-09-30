<?php

use App\Models\EnrolleeUser;
use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\Installment;
use App\Models\Payment;
use App\Notifications\PaymentReceived;
use App\Services\PayMongoService;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Illuminate\Testing\TestResponse;
use Inertia\Testing\AssertableInertia as Assert;
use Mockery\MockInterface;

beforeEach(function () {
    config([
        'services.paymongo.sandbox_mode' => false,
        'services.paymongo.webhook_secret' => 'whsec_test',
    ]);

    Notification::fake();

    // ₱1,000 + 10 × ₱900 = ₱10,000, i.e. ten ₱1,000 monthly installments.
    $gradeLevel = GradeLevel::factory()->withCurriculum([
        'registration_fee' => 1000,
        'miscellaneous_fee' => 0,
        'books_fee' => 0,
        'monthly_tuition' => 900,
        'monthly_laboratory_fee' => 0,
    ])->create();

    $this->enrollment = Enrollment::factory()->create([
        'grade_level_id' => $gradeLevel->id,
        'enrollment_status' => 'APPROVED',
        'email' => 'parent@example.com',
    ]);

    $this->enrollment->billingContract()->create([
        'payment_option' => 'MONTHLY',
        'payment_channel' => 'GCASH',
        'total_fee' => $gradeLevel->curricula()->first()->tuition_fee,
    ])->generateInstallments();

    $this->installment = $this->enrollment->billingContract->installments()->where('installment_number', 1)->first();
});

function pendingGcashPayment(Installment $installment, string $sourceId = 'src_test_1', float $amount = 1000): Payment
{
    return Payment::create([
        'installment_id' => $installment->id,
        'enrollment_id' => $installment->billingContract->enrollment_id,
        'amount' => $amount,
        'method' => 'GCASH',
        'status' => 'PENDING',
        'paymongo_source_id' => $sourceId,
    ]);
}

function payMongoSource(string $id, string $status, float $amount = 1000): array
{
    return [
        'id' => $id,
        'attributes' => [
            'status' => $status,
            'amount' => (int) round($amount * 100),
            'redirect' => ['checkout_url' => "https://paymongo.test/checkout/{$id}"],
        ],
    ];
}

function sendChargeableWebhook(string $sourceId, float $amount = 1000): TestResponse
{
    $payload = ['data' => ['attributes' => [
        'type' => 'source.chargeable',
        'data' => ['id' => $sourceId, 'attributes' => ['amount' => (int) round($amount * 100)]],
    ]]];

    $timestamp = '1700000000';
    $signature = hash_hmac('sha256', $timestamp.'.'.json_encode($payload), 'whsec_test');

    return test()->withHeaders(['Paymongo-Signature' => "t={$timestamp},te={$signature}"])
        ->postJson(route('paymongo.webhook'), $payload);
}

function callbackUrl(string $name, Installment $installment): string
{
    return URL::signedRoute($name, [$installment->billingContract->enrollment_id, $installment->id]);
}

test('a webhook completes the payment and a duplicate webhook does not charge again', function () {
    $parent = EnrolleeUser::factory()->create();
    $this->enrollment->update(['enrollee_user_id' => $parent->id]);
    $payment = pendingGcashPayment($this->installment);

    $this->mock(PayMongoService::class, function (MockInterface $mock) {
        $mock->shouldReceive('createPaymentFromSource')
            ->once()
            ->with('src_test_1', 1000.0, Mockery::any())
            ->andReturn(['id' => 'pay_test_1']);
    });

    sendChargeableWebhook('src_test_1')->assertOk();
    sendChargeableWebhook('src_test_1')->assertOk();

    expect($payment->fresh())
        ->status->toBe('COMPLETED')
        ->paymongo_payment_intent_id->toBe('pay_test_1')
        ->and($this->installment->fresh()->status)->toBe('PAID');

    Notification::assertSentToTimes($parent, PaymentReceived::class, 1);
});

test('a webhook with a bad signature is rejected', function () {
    $payment = pendingGcashPayment($this->installment);

    $this->withHeaders(['Paymongo-Signature' => 't=1700000000,te=forged'])
        ->postJson(route('paymongo.webhook'), ['data' => []])
        ->assertStatus(400);

    expect($payment->fresh()->status)->toBe('PENDING');
});

test('returning from GCash collects the payment even if the webhook never arrived', function () {
    $payment = pendingGcashPayment($this->installment);

    $this->mock(PayMongoService::class, function (MockInterface $mock) {
        $mock->shouldReceive('retrieveSource')->once()->with('src_test_1')
            ->andReturn(payMongoSource('src_test_1', 'chargeable'));
        $mock->shouldReceive('createPaymentFromSource')->once()
            ->with('src_test_1', 1000.0, Mockery::any())
            ->andReturn(['id' => 'pay_test_1']);
    });

    $this->get(callbackUrl('payments.callback.success', $this->installment))
        ->assertRedirect()
        ->assertSessionHas('success', 'Payment received! Thank you.');

    expect($payment->fresh()->status)->toBe('COMPLETED')
        ->and($this->installment->fresh()->status)->toBe('PAID');
});

test('the processing page keeps waiting while GCash is still pending', function () {
    pendingGcashPayment($this->installment);

    $this->mock(PayMongoService::class, function (MockInterface $mock) {
        $mock->shouldReceive('retrieveSource')->andReturn(payMongoSource('src_test_1', 'pending'));
        $mock->shouldNotReceive('createPaymentFromSource');
    });

    $this->get(callbackUrl('payments.callback.success', $this->installment))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Payments/Processing')
            ->where('paymentsUrl', fn (string $url) => str_contains($url, 'signature=')));
});

test('an expired GCash source is marked failed with a message', function () {
    $payment = pendingGcashPayment($this->installment);

    $this->mock(PayMongoService::class, function (MockInterface $mock) {
        $mock->shouldReceive('retrieveSource')->andReturn(payMongoSource('src_test_1', 'expired'));
    });

    $this->get(callbackUrl('payments.callback.success', $this->installment))
        ->assertRedirect()
        ->assertSessionHas('error');

    expect($payment->fresh()->status)->toBe('FAILED');
});

test('a PayMongo outage while checking leaves the payment pending instead of erroring', function () {
    $payment = pendingGcashPayment($this->installment);

    $this->mock(PayMongoService::class, function (MockInterface $mock) {
        $mock->shouldReceive('retrieveSource')->andThrow(new RuntimeException('PayMongo is down'));
    });

    $this->get(callbackUrl('payments.callback.success', $this->installment))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Payments/Processing'));

    expect($payment->fresh()->status)->toBe('PENDING');
});

test('return urls require a valid signature', function () {
    $enrollmentId = $this->enrollment->id;

    $this->get(route('payments.callback.success', [$enrollmentId, $this->installment->id]))->assertForbidden();
    $this->get(route('payments.callback.failed', [$enrollmentId, $this->installment->id]))->assertForbidden();
});

test('clicking pay again reuses the open GCash checkout instead of creating another', function () {
    pendingGcashPayment($this->installment);

    $this->mock(PayMongoService::class, function (MockInterface $mock) {
        $mock->shouldReceive('retrieveSource')->andReturn(payMongoSource('src_test_1', 'pending'));
        $mock->shouldNotReceive('createGcashSource');
    });

    $this->post(URL::signedRoute('payments.gcash.initiate', [
        'enrollment' => $this->enrollment->id,
        'installment' => $this->installment->id,
    ]))->assertRedirect('https://paymongo.test/checkout/src_test_1');

    expect(Payment::count())->toBe(1);
});

test('an open checkout for an outdated amount is replaced by a new one', function () {
    $stale = pendingGcashPayment($this->installment, 'src_old', 800);

    $this->mock(PayMongoService::class, function (MockInterface $mock) {
        $mock->shouldReceive('retrieveSource')->andReturn(payMongoSource('src_old', 'pending', 800));
        $mock->shouldReceive('createGcashSource')->once()
            ->withArgs(fn (float $amountInPesos) => $amountInPesos === 1000.0)
            ->andReturn(payMongoSource('src_new', 'pending'));
    });

    $this->post(URL::signedRoute('payments.gcash.initiate', [
        'enrollment' => $this->enrollment->id,
        'installment' => $this->installment->id,
    ]))->assertRedirect('https://paymongo.test/checkout/src_new');

    expect($stale->fresh()->status)->toBe('FAILED')
        ->and(Payment::where('paymongo_source_id', 'src_new')->value('status'))->toBe('PENDING');
});

test('PayMongo receives the parent\'s real email and signed return urls', function () {
    $this->mock(PayMongoService::class, function (MockInterface $mock) {
        $mock->shouldReceive('createGcashSource')->once()
            ->withArgs(function (float $amountInPesos, string $successUrl, string $failedUrl, array $billing) {
                return $billing['email'] === 'parent@example.com'
                    && str_contains($successUrl, 'signature=')
                    && str_contains($failedUrl, 'signature=');
            })
            ->andReturn(payMongoSource('src_new', 'pending'));
    });

    $this->post(URL::signedRoute('payments.gcash.initiate', [
        'enrollment' => $this->enrollment->id,
        'installment' => $this->installment->id,
    ]))->assertRedirect('https://paymongo.test/checkout/src_new');
});

test('the failed return page double-checks with PayMongo before giving up', function () {
    $payment = pendingGcashPayment($this->installment);

    $this->mock(PayMongoService::class, function (MockInterface $mock) {
        $mock->shouldReceive('retrieveSource')->andReturn(payMongoSource('src_test_1', 'pending'));
    });

    $this->get(callbackUrl('payments.callback.failed', $this->installment))
        ->assertRedirect()
        ->assertSessionHas('error');

    expect($payment->fresh()->status)->toBe('FAILED');
});

test('sandbox checkout is reused and confirming twice records the payment once', function () {
    config(['services.paymongo.sandbox_mode' => true]);

    $initiateUrl = URL::signedRoute('payments.gcash.initiate', [
        'enrollment' => $this->enrollment->id,
        'installment' => $this->installment->id,
    ]);

    $this->post($initiateUrl)->assertRedirect();
    $this->post($initiateUrl)->assertRedirect();

    expect(Payment::count())->toBe(1);

    $payment = Payment::first();
    $this->post(route('payments.sandbox.confirm', $payment))->assertRedirect();
    $this->post(route('payments.sandbox.confirm', $payment))->assertRedirect();

    expect($payment->fresh()->status)->toBe('COMPLETED')
        ->and($this->installment->fresh()->totalPaid())->toBe(1000.0);
});
