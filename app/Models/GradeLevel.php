<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GradeLevel extends Model
{
    use HasFactory;

    /**
     * Monthly fees are billed across a 10-month school year, matching the
     * installment schedule in BillingContract::generateInstallments().
     */
    public const BILLABLE_MONTHS = 10;

    protected $fillable = [
        'name',
        'level_order',
        'registration_fee',
        'miscellaneous_fee',
        'monthly_tuition',
        'monthly_laboratory_fee',
        'books_fee',
        'tuition_fee',
    ];

    protected $casts = [
        'registration_fee' => 'decimal:2',
        'miscellaneous_fee' => 'decimal:2',
        'monthly_tuition' => 'decimal:2',
        'monthly_laboratory_fee' => 'decimal:2',
        'books_fee' => 'decimal:2',
        'tuition_fee' => 'decimal:2',
    ];

    /**
     * tuition_fee is the total amount billed for the school year, so it is
     * always derived from the fee breakdown rather than set independently.
     */
    protected static function booted(): void
    {
        static::saving(function (GradeLevel $gradeLevel) {
            $gradeLevel->tuition_fee = $gradeLevel->computeTotalFee();
        });
    }

    public function computeTotalFee(): float
    {
        return (float) $this->registration_fee
            + (float) $this->miscellaneous_fee
            + (float) $this->books_fee
            + self::BILLABLE_MONTHS * ((float) $this->monthly_tuition + (float) $this->monthly_laboratory_fee);
    }

    public function subjects()
    {
        return $this->hasMany(Subject::class);
    }

    public function enrollments()
    {
        return $this->hasMany(Enrollment::class);
    }
}
