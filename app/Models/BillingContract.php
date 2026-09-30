<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

class BillingContract extends Model
{
    protected $fillable = ['enrollment_id', 'payment_option', 'payment_channel', 'total_fee'];

    protected $casts = [
        'total_fee' => 'decimal:2',
    ];

    public function enrollment()
    {
        return $this->belongsTo(Enrollment::class);
    }

    public function installments()
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
