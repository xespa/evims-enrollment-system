<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AcademicHistory extends Model
{
    protected $fillable = [
        'enrollment_id', 'last_grade_level_completed', 'last_school_year_completed',
        'previous_school_name', 'previous_school_id', 'previous_school_address',
    ];

    public function enrollment()
    {
        return $this->belongsTo(Enrollment::class);
    }
}
