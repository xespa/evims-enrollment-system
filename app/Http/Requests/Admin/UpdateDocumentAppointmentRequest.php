<?php

namespace App\Http\Requests\Admin;

use App\Models\EnrollmentPeriod;
use App\Models\OfficeVerification;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDocumentAppointmentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        return $user instanceof User && $user->isAdmin();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // Today at the earliest, by the school's calendar.
            'scheduled_on' => ['required', 'date_format:Y-m-d', 'after_or_equal:'.EnrollmentPeriod::today()->toDateString()],
            'scheduled_time' => ['nullable', 'date_format:H:i'],
            'documents' => ['required', 'array', 'min:1'],
            'documents.*' => ['distinct', Rule::in(array_keys(OfficeVerification::DOCUMENT_COLUMNS))],
            'note' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'scheduled_on.after_or_equal' => 'The appointment can\'t be in the past.',
            'documents.required' => 'Choose at least one document to bring.',
            'documents.min' => 'Choose at least one document to bring.',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'scheduled_on' => 'appointment date',
            'scheduled_time' => 'appointment time',
        ];
    }
}
