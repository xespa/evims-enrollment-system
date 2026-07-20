<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ParentProfile extends Model
{
    protected $fillable = [
        'student_id',
        'father_last_name', 'father_first_name', 'father_middle_name',
        'father_occupation', 'father_name_of_office', 'father_mobile_no',
        'mother_maiden_last_name', 'mother_first_name', 'mother_middle_name',
        'mother_occupation', 'mother_name_of_office', 'mother_mobile_no',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
