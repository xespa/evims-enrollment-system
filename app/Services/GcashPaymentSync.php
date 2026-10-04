<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\User;
use App\Notifications\OnlinePaymentReceived;
use App\Notifications\PaymentReceived;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

/**
 * Keeps a GCash Payment record in step with its PayMongo source.
 *
 * Both the webhook and the "did it go through?" checks funnel through here,
 * so the money is collected exactly once no matter which arrives first or
 * how many times PayMongo retries the webhook.
 */
class GcashPaymentSync
{
    public function __construct(protected PayMongoService $payMongo) {}

    /**
     * Collects a chargeable source and marks the payment COMPLETED.
     * Returns false (and charges nothing) if it was already completed.
     */
    public function chargeAndComplete(Payment $payment, float $amountInPesos): bool
    {
        $completed = DB::transaction(function () use ($payment, $amountInPesos) {
            // Row lock: a concurrent webhook/poll waits here, then sees COMPLETED.
            $locked = Payment::whereKey($payment->id)->lockForUpdate()->firstOrFail();

            if ($locked->status === 'COMPLETED') {
                return false;
            }

            $result = $this->payMongo->createPaymentFromSource(
                $locked->paymongo_source_id,
                $amountInPesos,
                "Enrollment #{$locked->enrollment_id} - Installment payment",
            );

            $this->markCompleted($locked, $result['id'] ?? null);

            return true;
        });

        if ($completed) {
            $this->announceCompleted($payment->fresh());
        }

        $payment->refresh();

        return $completed;
    }

    /**
     * Asks PayMongo for the source's current status and updates the payment
     * to match — the fallback for when the webhook never arrives. Returns the
     * source data, or null for sandbox payments (which have no real source).
     *
     * @return array<string, mixed>|null
     */
    public function sync(Payment $payment): ?array
    {
        if ($payment->status === 'COMPLETED' || $this->isSandbox($payment)) {
            return null;
        }

        $source = $this->payMongo->retrieveSource($payment->paymongo_source_id);
        $status = $source['attributes']['status'] ?? null;

        match ($status) {
            // The parent approved it in GCash but we never collected it.
            'chargeable' => $this->chargeAndComplete($payment, ($source['attributes']['amount'] ?? 0) / 100),
            // Already collected (e.g. by a webhook that didn't finish updating us).
            'paid' => $this->completeWithoutCharging($payment),
            'cancelled', 'expired' => $payment->update(['status' => 'FAILED']),
            default => null, // 'pending': the parent hasn't finished in GCash yet.
        };

        $payment->refresh();

        return $source;
    }

    public function isSandbox(Payment $payment): bool
    {
        return str_starts_with((string) $payment->paymongo_source_id, 'src_sandbox_');
    }

    protected function completeWithoutCharging(Payment $payment): void
    {
        $completed = DB::transaction(function () use ($payment) {
            $locked = Payment::whereKey($payment->id)->lockForUpdate()->firstOrFail();

            if ($locked->status === 'COMPLETED') {
                return false;
            }

            $this->markCompleted($locked, null);

            return true;
        });

        if ($completed) {
            $this->announceCompleted($payment->fresh());
        }
    }

    protected function markCompleted(Payment $payment, ?string $payMongoPaymentId): void
    {
        $payment->update([
            'status' => 'COMPLETED',
            'paymongo_payment_intent_id' => $payMongoPaymentId ?? $payment->paymongo_payment_intent_id,
            'paid_at' => now(),
        ]);

        $payment->installment->refreshStatus();
    }

    /**
     * Confirms the payment to the parent and lets the admins know it came in.
     */
    public function announceCompleted(Payment $payment): void
    {
        $payment->loadMissing('enrollment.student', 'enrollment.enrolleeUser');
        $payment->enrollment->enrolleeUser?->notify(new PaymentReceived($payment));

        Notification::send(User::query()->admins()->get(), new OnlinePaymentReceived($payment));
    }
}
