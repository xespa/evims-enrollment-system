<?php

namespace App\Http\Requests\Student;

use App\Enums\StudentAccountStatus;
use App\Http\Requests\StoreEnrollmentRequest;
use App\Models\StudentAccount;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * A student signing in with their LRN and password.
 */
class LoginRequest extends FormRequest
{
    /** Failed attempts allowed per LRN and IP before a short lockout. */
    private const MAX_ATTEMPTS = 5;

    public function authorize(): bool
    {
        return true;
    }

    /**
     * Accepts the LRN typed with spaces or dashes.
     */
    protected function prepareForValidation(): void
    {
        $this->merge(['lrn' => StoreEnrollmentRequest::normalizeLrn($this->input('lrn'))]);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'lrn' => ['required', 'regex:'.StoreEnrollmentRequest::LRN_PATTERN],
            'password' => ['required', 'string'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'lrn.regex' => 'Enter the LRN printed on your report card.',
        ];
    }

    /**
     * The active account with this LRN and password. Accounts still waiting
     * on consent, or declined, can't sign in.
     *
     * @throws ValidationException
     */
    public function authenticatedAccount(): StudentAccount
    {
        $this->ensureIsNotRateLimited();

        $account = StudentAccount::query()
            ->where('status', StudentAccountStatus::Active)
            ->whereHas('student', fn ($student) => $student->where('lrn', $this->validated('lrn')))
            ->first();

        if (! $account || ! Hash::check($this->validated('password'), (string) $account->password)) {
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'lrn' => 'That LRN and password don\'t match an active student account.',
            ]);
        }

        RateLimiter::clear($this->throttleKey());

        return $account;
    }

    /**
     * @throws ValidationException
     */
    private function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), self::MAX_ATTEMPTS)) {
            return;
        }

        event(new Lockout($this));

        throw ValidationException::withMessages([
            'lrn' => 'Too many sign-in attempts. Try again in '.RateLimiter::availableIn($this->throttleKey()).' seconds.',
        ]);
    }

    private function throttleKey(): string
    {
        return Str::transliterate($this->string('lrn')->toString().'|'.$this->ip());
    }
}
