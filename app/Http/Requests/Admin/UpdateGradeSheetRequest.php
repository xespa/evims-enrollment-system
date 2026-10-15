<?php

namespace App\Http\Requests\Admin;

use App\Concerns\GradeSheetScheduleValidationRules;
use App\Models\GradeSheet;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Changing when a grade sheet's class meets. The subject and teacher stay,
 * since the students' grades belong to them.
 */
class UpdateGradeSheetRequest extends FormRequest
{
    use GradeSheetScheduleValidationRules;

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        /** @var GradeSheet $gradeSheet */
        $gradeSheet = $this->route('gradeSheet');

        return $this->user()?->can('update', $gradeSheet) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return $this->scheduleRules();
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return $this->scheduleMessages();
    }
}
