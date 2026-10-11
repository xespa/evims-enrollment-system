<?php

namespace App\Actions\Payments;

use App\Enums\PaymentForm;
use App\Models\Enrollment;
use App\Models\Installment;
use App\Models\Payment;
use App\Models\User;
use App\Notifications\PaymentReceived;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use InvalidArgumentException;

/**
 * Records money a parent paid at the school cashier. The amount is applied
 * to the unpaid installments in order (earliest due first), the way a
 * cashier thinks about it: "they paid ₱8,000 today".
 */
class RecordCounterPayment
{
    /**
     * @param  array{received_from?: string|null, payment_form?: PaymentForm, check_bank?: string|null, check_number?: string|null, check_date?: CarbonInterface|null}  $receiptDetails  What else is written on the paper receipt.
     * @return Collection<int, Payment> One payment per installment the amount touched.
     *
     * @throws ValidationException When the OR number is already on an active payment.
     */
    public function handle(
        Enrollment $enrollment,
        float $amount,
        string $receiptNumber,
        CarbonInterface $paidAt,
        User $recordedBy,
        array $receiptDetails = [],
    ): Collection {
        $receiptNumber = Payment::normalizeReceiptNumber($receiptNumber);
        $receiptDetails = $this->tenderDetails($receiptDetails);

        // Two cashiers (or a double-clicked button) submitting the same
        // receipt at once must not both get through the duplicate check.
        $payments = Cache::lock("counter-payment-receipt:{$receiptNumber}", 10)
            ->block(5, fn () => $this->record($enrollment, $amount, $receiptNumber, $paidAt, $recordedBy, $receiptDetails));

        // One notification for the whole amount, not one per installment.
        $enrollment->loadMissing('student', 'enrolleeUser');
        $first = $payments->first()->setRelation('enrollment', $enrollment);
        $enrollment->enrolleeUser?->notify(new PaymentReceived($first, totalAmount: $amount));

        return $payments;
    }

    /**
     * Fills in the defaults and drops the check fields from a cash payment.
     *
     * @param  array{received_from?: string|null, payment_form?: PaymentForm, check_bank?: string|null, check_number?: string|null, check_date?: CarbonInterface|null}  $receiptDetails
     * @return array{received_from: string|null, payment_form: PaymentForm, check_bank: string|null, check_number: string|null, check_date: CarbonInterface|null}
     */
    private function tenderDetails(array $receiptDetails): array
    {
        $paymentForm = $receiptDetails['payment_form'] ?? PaymentForm::Cash;
        $isCheck = $paymentForm === PaymentForm::Check;

        return [
            'received_from' => ($receiptDetails['received_from'] ?? null) ?: null,
            'payment_form' => $paymentForm,
            'check_bank' => $isCheck ? ($receiptDetails['check_bank'] ?? null) : null,
            'check_number' => $isCheck ? ($receiptDetails['check_number'] ?? null) : null,
            'check_date' => $isCheck ? ($receiptDetails['check_date'] ?? null) : null,
        ];
    }

    /**
     * @param  array{received_from: string|null, payment_form: PaymentForm, check_bank: string|null, check_number: string|null, check_date: CarbonInterface|null}  $receiptDetails
     * @return Collection<int, Payment>
     */
    private function record(
        Enrollment $enrollment,
        float $amount,
        string $receiptNumber,
        CarbonInterface $paidAt,
        User $recordedBy,
        array $receiptDetails,
    ): Collection {
        return DB::transaction(function () use ($enrollment, $amount, $receiptNumber, $paidAt, $recordedBy, $receiptDetails) {
            $existing = Payment::query()->activeWithReceipt($receiptNumber)->with('enrollment.student')->first();

            if ($existing) {
                $student = $existing->enrollment->student;

                throw ValidationException::withMessages([
                    'receipt_number' => "OR {$receiptNumber} is already recorded for {$student->first_name} {$student->last_name} (application #{$existing->enrollment_id}). Void that payment first if it was a mistake.",
                ]);
            }

            $installments = $enrollment->billingContract()->firstOrFail()
                ->installments()
                ->where('status', '!=', 'PAID')
                ->orderBy('installment_number')
                ->lockForUpdate()
                ->get();

            $remainingBalance = round($installments->sum(fn (Installment $installment) => $this->owedOn($installment)), 2);

            if (round($amount, 2) > $remainingBalance) {
                throw new InvalidArgumentException('The amount is more than the remaining balance.');
            }

            $left = round($amount, 2);
            $payments = collect();

            foreach ($installments as $installment) {
                if ($left <= 0) {
                    break;
                }

                $applied = min($left, $this->owedOn($installment));

                if ($applied <= 0) {
                    continue;
                }

                $payments->push(Payment::create([
                    'installment_id' => $installment->id,
                    'enrollment_id' => $enrollment->id,
                    'amount' => $applied,
                    'method' => 'CASH',
                    'receipt_number' => $receiptNumber,
                    ...$receiptDetails,
                    'status' => 'COMPLETED',
                    'recorded_by' => $recordedBy->id,
                    'paid_at' => $paidAt,
                ]));

                $installment->refreshStatus();
                $left = round($left - $applied, 2);
            }

            return $payments;
        });
    }

    private function owedOn(Installment $installment): float
    {
        return round(max(0, (float) $installment->amount_due - $installment->totalPaid()), 2);
    }
}
