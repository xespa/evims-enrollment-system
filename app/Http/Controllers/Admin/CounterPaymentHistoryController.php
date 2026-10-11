<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;

/**
 * The counter payments already recorded on an application, shown in the
 * "Record counter payment" dialog so the cashier can see what was paid
 * before. A payment split across installments is listed once per receipt.
 */
class CounterPaymentHistoryController extends Controller
{
    public function __invoke(Enrollment $enrollment): JsonResponse
    {
        $receipts = Payment::query()
            ->whereBelongsTo($enrollment)
            ->where('method', 'CASH')
            ->with(['installment:id,installment_number', 'recordedBy:id,name'])
            ->latest('paid_at')
            ->latest('id')
            ->get()
            // Every part of one receipt shares its OR number, and is voided together.
            ->groupBy(fn (Payment $payment) => $payment->receipt_number
                ? "{$payment->receipt_number}|{$payment->status}|{$payment->voided_at}"
                : "payment-{$payment->id}")
            ->map(fn (Collection $parts) => $this->receipt($parts))
            ->values();

        return response()->json(['receipts' => $receipts]);
    }

    /**
     * @param  Collection<int, Payment>  $parts
     * @return array<string, mixed>
     */
    private function receipt(Collection $parts): array
    {
        /** @var Payment $first */
        $first = $parts->first();

        return [
            'id' => $first->id,
            'receipt_number' => $first->receipt_number,
            'paid_at' => $first->paid_at,
            'amount' => round((float) $parts->sum('amount'), 2),
            'status' => $first->status,
            'received_from' => $first->received_from,
            'payment_form' => $first->payment_form,
            'check_bank' => $first->check_bank,
            'check_number' => $first->check_number,
            'recorded_by' => $first->recordedBy?->name,
            'installment_numbers' => $parts
                ->map(fn (Payment $payment) => $payment->installment?->installment_number)
                ->filter()
                ->sort()
                ->values(),
        ];
    }
}
