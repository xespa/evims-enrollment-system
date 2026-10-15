<?php

namespace App\Models;

use Database\Factories\GradeSheetFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * A teacher's term grades for one subject. The subject belongs to one grade
 * level's curriculum for one school year, so that's who the sheet covers.
 *
 * @property int $id
 * @property int $subject_id
 * @property int $teacher_id
 * @property int|null $created_by
 * @property list<string>|null $schedule_days
 * @property string|null $start_time
 * @property string|null $end_time
 * @property Carbon|null $archived_at
 * @property int|null $archived_by
 * @property-read string $number
 */
class GradeSheet extends Model
{
    /** @use HasFactory<GradeSheetFactory> */
    use HasFactory;

    /**
     * The school days a class can meet on, in order, with how they print.
     */
    public const SCHEDULE_DAYS = [
        'MON' => 'Mon',
        'TUE' => 'Tue',
        'WED' => 'Wed',
        'THU' => 'Thu',
        'FRI' => 'Fri',
        'SAT' => 'Sat',
    ];

    protected $fillable = ['subject_id', 'teacher_id', 'created_by', 'schedule_days', 'start_time', 'end_time'];

    protected $casts = [
        'schedule_days' => 'array',
        'archived_at' => 'datetime',
    ];

    /**
     * @return BelongsTo<Subject, $this>
     */
    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    /**
     * Who made the grade sheet: its teacher, or an admin making it for them.
     *
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * @return HasMany<StudentGrade, $this>
     */
    public function studentGrades(): HasMany
    {
        return $this->hasMany(StudentGrade::class);
    }

    /**
     * The grade sheet number, e.g. "GS-00012". Taken from the ID, so it is
     * unique and never has to be typed in.
     */
    public function getNumberAttribute(): string
    {
        return 'GS-'.str_pad((string) $this->id, 5, '0', STR_PAD_LEFT);
    }

    /**
     * When the class meets, e.g. "Mon, Wed, Fri · 8:00 AM – 9:00 AM", or
     * null until a schedule is set.
     */
    public function scheduleLabel(): ?string
    {
        $days = collect(self::SCHEDULE_DAYS)
            ->only($this->schedule_days ?? [])
            ->implode(', ');

        $time = $this->start_time !== null && $this->end_time !== null
            ? Carbon::parse($this->start_time)->format('g:i A').' – '.Carbon::parse($this->end_time)->format('g:i A')
            : '';

        $label = collect([$days, $time])->filter()->implode(' · ');

        return $label === '' ? null : $label;
    }

    public function isArchived(): bool
    {
        return $this->archived_at !== null;
    }

    /**
     * Takes the sheet out of use without deleting it: it leaves the list,
     * can't be edited, and its grades stop counting until it's restored.
     */
    public function archive(User $user): void
    {
        $this->forceFill([
            'archived_at' => now(),
            'archived_by' => $user->id,
        ])->save();
    }

    public function restoreFromArchive(): void
    {
        $this->forceFill([
            'archived_at' => null,
            'archived_by' => null,
        ])->save();
    }

    /**
     * Only archived sheets, or with `false`, only those still in use.
     *
     * @param  Builder<self>  $query
     */
    public function scopeArchived(Builder $query, bool $archived = true): void
    {
        $archived
            ? $query->whereNotNull('grade_sheets.archived_at')
            : $query->whereNull('grade_sheets.archived_at');
    }

    /**
     * Sheets the given staff member keeps: a teacher's own, or every sheet
     * for an admin.
     *
     * @param  Builder<self>  $query
     */
    public function scopeVisibleTo(Builder $query, User $user): void
    {
        $query->when(! $user->isAdmin(), fn (Builder $query) => $query->where('teacher_id', $user->id));
    }

    /**
     * @param  Builder<self>  $query
     */
    public function scopeForSchoolYear(Builder $query, string $schoolYear): void
    {
        $query->whereHas('subject.curriculum', fn (Builder $curriculum) => $curriculum->where('school_year', $schoolYear));
    }

    /**
     * Applications whose students can be graded on this sheet: those taking
     * its subject (see Subject::gradableEnrollmentsQuery()).
     *
     * @return Builder<Enrollment>
     */
    public function gradableEnrollmentsQuery(): Builder
    {
        return $this->subject->gradableEnrollmentsQuery();
    }

    /**
     * Students who can be graded on this sheet but aren't on it yet, by name.
     *
     * @return list<array{enrollment_id: int, name: string, lrn: string|null}>
     */
    public function ungradedStudents(): array
    {
        return Enrollment::studentOptions($this->gradableEnrollmentsQuery()
            ->whereDoesntHave('studentGrades', fn (Builder $studentGrades) => $studentGrades->where('grade_sheet_id', $this->id)));
    }

    /**
     * Puts the given students on the sheet, with no grades. Returns how many
     * were added.
     *
     * @param  list<int|string>  $enrollmentIds
     */
    public function addStudents(array $enrollmentIds): int
    {
        $this->studentGrades()->createMany(
            array_map(fn (int|string $enrollmentId): array => ['enrollment_id' => (int) $enrollmentId], $enrollmentIds),
        );

        return count($enrollmentIds);
    }

    /**
     * Puts every student who can be graded on the sheet but isn't on it yet
     * onto it, with no grades. Returns how many were added.
     */
    public function addEveryUngradedStudent(): int
    {
        return $this->addStudents(array_column($this->ungradedStudents(), 'enrollment_id'));
    }

    /**
     * Every student's row, by name, as the pages and print-out show them.
     *
     * @return list<array{id: int, enrollment_id: int, student_name: string, lrn: string|null, term_1: string|null, term_2: string|null, term_3: string|null, final_grade: float|null, remarks: string|null}>
     */
    public function studentGradeRows(): array
    {
        $this->loadMissing('studentGrades.enrollment.student');

        return array_values($this->studentGrades
            ->sortBy(fn (StudentGrade $studentGrade) => $studentGrade->enrollment->student->full_name)
            ->map(fn (StudentGrade $studentGrade) => $studentGrade->row())
            ->all());
    }

    /**
     * What the grade sheet pages show about the sheet itself. Load
     * summaryRelations() first so this doesn't query per sheet.
     *
     * @return array{id: int, number: string, subject: string, subject_code: string|null, grade_level: string, school_year: string, teacher: string, prepared_by: string|null, schedule: string|null, schedule_days: list<string>, start_time: string|null, end_time: string|null, archived_at: string|null}
     */
    public function summary(): array
    {
        return [
            'id' => $this->id,
            'number' => $this->number,
            'subject' => $this->subject->name,
            'subject_code' => $this->subject->code,
            'grade_level' => $this->subject->curriculum->gradeLevel->name,
            'school_year' => $this->subject->curriculum->school_year,
            'teacher' => $this->teacher->name,
            'prepared_by' => $this->creator?->name,
            'schedule' => $this->scheduleLabel(),
            // The parts, for editing the schedule ("08:00", not "08:00:00").
            'schedule_days' => $this->schedule_days ?? [],
            'start_time' => $this->start_time !== null ? substr($this->start_time, 0, 5) : null,
            'end_time' => $this->end_time !== null ? substr($this->end_time, 0, 5) : null,
            'archived_at' => $this->archived_at?->toIso8601String(),
        ];
    }

    /**
     * What summary() needs, for eager loading.
     *
     * @return list<string>
     */
    public static function summaryRelations(): array
    {
        return ['subject.curriculum.gradeLevel', 'teacher:id,name', 'creator:id,name'];
    }
}
