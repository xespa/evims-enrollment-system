<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    protected $fillable = [
        'installment_id', 'enrollment_id', 'amount', 'method', 'receipt_number', 'status',
        'recorded_by', 'paymongo_payment_intent_id', 'paymongo_source_id', 'paid_at',
        'voided_at', 'voided_by', 'void_reason',
    ];

    protected $casts = [
        'paid_at' => 'datetime',
        'voided_at' => 'datetime',
        'amount' => 'decimal:2',
    ];

    /**
     * @return BelongsTo<Installment, $this>
     */
    public function installment(): BelongsTo
    {
        return $this->belongsTo(Installment::class);
    }

    /**
     * @return BelongsTo<Enrollment, $this>
     */
    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(Enrollment::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function voidedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'voided_by');
    }

    /**
     * Normalizes an official receipt number so "or-00123 " and "OR-00123"
     * are recognized as the same receipt.
     */
    public static function normalizeReceiptNumber(string $receiptNumber): string
    {
        return strtoupper(trim($receiptNumber));
    }

    /**
     * Counter payments still in effect under this OR number. A receipt can't
     * be recorded twice, but once every payment on it is voided (e.g. it was
     * entered on the wrong student) it can be recorded again.
     *
     * @param  Builder<self>  $query
     */
    public function scopeActiveWithReceipt(Builder $query, string $receiptNumber): void
    {
        $query->where('method', 'CASH')
            ->where('status', 'COMPLETED')
            ->where('receipt_number', self::normalizeReceiptNumber($receiptNumber));
    }
}
