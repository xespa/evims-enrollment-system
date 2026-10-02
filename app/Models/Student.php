<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Student extends Model
{
    use HasFactory;

    protected $fillable = [
        'lrn', 'psa_birth_cert_no', 'last_name', 'first_name',
        'middle_name', 'extension_name', 'date_of_birth', 'sex',
    ];

    protected $casts = [
        'date_of_birth' => 'date:Y-m-d',
    ];

    public function address()
    {
        return $this->hasOne(Address::class);
    }

    public function parentProfile()
    {
        return $this->hasOne(ParentProfile::class);
    }

    /**
     * @return HasMany<Enrollment, $this>
     */
    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    public function latestEnrollment()
    {
        return $this->hasOne(Enrollment::class)->latestOfMany();
    }

    public function getFullNameAttribute(): string
    {
        return trim("{$this->last_name}, {$this->first_name} {$this->middle_name} {$this->extension_name}");
    }
}
