<?php

namespace App\Http\Requests\Admin;

use App\Concerns\TermGradeValidationRules;
use App\Models\GradeSheet;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Saving the whole class's term grades from one table. Every row must be on
 * this grade sheet.
 */
class UpdateGradeSheetGradesRequest extends FormRequest
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
        return [
            'grades' => ['required', 'array', 'min:1'],
            'grades.*.id' => [
                'required',
                'integer',
                'distinct',
                Rule::in($this->gradeSheet()->studentGrades()->pluck('id')->all()),
            ],
            ...collect($this->termGradeRules())
                ->mapWithKeys(fn (array $rules, string $term) => ["grades.*.{$term}" => $rules])
                ->all(),
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return collect($this->termGradeAttributes())
            ->mapWithKeys(fn (string $label, string $term) => ["grades.*.{$term}" => $label])
            ->all();
    }

    private function gradeSheet(): GradeSheet
    {
        /** @var GradeSheet $gradeSheet */
        $gradeSheet = $this->route('gradeSheet');

        return $gradeSheet;
    }
}
