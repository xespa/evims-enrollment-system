<?php

namespace App\Http\Requests\Auth;

use App\Enums\AccountRole;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

/**
 * A teacher, cashier, or registrar asking for an admin panel account.
 */
class StoreStaffRegistrationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Staff sign in with a lowercased email (see fortify.lowercase_usernames).
     */
    protected function prepareForValidation(): void
    {
        $this->merge(['email' => Str::lower((string) $this->input('email'))]);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'role' => ['required', Rule::in(array_column(AccountRole::requestableStaffRoles(), 'value'))],
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'terms' => ['accepted'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'role.required' => 'Choose the role you are signing up for.',
            'role.in' => 'Choose Teacher, Cashier, or Registrar.',
            'email.unique' => 'There is already a staff account with this email.',
            'terms.accepted' => 'Please read and agree to the Terms and Conditions to create an account.',
        ];
    }
}
