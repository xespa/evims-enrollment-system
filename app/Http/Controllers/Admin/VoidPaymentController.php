<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Payments\VoidCounterPayment;
use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class VoidPaymentController extends Controller
{
    /**
     * Voids a counter payment recorded by mistake, keeping it on record.
     */
    public function __invoke(Request $request, Payment $payment, VoidCounterPayment $voidCounterPayment): RedirectResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:5', 'max:255'],
        ], [
            'reason.required' => 'Say why this payment is being voided.',
            'reason.min' => 'Give a little more detail about why this payment is being voided.',
        ]);

        /** @var User $admin Admin routes use the staff (web) guard. */
        $admin = $request->user();

        $voided = $voidCounterPayment->handle($payment, $validated['reason'], $admin);

        $formattedAmount = number_format((float) $voided->sum('amount'), 2);
        $receipt = $payment->receipt_number ? "OR {$payment->receipt_number}" : 'The payment';

        return back()->with('success', "{$receipt} (₱{$formattedAmount}) was voided. The balance has been updated.");
    }
}
