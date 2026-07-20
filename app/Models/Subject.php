<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Subject extends Model
{
    protected $fillable = ['grade_level_id', 'name', 'code'];

    public function gradeLevel()
    {
        return $this->belongsTo(GradeLevel::class);
    }

    public function enrollments()
    {
        return $this->belongsToMany(Enrollment::class, 'enrollment_subject');
    }
}
