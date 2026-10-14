<?php

namespace App\Http\Requests\Portal;

use App\Models\EnrolleeUser;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * A student sending the parent confirmation again, to the same or a
 * corrected parent or guardian email.
 */
class UpdateParentEmailRequest extends FormRequest
{
    /**
     * Only student accounts still waiting on (or refused by) a parent.
     */
    public function authorize(): bool
    {
        $student = $this->user('enrollee');

        return $student instanceof EnrolleeUser && $student->needsParentConfirmation();
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'parent_email' => StoreEnrolleeUserRequest::parentEmailRules($this->user('enrollee')->email),
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return StoreEnrolleeUserRequest::parentEmailMessages();
    }
}
