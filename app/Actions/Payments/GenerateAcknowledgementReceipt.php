<?php

namespace App\Actions\Payments;

use App\Concerns\EmbedsSchoolLogo;
use App\Enums\PaymentForm;
use App\Models\Payment;
use Barryvdh\DomPDF\Facade\Pdf;
use Barryvdh\DomPDF\PDF as AcknowledgementReceiptPdf;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Number;
use Illuminate\Support\Str;

/**
 * The acknowledgement receipt (OR) the cashier hands a parent for a counter
 * payment, laid out like the school's pre-printed receipt booklet. One
 * receipt covers every installment its OR number was split across.
 */
class GenerateAcknowledgementReceipt
{
    use EmbedsSchoolLogo;

    /** Half a letter-size sheet, landscape, in points: the booklet's size. */
    private const PAPER = [0, 0, 612, 396];

    public function handle(Payment $payment): AcknowledgementReceiptPdf
    {
        return Pdf::loadView('pdf.acknowledgement-receipt', $this->viewData($payment))
            ->setPaper(self::PAPER)
            ->setOption('isFontSubsettingEnabled', true);
    }

    /**
     * Everything the receipt shows.
     *
     * @return array{receiptNumber: string, paidOn: ?CarbonInterface, receivedFrom: string, address: string, total: float, totalInWords: string, isFullPayment: bool, paymentFor: string, particulars: list<array{label: string, amount: float}>, amountDue: float, paymentForm: string, checkBank: ?string, checkNumber: ?string, checkDate: ?CarbonInterface, cashier: ?string, logo: ?string}
     */
    public function viewData(Payment $payment): array
    {
        $payment->loadMissing([
            'enrollment.student.address',
            'enrollment.enrolleeUser:id,name',
            'enrollment.gradeLevel:id,name',
            'recordedBy:id,name',
        ]);

        $parts = $this->receiptParts($payment);
        $total = round((float) $parts->sum('amount'), 2);
        $amountDue = $this->amountDueBefore($parts);
        $enrollment = $payment->enrollment;
        $installmentNumbers = $parts->map(fn (Payment $part) => "#{$part->installment->installment_number}")->implode(', ');

        return [
            'receiptNumber' => (string) $payment->receipt_number,
            'paidOn' => $payment->paid_at?->timezone('Asia/Manila'),
            'receivedFrom' => $payment->received_from
                ?: $enrollment->enrolleeUser->name
                ?? "{$enrollment->student->first_name} {$enrollment->student->last_name}",
            'address' => $this->address($payment),
            'total' => $total,
            'totalInWords' => $this->inWords($total),
            'isFullPayment' => $total >= $amountDue,
            'paymentFor' => "Installment {$installmentNumbers} of {$enrollment->student->first_name} {$enrollment->student->last_name}'s school fees, {$enrollment->gradeLevel->name}, S.Y. {$enrollment->school_year}",
            'particulars' => array_values($parts
                ->map(fn (Payment $part) => [
                    'label' => "Installment #{$part->installment->installment_number}",
                    'amount' => (float) $part->amount,
                ])
                ->all()),
            'amountDue' => $amountDue,
            'paymentForm' => ($payment->payment_form ?? PaymentForm::Cash)->value,
            'checkBank' => $payment->check_bank,
            'checkNumber' => $payment->check_number,
            'checkDate' => $payment->check_date,
            'cashier' => $payment->recordedBy?->name,
            'logo' => $this->logoDataUri(),
        ];
    }

    /**
     * e.g. "acknowledgement-receipt-or-00123.pdf"
     */
    public function filename(Payment $payment): string
    {
        return 'acknowledgement-receipt-'.Str::slug((string) $payment->receipt_number).'.pdf';
    }

    /**
     * The payments recorded under the same OR number for this application,
     * one per installment, earliest installment first.
     *
     * @return Collection<int, Payment>
     */
    private function receiptParts(Payment $payment): Collection
    {
        return Payment::query()
            ->activeWithReceipt((string) $payment->receipt_number)
            ->whereBelongsTo($payment->enrollment)
            ->with('installment:id,installment_number,amount_due')
            ->get()
            ->sortBy(fn (Payment $part) => $part->installment->installment_number)
            ->values();
    }

    /**
     * What was still owed on the receipt's installments when it was
     * recorded, so reprinting it later shows the same amount.
     *
     * @param  Collection<int, Payment>  $parts
     */
    private function amountDueBefore(Collection $parts): float
    {
        $paidBefore = Payment::query()
            ->whereIn('installment_id', $parts->pluck('installment_id'))
            ->where('status', 'COMPLETED')
            ->where('id', '<', $parts->min('id'))
            ->sum('amount');

        $billed = $parts->sum(fn (Payment $part) => (float) $part->installment->amount_due);

        return round(max(0, $billed - (float) $paidBefore), 2);
    }

    private function address(Payment $payment): string
    {
        $address = $payment->enrollment->student->address;

        if (! $address) {
            return '';
        }

        return collect([$address->house_number_street, $address->barangay, $address->city_municipality, $address->province])
            ->filter()
            ->implode(', ');
    }

    /**
     * The "the sum of" line, e.g. 2500.5 → "Two Thousand Five Hundred and
     * 50/100", matching amountInWords() on the record-payment dialog.
     */
    private function inWords(float $amount): string
    {
        $cents = (int) round($amount * 100);
        $words = ucwords((string) Number::spell(intdiv($cents, 100)), " \t-");
        $centavos = $cents % 100;

        return $centavos > 0 ? sprintf('%s and %02d/100', $words, $centavos) : $words;
    }
}
