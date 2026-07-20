<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BillingContract extends Model
{
    protected $fillable = ['enrollment_id', 'payment_option', 'scanned_contract_url'];

    public function enrollment()
    {
        return $this->belongsTo(Enrollment::class);
    }
}
