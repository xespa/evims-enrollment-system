<?php

namespace App\Notifications;

use App\Models\Payment;
use Illuminate\Notifications\Notification;

/**
 * Tells the parent a counter payment was cancelled by the school, so a
 * balance that suddenly went back up isn't a mystery.
 */
class PaymentVoided extends Notification
{
    public function __construct(public Payment $payment, public float $totalAmount) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $enrollment = $this->payment->enrollment;
        $student = $enrollment->student;
        $formattedAmount = number_format($this->totalAmount, 2);
        $receipt = $this->payment->receipt_number ? " (OR {$this->payment->receipt_number})" : '';

        return [
            'type' => 'payment_voided',
            'enrollment_id' => $enrollment->id,
            'payment_id' => $this->payment->id,
            'student_name' => trim("{$student->first_name} {$student->last_name}"),
            'amount' => number_format($this->totalAmount, 2, '.', ''),
            'title' => 'Payment record corrected',
            'message' => "A counter payment of ₱{$formattedAmount}{$receipt} for {$student->first_name}'s enrollment was voided by the school: {$this->payment->void_reason}. Your balance has been updated.",
            'url' => '/portal/dashboard',
        ];
    }
}
