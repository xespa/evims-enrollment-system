<?php

namespace App\Notifications;

use App\Models\Payment;
use Illuminate\Notifications\Notification;

class PaymentReceived extends Notification
{
    public function __construct(public Payment $payment) {}

    public function via($notifiable): array
    {
        return ['database'];
    }

    public function toArray($notifiable): array
    {
        $enrollment = $this->payment->enrollment;
        $student = $enrollment->student;
        $formattedAmount = number_format((float) $this->payment->amount, 2);

        return [
            'type' => 'payment_received',
            'enrollment_id' => $enrollment->id,
            'payment_id' => $this->payment->id,
            'student_name' => trim("{$student->first_name} {$student->last_name}"),
            'amount' => $this->payment->amount,
            'method' => $this->payment->method,
            'title' => 'Payment received',
            'message' => "We've received a payment of ₱{$formattedAmount} for {$student->first_name}'s enrollment.",
            'url' => '/portal/dashboard',
        ];
    }
}
