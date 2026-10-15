<?php

namespace App\Http\Requests\Admin;

use App\Concerns\TermGradeValidationRules;
use App\Models\StudentGrade;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Changing a student's term grades. The student on the row stays the same.
 */
class UpdateStudentGradeRequest extends FormRequest
{
    use TermGradeValidationRules;

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        /** @var StudentGrade $studentGrade */
        $studentGrade = $this->route('studentGrade');

        return $this->user()?->can('update', $studentGrade->gradeSheet) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return $this->termGradeRules();
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return $this->termGradeAttributes();
    }
}
