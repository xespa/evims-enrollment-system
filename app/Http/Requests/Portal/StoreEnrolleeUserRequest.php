<?php

namespace App\Http\Requests\Portal;

use App\Enums\AccountType;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
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
            'valid_id' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
            'terms' => ['accepted'],
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
        ];
    }
}
