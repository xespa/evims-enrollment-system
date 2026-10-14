<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

/**
 * A parent's answer from the emailed consent link. The link itself is the
 * authorization; the controller checks it's still usable.
 */
class UpdateStudentAccountConsentRequest extends FormRequest
{
    public const AGREE = 'agree';

    public const DECLINE = 'decline';

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
            'decision' => ['required', Rule::in([self::AGREE, self::DECLINE])],
            'parent_name' => ['required', 'string', 'max:150'],
            'consent' => ['exclude_unless:decision,'.self::AGREE, 'accepted'],
            'password' => ['exclude_unless:decision,'.self::AGREE, 'required', 'confirmed', Password::defaults()],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'parent_name.required' => 'Enter your full name as the parent or guardian.',
            'consent.accepted' => 'Tick the box to give your consent.',
            'password.required' => 'Set the first password your child will use to sign in.',
        ];
    }

    public function agreed(): bool
    {
        return $this->validated('decision') === self::AGREE;
    }
}
