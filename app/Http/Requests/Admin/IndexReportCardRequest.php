<?php

namespace App\Http\Requests\Admin;

use App\Models\Curriculum;
use App\Models\Enrollment;
use App\Models\GradeSheet;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * The school year whose grades are sent on to the year after it, or one
 * grade sheet's students (from "Send grades" on the sheet).
 */
class IndexReportCardRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        if ($user === null || ! $user->can('manage-grade-sheets')) {
            return false;
        }

        $gradeSheet = $this->gradeSheet();

        return $gradeSheet === null || $user->can('view', $gradeSheet);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'school_year' => ['nullable', 'string', 'regex:/^\d{4}-\d{4}$/'],
            'grade_sheet' => ['nullable', 'integer', Rule::exists('grade_sheets', 'id')],
        ];
    }

    /**
     * The grade sheet's school year, the chosen one, or the one before the
     * current, whose students are applying for this year.
     */
    public function schoolYear(): string
    {
        return match (true) {
            $this->gradeSheet() !== null => $this->gradeSheet()->subject->curriculum->school_year,
            $this->filled('school_year') => $this->string('school_year')->toString(),
            default => Curriculum::previousSchoolYear(Enrollment::currentSchoolYear()),
        };
    }

    /**
     * The grade sheet whose students are listed, if one was chosen.
     */
    public function gradeSheet(): ?GradeSheet
    {
        if (! is_numeric($this->query('grade_sheet'))) {
            return null;
        }

        return once(fn () => GradeSheet::query()
            ->with(GradeSheet::summaryRelations())
            ->find((int) $this->query('grade_sheet')));
    }
}
