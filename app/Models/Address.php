<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Address extends Model
{
    protected $fillable = [
        'student_id', 'house_number_street', 'barangay',
        'city_municipality', 'city_code', 'province', 'province_code',
        'country', 'zip_code',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
