<?php

namespace App\Models;

use Database\Factories\CurriculumFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * What one grade level offers in one school year: its fees and subjects.
 * A new school year gets its own copy, so changing it never affects the
 * applications (or bills) of earlier years.
 */
class Curriculum extends Model
{
    /** @use HasFactory<CurriculumFactory> */
    use HasFactory;

    /**
     * Monthly fees are billed across a 10-month school year, matching the
     * installment schedule in BillingContract::generateInstallments().
     */
    public const BILLABLE_MONTHS = 10;

    public const FEE_FIELDS = [
        'registration_fee',
        'miscellaneous_fee',
        'monthly_tuition',
        'monthly_laboratory_fee',
        'books_fee',
    ];

    protected $table = 'curricula';

    protected $fillable = [
        'grade_level_id',
        'school_year',
        'is_draft',
        'registration_fee',
        'miscellaneous_fee',
        'monthly_tuition',
        'monthly_laboratory_fee',
        'books_fee',
        'tuition_fee',
    ];

    protected $casts = [
        'is_draft' => 'boolean',
        'registration_fee' => 'decimal:2',
        'miscellaneous_fee' => 'decimal:2',
        'monthly_tuition' => 'decimal:2',
        'monthly_laboratory_fee' => 'decimal:2',
        'books_fee' => 'decimal:2',
        'tuition_fee' => 'decimal:2',
    ];

    /**
     * tuition_fee is the total amount billed for the school year, so it is
     * always derived from the fee breakdown rather than set independently.
     */
    protected static function booted(): void
    {
        static::saving(function (Curriculum $curriculum) {
            $curriculum->tuition_fee = $curriculum->computeTotalFee();
        });
    }

    public function computeTotalFee(): float
    {
        return (float) $this->registration_fee
            + (float) $this->miscellaneous_fee
            + (float) $this->books_fee
            + self::BILLABLE_MONTHS * ((float) $this->monthly_tuition + (float) $this->monthly_laboratory_fee);
    }

    /**
     * @return BelongsTo<GradeLevel, $this>
     */
    public function gradeLevel(): BelongsTo
    {
        return $this->belongsTo(GradeLevel::class);
    }

    /**
     * @return HasMany<Subject, $this>
     */
    public function subjects(): HasMany
    {
        return $this->hasMany(Subject::class);
    }

    /**
     * Applications for this grade level and school year — the ones whose
     * price and subjects came from this curriculum.
     *
     * (Not a relation: enrollments link by grade level + school year.)
     *
     * @return Builder<Enrollment>
     */
    public function enrollmentsQuery(): Builder
    {
        return Enrollment::query()
            ->where('grade_level_id', $this->grade_level_id)
            ->where('school_year', $this->school_year);
    }

    /**
     * @param  Builder<self>  $query
     */
    public function scopeForSchoolYear(Builder $query, string $schoolYear): void
    {
        $query->where('school_year', $schoolYear);
    }

    /**
     * Saved school years, open for enrollment. A draft (a newly set-up year
     * still being reviewed) isn't offered to applicants until it's saved.
     *
     * @param  Builder<self>  $query
     */
    public function scopePublished(Builder $query): void
    {
        $query->where('is_draft', false);
    }

    /**
     * The one school year new applications are for: the newest the school
     * has published, as long as it isn't older than last school year.
     */
    public static function applicationSchoolYear(): ?string
    {
        $startYear = (int) explode('-', Enrollment::currentSchoolYear())[0] - 1;

        $schoolYear = self::query()
            ->published()
            ->where('school_year', '>=', $startYear.'-'.($startYear + 1))
            ->max('school_year');

        return $schoolYear === null ? null : (string) $schoolYear;
    }

    /**
     * The school year currently being set up, if any. Only one at a time.
     */
    public static function draftSchoolYear(): ?string
    {
        $schoolYear = self::query()->where('is_draft', true)->value('school_year');

        return $schoolYear === null ? null : (string) $schoolYear;
    }

    /**
     * Every school year that has been set up, oldest first.
     *
     * @return list<string>
     */
    public static function schoolYears(): array
    {
        return array_values(self::query()
            ->distinct()
            ->orderBy('school_year')
            ->pluck('school_year')
            ->map(fn (mixed $schoolYear) => (string) $schoolYear)
            ->all());
    }

    /**
     * The school year right after the given one, e.g. "2026-2027" → "2027-2028".
     */
    public static function nextSchoolYear(string $schoolYear): string
    {
        $start = (int) explode('-', $schoolYear)[0] + 1;

        return $start.'-'.($start + 1);
    }
}
