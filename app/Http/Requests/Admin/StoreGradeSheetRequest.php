<?php

namespace App\Http\Requests\Admin;

use App\Concerns\GradeSheetScheduleValidationRules;
use App\Enums\AccountStatus;
use App\Enums\UserRole;
use App\Models\GradeSheet;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Starting a grade sheet for one subject. A teacher's sheet is always their
 * own; an admin picks which teacher it belongs to.
 */
class StoreGradeSheetRequest extends FormRequest
{
    use GradeSheetScheduleValidationRules;

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('create', GradeSheet::class) ?? false;
    }

    protected function prepareForValidation(): void
    {
        $user = $this->user();

        if ($user instanceof User && ! $user->isAdmin()) {
            $this->merge(['teacher_id' => $user->id]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'subject_id' => [
                'required',
                'integer',
                Rule::exists('subjects', 'id'),
                Rule::unique('grade_sheets', 'subject_id')->where('teacher_id', $this->integer('teacher_id')),
            ],
            'teacher_id' => [
                'required',
                'integer',
                Rule::exists('users', 'id')
                    ->where('role', UserRole::Teacher->value)
                    ->where('account_status', AccountStatus::Approved->value)
                    ->whereNull('deactivated_at'),
            ],
            ...$this->scheduleRules(),
            // Starts the sheet with every enrolled student on it; on unless
            // the teacher unticks it.
            'add_students' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'subject_id.unique' => 'This teacher already has a grade sheet for this subject.',
            'teacher_id.exists' => 'Choose an active teacher.',
            ...$this->scheduleMessages(),
        ];
    }
}
