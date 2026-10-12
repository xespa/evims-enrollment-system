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

    /**
     * The grade number of "Grade 4", or null for the levels before Grade 1.
     */
    public function gradeNumber(): ?int
    {
        return preg_match('/^Grade (\d+)$/', $this->name, $matches) === 1 ? (int) $matches[1] : null;
    }

    /**
     * Grades 1–6 are Elementary and 7–10 Junior High; the levels before
     * Grade 1 (Nursery, Pre-K) are Pre-Elementary.
     */
    public function department(): string
    {
        $gradeNumber = $this->gradeNumber();

        return match (true) {
            $gradeNumber === null => 'Pre-Elementary',
            $gradeNumber <= 6 => 'Elementary',
            default => 'Junior Highschool',
        };
    }
}
