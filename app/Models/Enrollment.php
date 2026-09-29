<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Enrollment extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id', 'enrollee_user_id', 'grade_level_id', 'school_year', 'student_type',
        'date_of_application', 'age', 'session_time_preference', 'email', 'applicant_name',
        'enrollment_status', 'cancelled_at',
    ];

    protected $casts = [
        'date_of_application' => 'date',
        'cancelled_at' => 'datetime',
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

    public function enrolleeUser()
    {
        return $this->belongsTo(EnrolleeUser::class);
    }

    public function isCancelled(): bool
    {
        return $this->cancelled_at !== null;
    }

    /**
     * The PH school year runs roughly June–March, so before June we're still
     * in the one that started the previous calendar year (e.g. "2026-2027").
     * Mirrors currentSchoolYearStart() in the enrollment form.
     */
    public static function currentSchoolYear(): string
    {
        $startYear = now()->month >= 6 ? now()->year : now()->year - 1;

        return $startYear.'-'.($startYear + 1);
    }
}
