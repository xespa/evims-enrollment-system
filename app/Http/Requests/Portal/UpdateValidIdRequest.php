<?php

namespace App\Http\Requests\Portal;

use App\Models\EnrolleeUser;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateValidIdRequest extends FormRequest
{
    /**
     * Only an account that was not approved needs to send a new ID — and
     * only when a new ID is enough to fix what was wrong.
     */
    public function authorize(): bool
    {
        $enrollee = $this->user('enrollee');

        return $enrollee instanceof EnrolleeUser
            && ! $enrollee->isApproved()
            && ! $enrollee->needsFullSignup();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'valid_id' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'valid_id.required' => 'Choose a photo or scan of your valid ID.',
            'valid_id.mimes' => 'Your ID must be a PDF, JPG, or PNG file.',
            'valid_id.max' => 'Your ID must be 10MB or smaller.',
        ];
    }
}
