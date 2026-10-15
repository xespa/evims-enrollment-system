<?php

namespace App\Http\Requests\Admin;

use App\Enums\StudentPasswordResetMethod;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Resetting a student's forgotten password. The route's `can` middleware
 * already limits who may do it.
 */
class UpdateStudentAccountPasswordRequest extends FormRequest
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
            'method' => ['required', Rule::enum(StudentPasswordResetMethod::class)],
        ];
    }

    public function resetMethod(): StudentPasswordResetMethod
    {
        return StudentPasswordResetMethod::from($this->string('method')->toString());
    }
}
