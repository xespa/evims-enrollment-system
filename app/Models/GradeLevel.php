<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GradeLevel extends Model
{
    protected $fillable = ['name', 'level_order'];

    public function subjects()
    {
        return $this->hasMany(Subject::class);
    }

    public function enrollments()
    {
        return $this->hasMany(Enrollment::class);
    }
}
