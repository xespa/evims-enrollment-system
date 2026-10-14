<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Http\Requests\Portal\UpdatePaymentMethodRequest;
use App\Models\Enrollment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\URL;

class PaymentMethodController extends Controller
{
    /**
     * Saves the online method chosen from Pay Tuition and goes on to the
     * online payment page.
     */
    public function update(UpdatePaymentMethodRequest $request, Enrollment $enrollment): RedirectResponse
    {
        $enrollment->billingContract->update([
            'payment_channel' => $request->validated('payment_channel'),
        ]);

        return redirect(URL::signedRoute('payments.show', $enrollment->id));
    }
}
