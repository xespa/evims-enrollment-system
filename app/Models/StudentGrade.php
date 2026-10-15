<?php

namespace App\Models;

use Database\Factories\StudentGradeFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One student's three term grades on a grade sheet.
 *
 * @property int $id
 * @property int $grade_sheet_id
 * @property int $enrollment_id
 * @property string|null $term_1
 * @property string|null $term_2
 * @property string|null $term_3
 */
class StudentGrade extends Model
{
    /** @use HasFactory<StudentGradeFactory> */
    use HasFactory;

    public const TERMS = ['term_1', 'term_2', 'term_3'];

    /**
     * DepEd's lowest passing final grade.
     */
    public const PASSING_GRADE = 75;

    protected $fillable = ['enrollment_id', 'term_1', 'term_2', 'term_3'];

    protected $casts = [
        'term_1' => 'decimal:2',
        'term_2' => 'decimal:2',
        'term_3' => 'decimal:2',
    ];

    /**
     * @return BelongsTo<GradeSheet, $this>
     */
    public function gradeSheet(): BelongsTo
    {
        return $this->belongsTo(GradeSheet::class);
    }

    /**
     * @return BelongsTo<Enrollment, $this>
     */
    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(Enrollment::class);
    }

    /**
     * The average of the three terms, or null until all three are in.
     */
    public function finalGrade(): ?float
    {
        $grades = [$this->term_1, $this->term_2, $this->term_3];

        if (in_array(null, $grades, true)) {
            return null;
        }

        return round(array_sum(array_map('floatval', $grades)) / count($grades), 2);
    }

    /**
     * "Passed" or "Failed" once there's a final grade.
     */
    public function remarks(): ?string
    {
        $finalGrade = $this->finalGrade();

        if ($finalGrade === null) {
            return null;
        }

        return $finalGrade >= self::PASSING_GRADE ? 'Passed' : 'Failed';
    }

    /**
     * The row as the grade sheet pages and print-out show it. Expects
     * enrollment.student to be loaded.
     *
     * @return array{id: int, enrollment_id: int, student_name: string, lrn: string|null, term_1: string|null, term_2: string|null, term_3: string|null, final_grade: float|null, remarks: string|null}
     */
    public function row(): array
    {
        return [
            'id' => $this->id,
            'enrollment_id' => $this->enrollment_id,
            'student_name' => $this->enrollment->student->full_name,
            'lrn' => $this->enrollment->student->lrn,
            'term_1' => $this->term_1,
            'term_2' => $this->term_2,
            'term_3' => $this->term_3,
            'final_grade' => $this->finalGrade(),
            'remarks' => $this->remarks(),
        ];
    }
}
