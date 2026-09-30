<?php

namespace App\Actions\Payments;

use App\Models\Payment;
use App\Models\User;
use App\Notifications\PaymentVoided;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Cancels a counter payment recorded by mistake. Nothing is deleted or
 * edited: the payment is marked VOIDED with who voided it, when and why,
 * stops counting as paid, and its installments reopen.
 *
 * A receipt is voided as a whole: one counter payment split across several
 * installments shares one OR number, so every part of it is voided together.
 */
class VoidCounterPayment
{
    /**
     * @return Collection<int, Payment> The payments that were voided.
     *
     * @throws ValidationException When the payment isn't an active counter payment.
     */
    public function handle(Payment $payment, string $reason, User $voidedBy): Collection
    {
        if ($payment->method !== 'CASH' || $payment->status !== 'COMPLETED') {
            throw ValidationException::withMessages([
                'reason' => 'Only counter payments that are still in effect can be voided.',
            ]);
        }

        $voided = DB::transaction(function () use ($payment, $reason, $voidedBy) {
            $payments = Payment::query()
                ->where('enrollment_id', $payment->enrollment_id)
                ->where('method', 'CASH')
                ->where('status', 'COMPLETED')
                ->when(
                    $payment->receipt_number,
                    fn ($query, string $receiptNumber) => $query->where('receipt_number', $receiptNumber),
                    fn ($query) => $query->whereKey($payment->id),
                )
                ->with('installment')
                ->lockForUpdate()
                ->get();

            foreach ($payments as $part) {
                $part->update([
                    'status' => 'VOIDED',
                    'voided_at' => now(),
                    'voided_by' => $voidedBy->id,
                    'void_reason' => $reason,
                ]);

                $part->installment->refreshStatus();
            }

            return $payments;
        });

        $enrollment = $payment->enrollment()->with('student', 'enrolleeUser')->first();
        $enrollment?->enrolleeUser?->notify(new PaymentVoided(
            $voided->first()->setRelation('enrollment', $enrollment),
            totalAmount: (float) $voided->sum('amount'),
        ));

        return $voided;
    }
}
