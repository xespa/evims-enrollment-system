<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BillingContract extends Model
{
    /** Pays in person at the school cashier; the office records each payment. */
    public const CHANNEL_COUNTER = 'COUNTER';

    /** Pays online through GCash (PayMongo). */
    public const CHANNEL_GCASH = 'GCASH';

    public const CHANNELS = [self::CHANNEL_COUNTER, self::CHANNEL_GCASH];

    protected $fillable = ['enrollment_id', 'payment_option', 'payment_channel', 'total_fee'];

    protected $casts = [
        'total_fee' => 'decimal:2',
    ];

    /**
     * Whether the parent pays online. Counter payers never get a payment
     * link or GCash checkout; the cashier records their payments instead.
     */
    public function paysOnline(): bool
    {
        return $this->payment_channel === self::CHANNEL_GCASH;
    }

    /**
     * What's still owed across all installments.
     */
    public function remainingBalance(): float
    {
        return round(
            $this->installments->sum(fn (Installment $installment) => max(0, (float) $installment->amount_due - $installment->totalPaid())),
            2,
        );
    }

    /**
     * @return BelongsTo<Enrollment, $this>
     */
    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(Enrollment::class);
    }

    /**
     * @return HasMany<Installment, $this>
     */
    public function installments(): HasMany
    {
        return $this->hasMany(Installment::class);
    }

    /**
     * Generates the installment schedule based on payment_option and total_fee.
     * Assumes a 10-month school year starting June.
     */
    public function generateInstallments(): void
    {
        $counts = [
            'FULL_PAYMENT' => 1,
            'BI_MONTHLY' => 5,
            'MONTHLY' => 10,
        ];

        $count = $counts[$this->payment_option] ?? 1;
        $amountPerInstallment = round($this->total_fee / $count, 2);

        // PayMongo (and most PH payment gateways) reject transactions below ~₱20.
        // If the chosen plan would produce installments too small to actually pay
        // online, fall back to fewer, larger installments instead of silently failing later.
        $minInstallmentAmount = 100.00;

        if ($amountPerInstallment < $minInstallmentAmount) {
            $count = max(1, (int) floor($this->total_fee / $minInstallmentAmount));
            $amountPerInstallment = round($this->total_fee / $count, 2);
        }

        $intervalMonths = intdiv(10, $count) ?: 10;
        $startDate = Carbon::create(now()->year, 6, 15);

        foreach (self::splitIntoInstallments((float) $this->total_fee, $count) as $number => $amount) {
            $this->installments()->create([
                'installment_number' => $number,
                'amount_due' => $amount,
                'due_date' => $startDate->copy()->addMonths(($number - 1) * $intervalMonths),
                'status' => 'UNPAID',
            ]);
        }
    }

    /**
     * Splits a total into equal installments keyed by installment number,
     * with the last one absorbing any rounding difference.
     *
     * @return array<int, float>
     */
    protected static function splitIntoInstallments(float $total, int $count): array
    {
        $count = max(1, $count);
        $amountPerInstallment = round($total / $count, 2);
        $amounts = [];

        for ($number = 1; $number <= $count; $number++) {
            $amounts[$number] = $number === $count
                ? round($total - ($amountPerInstallment * ($count - 1)), 2)
                : $amountPerInstallment;
        }

        return $amounts;
    }
}
