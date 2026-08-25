<?php

namespace App\Http\Controllers;

use App\Models\Enrollment;
use App\Models\Installment;
use App\Models\Payment;
use App\Services\PayMongoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;
use Inertia\Inertia;

class PaymentController extends Controller
{
    public function __construct(protected PayMongoService $payMongo) {}

    public function show(Enrollment $enrollment)
    {
        $enrollment->load('student', 'billingContract.installments.payments');

        $installments = $enrollment->billingContract?->installments
            ->map(function ($installment) use ($enrollment) {
                $installment->gcash_initiate_url = URL::signedRoute('payments.gcash.initiate', [
                    'enrollment' => $enrollment->id,
                    'installment' => $installment->id,
                ]);

                return $installment;
            });

        return Inertia::render('Payments/Show', [
            'enrollment' => $enrollment,
        ]);
    }

    public function initiateGcash(Request $request, Enrollment $enrollment, Installment $installment)
    {
        $remaining = $installment->amount_due - $installment->totalPaid();

        if ($remaining <= 0) {
            return back()->withErrors(['payment' => 'This installment is already fully paid.']);
        }

        if (config('services.paymongo.sandbox_mode')) {
            // SANDBOX: skip the real PayMongo API entirely, fake a source ID,
            // and send the parent to our own simulated checkout page instead.
            $fakeSourceId = 'src_sandbox_'.uniqid();

            $payment = Payment::create([
                'installment_id' => $installment->id,
                'enrollment_id' => $enrollment->id,
                'amount' => $remaining,
                'method' => 'GCASH',
                'status' => 'PENDING',
                'paymongo_source_id' => $fakeSourceId,
            ]);

            return redirect()->route('payments.sandbox.checkout', $payment->id);
        }

        $student = $enrollment->student;
        $parentProfile = $student->parentProfile;

        $source = $this->payMongo->createGcashSource(
            amountInPesos: $remaining,
            successUrl: route('payments.callback.success', [$enrollment->id, $installment->id]),
            failedUrl: route('payments.callback.failed', [$enrollment->id, $installment->id]),
            billing: [
                'name' => "{$student->first_name} {$student->last_name}",
                'email' => 'parent+'.$enrollment->id.'@evims.test', // placeholder — see note below
                'phone' => $parentProfile?->father_mobile_no ?? $parentProfile?->mother_mobile_no ?? '09000000000',
            ]
        );

        Payment::create([
            'installment_id' => $installment->id,
            'enrollment_id' => $enrollment->id,
            'amount' => $remaining,
            'method' => 'GCASH',
            'status' => 'PENDING',
            'paymongo_source_id' => $source['id'],
        ]);

        return Inertia::location($source['attributes']['redirect']['checkout_url']);
    }

    public function callbackSuccess(Enrollment $enrollment, Installment $installment)
    {
        return Inertia::render('Payments/Processing', [
            'enrollment_id' => $enrollment->id,
            'paymentUrl' => URL::signedRoute('payments.show', $enrollment->id),
        ]);
    }

    public function callbackFailed(Enrollment $enrollment, Installment $installment)
    {
        Payment::where('installment_id', $installment->id)
            ->where('status', 'PENDING')
            ->where('method', 'GCASH')
            ->latest()
            ->first()
            ?->update(['status' => 'FAILED']);

        return redirect()
            ->route('payments.show', $enrollment->id)
            ->with('error', 'Payment was not completed. You can try again below.');
    }

    public function webhook(Request $request)
    {
        $signatureHeader = $request->header('Paymongo-Signature');

        if (! $this->verifyWebhookSignature($request->getContent(), $signatureHeader)) {
            Log::warning('PayMongo webhook: signature verification failed', [
                'ip' => $request->ip(),
            ]);

            return response()->json(['error' => 'Invalid signature'], 400);
        }

        Log::info('PayMongo webhook received', $request->all());

        $eventType = $request->input('data.attributes.type');

        if ($eventType === 'source.chargeable') {
            $sourceId = $request->input('data.attributes.data.id');
            $amount = $request->input('data.attributes.data.attributes.amount') / 100;
            $payment = Payment::where('paymongo_source_id', $sourceId)->first();

            if (! $payment) {
                Log::warning("Webhook: no matching payment for source {$sourceId}");

                return response()->json(['status' => 'ignored'], 200);
            }

            // Actually charge the now-chargeable source
            $paymentResult = $this->payMongo->createPaymentFromSource(
                $sourceId,
                $amount,
                "Enrollment #{$payment->enrollment_id} - Installment payment"
            );

            $payment->update([
                'status' => 'COMPLETED',
                'paymongo_payment_intent_id' => $paymentResult['id'],
                'paid_at' => now(),
            ]);

            $payment->installment->refreshStatus();
        }

        return response()->json(['status' => 'ok'], 200);
    }

    protected function verifyWebhookSignature(string $rawPayload, ?string $signatureHeader): bool
    {
        if (! $signatureHeader) {
            return false;
        }

        // Header format: "t=1633036800,te=abc123...,li=def456..."
        $parts = [];
        foreach (explode(',', $signatureHeader) as $segment) {
            if (str_contains($segment, '=')) {
                [$key, $value] = explode('=', $segment, 2);
                $parts[$key] = $value;
            }
        }

        $timestamp = $parts['t'] ?? null;
        $testSignature = $parts['te'] ?? null;
        $liveSignature = $parts['li'] ?? null;
        $providedSignature = $testSignature ?: $liveSignature;

        if (! $timestamp || ! $providedSignature) {
            return false;
        }

        $signedPayload = "{$timestamp}.{$rawPayload}";
        $expectedSignature = hash_hmac('sha256', $signedPayload, config('services.paymongo.webhook_secret'));

        return hash_equals($expectedSignature, $providedSignature);
    }
}
