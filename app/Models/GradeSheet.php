<?php

namespace App\Models;

use Database\Factories\GradeSheetFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A teacher's term grades for one subject. The subject belongs to one grade
 * level's curriculum for one school year, so that's who the sheet covers.
 *
 * @property int $id
 * @property int $subject_id
 * @property int $teacher_id
 * @property-read string $number
 */
class GradeSheet extends Model
{
    /** @use HasFactory<GradeSheetFactory> */
    use HasFactory;

    protected $fillable = ['subject_id', 'teacher_id'];

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
     * Applications whose students can be graded on this sheet: approved for
     * the subject's grade level and school year, taking the subject, and
     * not cancelled or archived.
     *
     * @return Builder<Enrollment>
     */
    public function gradableEnrollmentsQuery(): Builder
    {
        $curriculum = $this->subject->curriculum;

        return Enrollment::query()
            ->where('enrollments.school_year', $curriculum->school_year)
            ->where('enrollments.grade_level_id', $curriculum->grade_level_id)
            ->withStatus('APPROVED')
            ->archived(false)
            ->whereHas('subjects', fn (Builder $subjects) => $subjects->whereKey($this->subject_id));
    }

    /**
     * Students who can be graded on this sheet but aren't on it yet, by name.
     *
     * @return list<array{enrollment_id: int, name: string, lrn: string|null}>
     */
    public function ungradedStudents(): array
    {
        return array_values($this->gradableEnrollmentsQuery()
            ->whereDoesntHave('studentGrades', fn (Builder $studentGrades) => $studentGrades->where('grade_sheet_id', $this->id))
            ->join('students', 'students.id', '=', 'enrollments.student_id')
            ->orderBy('students.last_name')
            ->orderBy('students.first_name')
            ->select('enrollments.*')
            ->with('student')
            ->get()
            ->map(fn (Enrollment $enrollment) => [
                'enrollment_id' => $enrollment->id,
                'name' => $enrollment->student->full_name,
                'lrn' => $enrollment->student->lrn,
            ])
            ->all());
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
     * @return array{id: int, number: string, subject: string, grade_level: string, school_year: string, teacher: string}
     */
    public function summary(): array
    {
        return [
            'id' => $this->id,
            'number' => $this->number,
            'subject' => $this->subject->name,
            'grade_level' => $this->subject->curriculum->gradeLevel->name,
            'school_year' => $this->subject->curriculum->school_year,
            'teacher' => $this->teacher->name,
        ];
    }

    /**
     * What summary() needs, for eager loading.
     *
     * @return list<string>
     */
    public static function summaryRelations(): array
    {
        return ['subject.curriculum.gradeLevel', 'teacher:id,name'];
    }
}
