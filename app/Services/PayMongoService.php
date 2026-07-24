<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class PayMongoService
{
    protected string $secretKey;
    protected string $baseUrl = 'https://api.paymongo.com/v1';

    public function __construct()
    {
        $this->secretKey = config('services.paymongo.secret_key');
    }

    protected function client()
    {
        return Http::withBasicAuth($this->secretKey, '')
            ->acceptJson()
            ->asJson();
    }

    /**
     * Creates a GCash source. Amount must be in centavos (e.g., ₱500.00 = 50000).
     */
    public function createGcashSource(float $amountInPesos, string $successUrl, string $failedUrl, array $billing = [])
    {
        $response = $this->client()->post("{$this->baseUrl}/sources", [
            'data' => [
                'attributes' => [
                    'amount' => (int) round($amountInPesos * 100),
                    'redirect' => [
                        'success' => $successUrl,
                        'failed' => $failedUrl,
                    ],
                    'type' => 'gcash',
                    'currency' => 'PHP',
                    'billing' => $billing,
                ],
            ],
        ]);

        $response->throw();

        return $response->json('data');
    }

    public function retrieveSource(string $sourceId)
    {
        $response = $this->client()->get("{$this->baseUrl}/sources/{$sourceId}");
        $response->throw();

        return $response->json('data');
    }

    /**
     * Creates an actual Payment against a chargeable Source.
     * This is what actually moves money from the source into your PayMongo balance.
     */
    public function createPaymentFromSource(string $sourceId, float $amountInPesos, string $description = '')
    {
        $response = $this->client()->post("{$this->baseUrl}/payments", [
            'data' => [
                'attributes' => [
                    'amount' => (int) round($amountInPesos * 100),
                    'currency' => 'PHP',
                    'source' => [
                        'id' => $sourceId,
                        'type' => 'source',
                    ],
                    'description' => $description,
                ],
            ],
        ]);

        $response->throw();

        return $response->json('data');
    }
}
