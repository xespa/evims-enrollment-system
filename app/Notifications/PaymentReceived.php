<?php

namespace App\Notifications;

use App\Models\Payment;
use Illuminate\Notifications\Notification;

class PaymentReceived extends Notification
{
    /**
     * @param  float|null  $totalAmount  The whole amount received, when one payment at the
     *                                   counter was split across several installments.
     */
    public function __construct(public Payment $payment, public ?float $totalAmount = null) {}

    public function via($notifiable): array
    {
        return ['database'];
    }

    public function toArray($notifiable): array
    {
        $enrollment = $this->payment->enrollment;
        $student = $enrollment->student;
        $amount = $this->totalAmount ?? (float) $this->payment->amount;
        $formattedAmount = number_format($amount, 2);

        return [
            'type' => 'payment_received',
            'enrollment_id' => $enrollment->id,
            'payment_id' => $this->payment->id,
            'student_name' => trim("{$student->first_name} {$student->last_name}"),
            'amount' => number_format($amount, 2, '.', ''),
            'method' => $this->payment->method,
            'title' => 'Payment received',
            'message' => "We've received a payment of ₱{$formattedAmount} for {$student->first_name}'s enrollment.",
            'url' => '/portal/dashboard',
        ];
    }
}
