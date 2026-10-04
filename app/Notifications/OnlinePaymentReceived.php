<?php

namespace App\Notifications;

use App\Models\Payment;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

/**
 * Tells the admins a parent paid online through GCash. Counter payments
 * aren't announced, since the cashier records those themselves.
 */
class OnlinePaymentReceived extends Notification implements ShouldQueue
{
    use Queueable;

    public const TYPE = 'online_payment_received';

    public function __construct(public Payment $payment) {}

    /**
     * @return array<int, string>
     */
    public function via(User $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(User $notifiable): array
    {
        $this->payment->loadMissing('enrollment.student');
        $student = $this->payment->enrollment->student;
        $amount = number_format((float) $this->payment->amount, 2);

        return [
            'type' => self::TYPE,
            'enrollment_id' => $this->payment->enrollment_id,
            'payment_id' => $this->payment->id,
            'student_name' => trim("{$student->first_name} {$student->last_name}"),
            'amount' => number_format((float) $this->payment->amount, 2, '.', ''),
            'title' => 'Online payment received',
            'message' => "{$student->first_name} {$student->last_name}'s parent paid ₱{$amount} through GCash.",
            'url' => route('admin.transactions.show', $this->payment, false),
        ];
    }
}
