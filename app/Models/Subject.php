<?php

namespace App\Models;

use Database\Factories\SubjectFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subject extends Model
{
    /** @use HasFactory<SubjectFactory> */
    use HasFactory;

    protected $fillable = ['curriculum_id', 'name', 'code'];

    /**
     * The grade level + school year this subject is offered in.
     *
     * @return BelongsTo<Curriculum, $this>
     */
    public function curriculum(): BelongsTo
    {
        return $this->belongsTo(Curriculum::class);
    }

    /**
     * Applications whose students can be graded in this subject: approved
     * for its grade level and school year, taking it, and not cancelled or
     * archived. Expects the curriculum to be loaded or loadable.
     *
     * @return Builder<Enrollment>
     */
    public function gradableEnrollmentsQuery(): Builder
    {
        return Enrollment::query()
            ->where('enrollments.school_year', $this->curriculum->school_year)
            ->where('enrollments.grade_level_id', $this->curriculum->grade_level_id)
            ->withStatus('APPROVED')
            ->archived(false)
            ->whereHas('subjects', fn (Builder $subjects) => $subjects->whereKey($this->id));
    }

    /**
     * Every student who can be graded in this subject, by name: who a new
     * grade sheet for it starts with.
     *
     * @return list<array{enrollment_id: int, name: string, lrn: string|null}>
     */
    public function enrolledStudents(): array
    {
        return Enrollment::studentOptions($this->gradableEnrollmentsQuery());
    }

    /**
     * Adds `enrolled_students_count`: the approved students taking the
     * subject who aren't cancelled or archived, so the ones a grade sheet
     * for it starts with (as gradableEnrollmentsQuery()).
     *
     * @param  Builder<self>  $query
     */
    public function scopeWithEnrolledStudentsCount(Builder $query): void
    {
        $query->withCount(['enrollments as enrolled_students_count' => fn (Builder $enrollments) => $enrollments
            ->where('enrollments.enrollment_status', 'APPROVED')
            ->whereNull('enrollments.cancelled_at')
            ->whereNull('enrollments.archived_at')]);
    }

    /**
     * The teachers who teach this subject.
     *
     * @return BelongsToMany<User, $this>
     */
    public function teachers(): BelongsToMany
    {
        return $this->belongsToMany(User::class)->withTimestamps();
    }

    /**
     * The grade sheets made for this subject, at most one per teacher.
     *
     * @return HasMany<GradeSheet, $this>
     */
    public function gradeSheets(): HasMany
    {
        return $this->hasMany(GradeSheet::class);
    }

    /**
     * @return BelongsToMany<Enrollment, $this>
     */
    public function enrollments(): BelongsToMany
    {
        return $this->belongsToMany(Enrollment::class, 'enrollment_subject');
    }
}
