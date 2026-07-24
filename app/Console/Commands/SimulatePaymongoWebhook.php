<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use App\Models\Payment;
use Illuminate\Support\Facades\Http;
use Illuminate\Console\Command;

// #[Signature('app:simulate-paymongo-webhook')]
// #[Description('Command description')]


class SimulatePaymongoWebhook extends Command
{
    protected $signature = 'payment:simulate-webhook {payment_id}';
    protected $description = 'Simulates a PayMongo source.chargeable webhook for local testing without needing a verified business account';

    public function handle()
    {
        $payment = Payment::findOrFail($this->argument('payment_id'));

        if (! $payment->paymongo_source_id) {
            $this->error('This payment has no paymongo_source_id — was it created via the GCash flow?');
            return 1;
        }

        $fakePayload = [
            'data' => [
                'attributes' => [
                    'type' => 'source.chargeable',
                    'data' => [
                        'id' => $payment->paymongo_source_id,
                        'amount' => (int) round($payment->amount * 100),
                    ],
                ],
            ],
        ];

        $this->info("Simulating webhook for payment #{$payment->id} (source: {$payment->paymongo_source_id})...");

        $response = Http::post(url('/paymongo/webhook'), $fakePayload);

        $this->info("Response status: {$response->status()}");
        $this->line($response->body());

        return 0;
    }
}
