<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VitalInformation extends Model
{
    protected $table = 'vital_informations';

    protected $fillable = [
        'enrollment_id',
        'has_attended_summer_school', 'has_emotional_mental_physical_difficulties',
        'has_learning_difficulties', 'has_extended_absences',
        'shows_special_abilities_interests', 'has_been_expelled',
        'has_been_suspended', 'has_repeated_a_grade',
        'history_particulars', 'special_health_problems',
    ];

    protected $casts = [
        'has_attended_summer_school' => 'boolean',
        'has_emotional_mental_physical_difficulties' => 'boolean',
        'has_learning_difficulties' => 'boolean',
        'has_extended_absences' => 'boolean',
        'shows_special_abilities_interests' => 'boolean',
        'has_been_expelled' => 'boolean',
        'has_been_suspended' => 'boolean',
        'has_repeated_a_grade' => 'boolean',
    ];

    public function enrollment()
    {
        return $this->belongsTo(Enrollment::class);
    }
}
