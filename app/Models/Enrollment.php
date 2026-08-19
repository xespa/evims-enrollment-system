<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Enrollment extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id', 'grade_level_id', 'school_year', 'student_type',
        'date_of_application', 'age', 'session_time_preference', 'enrollment_status',
    ];

    protected $casts = [
        'date_of_application' => 'date',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function gradeLevel()
    {
        return $this->belongsTo(GradeLevel::class);
    }

    public function academicHistory()
    {
        return $this->hasOne(AcademicHistory::class);
    }

    public function vitalInformation()
    {
        return $this->hasOne(VitalInformation::class);
    }

    public function billingContract()
    {
        return $this->hasOne(BillingContract::class);
    }

    public function officeVerification()
    {
        return $this->hasOne(OfficeVerification::class);
    }

    public function subjects()
    {
        return $this->belongsToMany(Subject::class, 'enrollment_subject');
    }
}
