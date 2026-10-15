<?php

namespace App\Http\Requests\Admin;

use App\Concerns\GradeSheetScheduleValidationRules;
use App\Enums\AccountStatus;
use App\Enums\UserRole;
use App\Models\GradeSheet;
use App\Models\Subject;
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
            // Starts the sheet with the enrolled students on it; on unless
            // the teacher unticks it.
            'add_students' => ['sometimes', 'boolean'],
            // Which of them, when the teacher unticked some; every one if
            // left out.
            'enrollment_ids' => ['sometimes', 'array'],
            'enrollment_ids.*' => ['integer', 'distinct', Rule::in($this->enrollableIds())],
        ];
    }

    /**
     * The applications of the students taking the chosen subject, who are
     * the only ones that can be put on its new sheet.
     *
     * @return list<int>
     */
    private function enrollableIds(): array
    {
        if (! $this->has('enrollment_ids')) {
            return [];
        }

        $subject = Subject::query()->with('curriculum')->find($this->integer('subject_id'));

        return $subject === null ? [] : array_column($subject->enrolledStudents(), 'enrollment_id');
    }

    /**
     * Names the sheet the teacher already has, so it can be found on the
     * Grade Sheets list.
     */
    private function duplicateSheetMessage(): string
    {
        $existingSheet = GradeSheet::query()
            ->where('subject_id', $this->integer('subject_id'))
            ->where('teacher_id', $this->integer('teacher_id'))
            ->first(['id', 'archived_at']);

        return match (true) {
            $existingSheet === null => 'This teacher already has a grade sheet for this subject.',
            $existingSheet->isArchived() => "This teacher already has a grade sheet for this subject ({$existingSheet->number}, archived). Restore it from the archive instead.",
            default => "This teacher already has a grade sheet for this subject ({$existingSheet->number}).",
        };
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'subject_id.unique' => $this->duplicateSheetMessage(),
            'teacher_id.exists' => 'Choose an active teacher.',
            'enrollment_ids.*.in' => 'One of the chosen students isn’t taking this subject.',
            ...$this->scheduleMessages(),
        ];
    }
}
