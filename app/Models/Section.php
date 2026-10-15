<?php

namespace App\Models;

use Database\Factories\SectionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * One of a grade level's classes (A, B, C…) in one school year, and how
 * many students it takes. Staff place approved students in a section;
 * together the sections' slots cap how many can apply for the grade level.
 *
 * @property int $id
 * @property int $curriculum_id
 * @property string $name
 * @property int $slots
 */
class Section extends Model
{
    /** @use HasFactory<SectionFactory> */
    use HasFactory;

    /**
     * The sections every grade level starts a new school year with.
     */
    public const DEFAULT_NAMES = ['A', 'B', 'C'];

    public const DEFAULT_SLOTS = 30;

    protected $fillable = ['name', 'slots'];

    protected $casts = [
        'slots' => 'integer',
    ];

    /**
     * @return BelongsTo<Curriculum, $this>
     */
    public function curriculum(): BelongsTo
    {
        return $this->belongsTo(Curriculum::class);
    }

    /**
     * Every application placed in this section, including ones since
     * cancelled or rejected; see students() for those that take a slot.
     *
     * @return HasMany<Enrollment, $this>
     */
    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    /**
     * The students placed in this section who are taking one of its slots.
     *
     * @return HasMany<Enrollment, $this>
     */
    public function students(): HasMany
    {
        return $this->enrollments()->holdingSlot();
    }
}
