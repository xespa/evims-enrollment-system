<?php

namespace App\Http\Requests\Student;

use App\Models\StudentAccount;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

/**
 * A signed-in student replacing their password. The first one is their
 * LRN, which others can know, so it can't be chosen again.
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
            'password' => [
                'required',
                'confirmed',
                Password::defaults(),
                function (string $attribute, mixed $value, Closure $fail): void {
                    /** @var StudentAccount $account */
                    $account = $this->user('student');

                    if ($value === $account->student->lrn) {
                        $fail('Choose a password other than your LRN.');
                    }
                },
            ],
        ];
    }
}
