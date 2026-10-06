<?php

namespace App\Http\Requests\Admin;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * The student masterlist's filters. Every one is optional, and they
 * combine: only applications matching all of them are listed.
 */
class IndexStudentRequest extends FormRequest
{
    public const SEXES = ['MALE', 'FEMALE'];

    /**
     * An application's status, where CANCELLED (withdrawn by the parent)
     * takes the place of whatever review status it had.
     */
    public const STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];

    public const STUDENT_TYPES = ['NO_LRN', 'WITH_LRN', 'RETURNEE'];

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        return $user instanceof User;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:100'],
            'school_year' => ['nullable', 'string', 'regex:/^\d{4}-\d{4}$/'],
            'grade_level_id' => ['nullable', 'integer', Rule::exists('grade_levels', 'id')],
            'sex' => ['nullable', Rule::in(self::SEXES)],
            'status' => ['nullable', Rule::in(self::STATUSES)],
            'student_type' => ['nullable', Rule::in(self::STUDENT_TYPES)],
            'archived' => ['nullable', 'boolean'],
        ];
    }
}
