<?php

namespace App\Http\Requests\Admin;

use App\Models\GradeSheet;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Adding several students to a grade sheet at once (or the whole class),
 * with their grades entered afterwards. Each must be enrolled in the
 * sheet's subject that school year and not already on it.
 */
class StoreGradeSheetStudentsRequest extends FormRequest
{
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
        return [
            'enrollment_ids' => ['required', 'array', 'min:1'],
            'enrollment_ids.*' => [
                'integer',
                'distinct',
                Rule::in(array_column($this->gradeSheet()->ungradedStudents(), 'enrollment_id')),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'enrollment_ids.required' => 'Choose at least one student.',
            'enrollment_ids.*.in' => 'One of the chosen students is already on the grade sheet or isn’t taking this subject.',
        ];
    }

    private function gradeSheet(): GradeSheet
    {
        /** @var GradeSheet $gradeSheet */
        $gradeSheet = $this->route('gradeSheet');

        return $gradeSheet;
    }
}
