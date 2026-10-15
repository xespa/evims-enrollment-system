<?php

namespace App\Models;

use App\Enums\ParentInfoType;
use Illuminate\Database\Eloquent\Model;

class ParentProfile extends Model
{
    public const FATHER_FIELDS = [
        'father_last_name', 'father_first_name', 'father_middle_name',
        'father_occupation', 'father_name_of_office', 'father_mobile_no',
    ];

    public const MOTHER_FIELDS = [
        'mother_maiden_last_name', 'mother_first_name', 'mother_middle_name',
        'mother_occupation', 'mother_name_of_office', 'mother_mobile_no',
    ];

    public const GUARDIAN_FIELDS = [
        'guardian_last_name', 'guardian_first_name', 'guardian_middle_name', 'guardian_relationship',
        'guardian_occupation', 'guardian_name_of_office', 'guardian_mobile_no',
    ];

    protected $fillable = [
        'student_id',
        'info_type',
        ...self::FATHER_FIELDS,
        ...self::MOTHER_FIELDS,
        ...self::GUARDIAN_FIELDS,
    ];

    protected $casts = [
        'info_type' => ParentInfoType::class,
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    /**
     * Whose details were given: a guardian's, or else the parents'.
     */
    public function isGuardian(): bool
    {
        return $this->info_type === ParentInfoType::Guardian;
    }

    /**
     * A number to reach the family on, in the order the school would call.
     */
    public function contactMobileNo(): ?string
    {
        return $this->isGuardian()
            ? $this->guardian_mobile_no
            : ($this->father_mobile_no ?? $this->mother_mobile_no);
    }
}
