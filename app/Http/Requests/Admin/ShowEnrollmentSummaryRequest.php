<?php

namespace App\Http\Requests\Admin;

use App\Models\Enrollment;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Which school year the enrollment summary is for. The route's `can`
 * middleware already limits who may print it.
 */
class ShowEnrollmentSummaryRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
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
     * The requested school year, or else the current one, the same default
     * the masterlist uses.
     */
    public function schoolYear(): string
    {
        if ($this->filled('school_year')) {
            return $this->string('school_year')->toString();
        }

        return Enrollment::currentSchoolYear();
    }
}
