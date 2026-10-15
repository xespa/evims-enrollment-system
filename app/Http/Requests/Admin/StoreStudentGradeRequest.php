<?php

namespace App\Http\Requests\Admin;

use App\Concerns\TermGradeValidationRules;
use App\Models\GradeSheet;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Adding a student to a grade sheet with their term grades. Only students
 * enrolled in the sheet's subject, grade level and school year can be added,
 * and each only once.
 */
class StoreStudentGradeRequest extends FormRequest
{
    use TermGradeValidationRules;

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->gradeSheet()) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $gradeSheet = $this->gradeSheet();

        return [
            'enrollment_id' => [
                'required',
                'integer',
                Rule::unique('student_grades', 'enrollment_id')->where('grade_sheet_id', $gradeSheet->id),
                function (string $attribute, mixed $value, Closure $fail) use ($gradeSheet): void {
                    if (! $gradeSheet->gradableEnrollmentsQuery()->whereKey($value)->exists()) {
                        $fail('Choose a student enrolled in this subject.');
                    }
                },
            ],
            ...$this->termGradeRules(),
            // Comes back to this page to add the next student.
            'add_another' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'enrollment_id.required' => 'Choose a student.',
            'enrollment_id.unique' => 'This student is already on the grade sheet.',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return $this->termGradeAttributes();
    }

    private function gradeSheet(): GradeSheet
    {
        /** @var GradeSheet $gradeSheet */
        $gradeSheet = $this->route('gradeSheet');

        return $gradeSheet;
    }
}
