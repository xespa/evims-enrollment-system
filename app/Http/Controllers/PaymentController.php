<?php

namespace App\Http\Controllers;

use App\Models\Enrollment;
use App\Models\Installment;
use App\Models\Payment;
use App\Notifications\PaymentReceived;
use App\Services\GcashPaymentSync;
use App\Services\PayMongoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;
use Inertia\Inertia;

class PaymentController extends Controller
{
    public function __construct(
        protected PayMongoService $payMongo,
        protected GcashPaymentSync $gcash,
    ) {}

    public function show(Enrollment $enrollment)
    {
        $this->ensureCanPayOnline($enrollment);

        $enrollment->load('student', 'billingContract.installments.payments');

        $enrollment->billingContract?->installments?->each(function ($installment) use ($enrollment) {
            $installment->gcash_initiate_url = URL::signedRoute('payments.gcash.initiate', [
                'enrollment' => $enrollment->id,
                'installment' => $installment->id,
            ]);
        });

        return Inertia::render('Payments/Show', [
            'enrollment' => $enrollment,
        ]);
    }

    public function initiateGcash(Enrollment $enrollment, Installment $installment)
    {
        $this->ensureCanPayOnline($enrollment);

        $remaining = $installment->amount_due - $installment->totalPaid();

        if ($remaining <= 0) {
            return $this->backToPayments($enrollment, 'success', 'This installment is already fully paid.');
        }

        // Pick up where an earlier click left off instead of opening a new
        // PayMongo checkout (and a new PENDING record) every time.
        $pending = $installment->payments()
            ->where('method', 'GCASH')
            ->where('status', 'PENDING')
            ->latest('id')
            ->first();

        if ($pending) {
            $source = $this->syncWithPayMongo($pending);

            if ($pending->status === 'COMPLETED') {
                return $this->backToPayments($enrollment, 'success', 'Your GCash payment was received.');
            }

            $sameAmount = round((float) $pending->amount, 2) === round($remaining, 2);

            if ($pending->status === 'PENDING' && $sameAmount) {
                if ($this->gcash->isSandbox($pending)) {
                    return redirect()->route('payments.sandbox.checkout', $pending->id);
                }

                if ($checkoutUrl = $source['attributes']['redirect']['checkout_url'] ?? null) {
                    return Inertia::location($checkoutUrl);
                }
            }

            // Stale attempt (amount changed since, or no longer resumable).
            // If the parent still approves it later, the webhook collects and
            // records it anyway — FAILED doesn't block that.
            if ($pending->status === 'PENDING') {
                $pending->update(['status' => 'FAILED']);
            }
        }

        if (config('services.paymongo.sandbox_mode')) {
            // SANDBOX: skip the real PayMongo API entirely, fake a source ID,
            // and send the parent to our own simulated checkout page instead.
            $payment = Payment::create([
                'installment_id' => $installment->id,
                'enrollment_id' => $enrollment->id,
                'amount' => $remaining,
                'method' => 'GCASH',
                'status' => 'PENDING',
                'paymongo_source_id' => 'src_sandbox_'.uniqid(),
            ]);

            return redirect()->route('payments.sandbox.checkout', $payment->id);
        }

        $enrollment->loadMissing('student.parentProfile', 'enrolleeUser');
        $student = $enrollment->student;
        $parentProfile = $student->parentProfile;

        $source = $this->payMongo->createGcashSource(
            amountInPesos: $remaining,
            // Signed so the return pages can safely look up and link to this
            // enrollment's payment page. PayMongo redirects to these as-is.
            successUrl: URL::signedRoute('payments.callback.success', [$enrollment->id, $installment->id]),
            failedUrl: URL::signedRoute('payments.callback.failed', [$enrollment->id, $installment->id]),
            billing: array_filter([
                'name' => "{$student->first_name} {$student->last_name}",
                'email' => $enrollment->email ?? $enrollment->enrolleeUser?->email,
                'phone' => $parentProfile?->father_mobile_no ?? $parentProfile?->mother_mobile_no,
            ]),
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

    /**
     * Where PayMongo sends the parent after approving in GCash. The redirect
     * itself proves nothing, so we ask PayMongo directly (in case the webhook
     * is late or never comes). The Processing page polls this same URL.
     */
    public function callbackSuccess(Enrollment $enrollment, Installment $installment)
    {
        $payment = $installment->payments()
            ->where('method', 'GCASH')
            ->latest('id')
            ->first();

        if (! $payment) {
            return $this->backToPayments($enrollment);
        }

        if ($payment->status === 'PENDING') {
            $this->syncWithPayMongo($payment);
        }

        return match ($payment->status) {
            'COMPLETED' => $this->backToPayments($enrollment, 'success', 'Payment received! Thank you.'),
            'FAILED' => $this->backToPayments($enrollment, 'error', 'Payment was not completed. You can try again below.'),
            default => Inertia::render('Payments/Processing', [
                'paymentsUrl' => URL::signedRoute('payments.show', $enrollment->id),
            ]),
        };
    }

    public function callbackFailed(Enrollment $enrollment, Installment $installment)
    {
        $payment = $installment->payments()
            ->where('method', 'GCASH')
            ->where('status', 'PENDING')
            ->latest('id')
            ->first();

        if ($payment) {
            // Double-check with PayMongo before giving up on it.
            $this->syncWithPayMongo($payment);

            if ($payment->status === 'PENDING') {
                $payment->update(['status' => 'FAILED']);
            }

            if ($payment->status === 'COMPLETED') {
                return $this->backToPayments($enrollment, 'success', 'Payment received! Thank you.');
            }
        }

        return $this->backToPayments($enrollment, 'error', 'Payment was not completed. You can try again below.');
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

            // Safe to receive twice: a retried/duplicate webhook finds the
            // payment already COMPLETED and charges nothing.
            if (! $this->gcash->chargeAndComplete($payment, $amount)) {
                Log::info("Webhook: payment for source {$sourceId} already completed, skipping");
            }
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

    public function sandboxCheckout(Payment $payment)
    {
        abort_unless(config('services.paymongo.sandbox_mode'), 404);

        $payment->load('enrollment.student');

        return Inertia::render('Payments/SandboxCheckout', [
            'payment' => $payment,
        ]);
    }

    public function sandboxConfirm(Payment $payment)
    {
        abort_unless(config('services.paymongo.sandbox_mode'), 404);

        // Double-submitting the simulated checkout shouldn't record it twice.
        if ($payment->status !== 'COMPLETED') {
            $payment->update([
                'status' => 'COMPLETED',
                'paid_at' => now(),
            ]);

            $payment->installment->refreshStatus();

            $payment->loadMissing('enrollment.student', 'enrollment.enrolleeUser');
            $payment->enrollment->enrolleeUser?->notify(new PaymentReceived($payment));
        }

        return redirect(URL::signedRoute('payments.show', $payment->enrollment_id))
            ->with('success', 'Payment successful! (Simulated)');
    }

    /**
     * Like GcashPaymentSync::sync(), but a PayMongo outage or error leaves the
     * payment as-is (still PENDING) instead of breaking the page — the
     * webhook or the next check can still settle it.
     *
     * @return array<string, mixed>|null
     */
    protected function syncWithPayMongo(Payment $payment): ?array
    {
        try {
            return $this->gcash->sync($payment);
        } catch (\Throwable $exception) {
            report($exception);

            return null;
        }
    }

    /**
     * Online payment is only for approved applications that chose GCash.
     * Counter payers pay the cashier, who records it, so an old or forwarded
     * payment link must not let them check out online.
     */
    protected function ensureCanPayOnline(Enrollment $enrollment): void
    {
        abort_unless($enrollment->enrollment_status === 'APPROVED', 403, 'Payment is available once your application is approved.');
        abort_unless(
            (bool) $enrollment->billingContract?->paysOnline(),
            403,
            'This application is paid at the school cashier, not online.',
        );
    }

    /**
     * The payment page lives behind a signed URL, so every redirect back to
     * it has to be signed too.
     */
    protected function backToPayments(Enrollment $enrollment, ?string $flashKey = null, ?string $message = null)
    {
        $redirect = redirect(URL::signedRoute('payments.show', $enrollment->id));

        return $flashKey ? $redirect->with($flashKey, $message) : $redirect;
    }
}
