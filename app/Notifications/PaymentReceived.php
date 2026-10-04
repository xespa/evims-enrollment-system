<?php

namespace App\Notifications;

use App\Models\EnrolleeUser;
use App\Models\Payment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Confirms a completed payment to the parent, in the portal and by email,
 * whether it was paid through GCash or at the school cashier.
 */
class PaymentReceived extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * @param  float|null  $totalAmount  The whole amount received, when one payment at the
     *                                   counter was split across several installments.
     */
    public function __construct(public Payment $payment, public ?float $totalAmount = null) {}

    /**
     * @return array<int, string>
     */
    public function via(EnrolleeUser $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(EnrolleeUser $notifiable): MailMessage
    {
        $this->payment->loadMissing('enrollment.student', 'enrollment.billingContract.installments');
        $enrollment = $this->payment->enrollment;
        $student = $enrollment->student;
        $remainingBalance = $enrollment->billingContract?->remainingBalance();

        $message = (new MailMessage)
            ->subject("Payment Received for {$student->first_name}'s Enrollment")
            ->greeting("Hello {$notifiable->name},")
            ->line("We've received your payment for {$student->first_name} {$student->last_name}'s enrollment for S.Y. {$enrollment->school_year}. Thank you!")
            ->line('**Amount:** ₱'.$this->formattedAmount())
            ->line('**Paid via:** '.($this->payment->method === 'GCASH' ? 'GCash' : 'Cash at the school cashier'))
            ->line('**Date paid:** '.($this->payment->paid_at ?? now())->timezone('Asia/Manila')->format('F j, Y g:i A'));

        if ($this->payment->receipt_number) {
            $message->line("**Official receipt no.:** {$this->payment->receipt_number}");
        }

        if ($remainingBalance !== null) {
            $message->line($remainingBalance > 0
                ? '**Remaining balance:** ₱'.number_format($remainingBalance, 2)
                : 'Your enrollment is now **fully paid**.');
        }

        return $message
            ->action('View My Payments', route('portal.dashboard'))
            ->line('Please keep this email for your records.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(EnrolleeUser $notifiable): array
    {
        $enrollment = $this->payment->enrollment;
        $student = $enrollment->student;

        return [
            'type' => 'payment_received',
            'enrollment_id' => $enrollment->id,
            'payment_id' => $this->payment->id,
            'student_name' => trim("{$student->first_name} {$student->last_name}"),
            'amount' => number_format($this->amount(), 2, '.', ''),
            'method' => $this->payment->method,
            'title' => 'Payment received',
            'message' => "We've received a payment of ₱{$this->formattedAmount()} for {$student->first_name}'s enrollment.",
            'url' => '/portal/dashboard',
        ];
    }

    private function amount(): float
    {
        return $this->totalAmount ?? (float) $this->payment->amount;
    }

    private function formattedAmount(): string
    {
        return number_format($this->amount(), 2);
    }
}
