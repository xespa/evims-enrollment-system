<?php

namespace App\Http\Requests\Portal;

use App\Enums\AccountType;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StoreEnrolleeUserRequest extends FormRequest
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
            'account_type' => ['required', Rule::enum(AccountType::class)],
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:enrollee_users,email'],
            'password' => ['required', 'confirmed', Password::defaults()],
            // A parent or guardian confirms a student's account by email.
            'parent_email' => [
                'exclude_unless:account_type,'.AccountType::Student->value,
                ...self::parentEmailRules($this->input('email')),
            ],
            'valid_id' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
            'terms' => ['accepted'],
        ];
    }

    /**
     * The parent or guardian email a student account is confirmed through,
     * which can't be the student's own.
     *
     * @return array<int, mixed>
     */
    public static function parentEmailRules(mixed $studentEmail): array
    {
        return [
            'required',
            'string',
            'email',
            'max:255',
            function (string $attribute, mixed $value, Closure $fail) use ($studentEmail): void {
                if (is_string($studentEmail) && Str::lower(trim((string) $value)) === Str::lower(trim($studentEmail))) {
                    $fail('Enter your parent or guardian\'s email, not your own.');
                }
            },
        ];
    }

    /**
     * @return array<string, string>
     */
    public static function parentEmailMessages(): array
    {
        return [
            'parent_email.required' => 'Enter your parent or guardian\'s email so they can confirm your account.',
            'parent_email.email' => 'Enter a valid email address for your parent or guardian.',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'account_type.required' => 'Tell us whether you are a parent/guardian or a student.',
            'account_type.enum' => 'Choose either Parent / Guardian or Student.',
            'valid_id.required' => 'Attach a photo or scan of a valid government-issued ID.',
            'valid_id.mimes' => 'Your ID must be a PDF, JPG, or PNG file.',
            'valid_id.max' => 'Your ID must be 10MB or smaller.',
            'terms.accepted' => 'Please read and agree to the Terms and Conditions to create an account.',
            ...self::parentEmailMessages(),
        ];
    }
}
