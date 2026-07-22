<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = [
        'installment_id', 'enrollment_id', 'amount', 'method', 'status',
        'recorded_by', 'paymongo_payment_intent_id', 'paymongo_source_id', 'paid_at',
    ];

    protected $casts = [
        'paid_at' => 'datetime',
        'amount' => 'decimal:2',
    ];

    public function installment()
    {
        return $this->belongsTo(Installment::class);
    }

    public function enrollment()
    {
        return $this->belongsTo(Enrollment::class);
    }

    public function recordedBy()
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
