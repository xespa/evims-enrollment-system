<?php

namespace App\Http\Requests\Student;

use App\Models\StudentAccount;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

/**
 * A signed-in student replacing the first password their parent set.
 */
class UpdatePasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user('student') instanceof StudentAccount;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'current_password' => ['required', 'current_password:student'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ];
    }
}
