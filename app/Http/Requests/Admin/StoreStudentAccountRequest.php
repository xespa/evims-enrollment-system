<?php

namespace App\Http\Requests\Admin;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Creating a student's account after their parent consented. Nothing is
 * entered: the account is bound to the student's LRN, which is also the
 * first password, and whether it can be created yet is checked by
 * CreateStudentAccount.
 */
class StoreStudentAccountRequest extends FormRequest
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
