<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Payments\GenerateAcknowledgementReceipt;
use App\Http\Controllers\Controller;
use App\Models\Payment;
use Symfony\Component\HttpFoundation\Response;

/**
 * The acknowledgement receipt for a counter payment, opened in the browser
 * so the cashier can print it. Only active counter payments have one:
 * GCash payments get no paper receipt, and a voided one must not be reissued.
 */
class AcknowledgementReceiptController extends Controller
{
    public function __invoke(Payment $payment, GenerateAcknowledgementReceipt $acknowledgementReceipt): Response
    {
        abort_unless(
            $payment->method === 'CASH' && $payment->status === 'COMPLETED' && filled($payment->receipt_number),
            404,
        );

        return $acknowledgementReceipt->handle($payment)->stream($acknowledgementReceipt->filename($payment));
    }
}
