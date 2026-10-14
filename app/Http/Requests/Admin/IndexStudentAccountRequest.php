<?php

namespace App\Http\Requests\Admin;

use App\Enums\StudentAccountStatus;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Filters for the list of students and their sign-in accounts. Access is
 * checked by the route's can:review-applications middleware.
 */
class IndexStudentAccountRequest extends FormRequest
{
    /** Every student, whatever their account's status. */
    public const ALL = 'ALL';

    /** Students no account has been requested for yet. */
    public const NONE = 'NONE';

    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'status' => ['nullable', Rule::in([self::ALL, self::NONE, ...array_column(StudentAccountStatus::cases(), 'value')])],
            'search' => ['nullable', 'string', 'max:100'],
        ];
    }

    public function status(): string
    {
        return $this->validated('status') ?? self::ALL;
    }
}
