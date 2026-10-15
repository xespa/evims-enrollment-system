<?php

namespace App\Http\Requests\Admin;

use App\Models\Curriculum;
use App\Models\Enrollment;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * The school year whose grades are sent on to the year after it.
 */
class IndexReportCardRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('manage-grade-sheets') ?? false;
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
        ];
    }

    /**
     * The chosen school year, or the one before the current, whose students
     * are applying for this year.
     */
    public function schoolYear(): string
    {
        return $this->filled('school_year')
            ? $this->string('school_year')->toString()
            : Curriculum::previousSchoolYear(Enrollment::currentSchoolYear());
    }
}
