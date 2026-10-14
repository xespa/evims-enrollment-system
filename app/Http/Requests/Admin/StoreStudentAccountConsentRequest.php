<?php

namespace App\Http\Requests\Admin;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Asking a parent to consent to their child's student account. Nothing is
 * entered: the email goes to the parent on file, and whether the student
 * can have an account yet is checked by RequestParentConsent.
 */
class StoreStudentAccountConsentRequest extends FormRequest
{
    /**
     * Only staff who review applications; the route's middleware checks
     * the ability.
     */
    public function authorize(): bool
    {
        return $this->user() instanceof User;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [];
    }
}
