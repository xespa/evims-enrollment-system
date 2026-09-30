<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Installment extends Model
{
    protected $fillable = ['billing_contract_id', 'installment_number', 'amount_due', 'due_date', 'status'];

    protected $casts = [
        'due_date' => 'date',
        'amount_due' => 'decimal:2',
    ];

    /**
     * @return BelongsTo<BillingContract, $this>
     */
    public function billingContract(): BelongsTo
    {
        return $this->belongsTo(BillingContract::class);
    }

    /**
     * @return HasMany<Payment, $this>
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function totalPaid(): float
    {
        return (float) $this->payments()->where('status', 'COMPLETED')->sum('amount');
    }

    public function refreshStatus(): void
    {
        $paid = $this->totalPaid();

        $this->status = match (true) {
            $paid >= (float) $this->amount_due => 'PAID',
            $paid <= 0 => 'UNPAID',
            default => 'PARTIALLY_PAID',
        };

        $this->save();
    }
}
