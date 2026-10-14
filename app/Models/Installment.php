<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
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

    /**
     * Installments of approved, active applications that still have money owed.
     *
     * @param  Builder<self>  $query
     */
    public function scopeOutstanding(Builder $query): void
    {
        $query->where('installments.status', '!=', 'PAID')
            ->whereHas('billingContract.enrollment', fn (Builder $enrollment) => $enrollment
                ->where('enrollment_status', 'APPROVED')
                ->whereNull('cancelled_at')
                ->whereNull('archived_at'));
    }

    /**
     * Owed and not yet due as of the given day.
     *
     * @param  Builder<self>  $query
     */
    public function scopeReceivable(Builder $query, CarbonInterface $today): void
    {
        $query->outstanding()->whereDate('installments.due_date', '>=', $today->toDateString());
    }

    /**
     * Owed and past due as of the given day.
     *
     * @param  Builder<self>  $query
     */
    public function scopeOverdue(Builder $query, CarbonInterface $today): void
    {
        $query->outstanding()->whereDate('installments.due_date', '<', $today->toDateString());
    }

    /**
     * Adds paid_amount: the completed (not voided) money paid on each installment.
     *
     * @param  Builder<self>  $query
     */
    public function scopeWithPaidAmount(Builder $query): void
    {
        $query->withSum(['payments as paid_amount' => fn (Builder $payments) => $payments->where('status', 'COMPLETED')], 'amount');
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
