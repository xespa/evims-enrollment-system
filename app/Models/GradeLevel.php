<?php

namespace App\Models;

use Database\Factories\GradeLevelFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A grade level (Nursery … Grade 10). Its fees and subjects live on a
 * Curriculum per school year.
 */
class GradeLevel extends Model
{
    /** @use HasFactory<GradeLevelFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'level_order',
    ];

    /**
     * @return HasMany<Curriculum, $this>
     */
    public function curricula(): HasMany
    {
        return $this->hasMany(Curriculum::class);
    }

    public function curriculumFor(string $schoolYear): ?Curriculum
    {
        return $this->curricula()->forSchoolYear($schoolYear)->first();
    }

    /**
     * @return HasMany<Enrollment, $this>
     */
    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }
}
