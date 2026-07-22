<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class BillingContract extends Model
{
    protected $fillable = ['enrollment_id', 'payment_option', 'total_fee', 'scanned_contract_url'];

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
        $intervalMonths = intdiv(10, $count);

        $startDate = Carbon::create(now()->year, 6, 15);

        for ($i = 1; $i <= $count; $i++) {
            $amount = $i === $count
                ? $this->total_fee - ($amountPerInstallment * ($count - 1))
                : $amountPerInstallment;

            $this->installments()->create([
                'installment_number' => $i,
                'amount_due' => $amount,
                'due_date' => $startDate->copy()->addMonths(($i - 1) * $intervalMonths),
                'status' => 'UNPAID',
            ]);
        }
    }
}
