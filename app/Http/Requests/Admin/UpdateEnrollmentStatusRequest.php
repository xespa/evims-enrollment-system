<?php

namespace App\Http\Requests\Admin;

use App\Enums\EnrollmentRejectionReason;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateEnrollmentStatusRequest extends FormRequest
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
            'enrollment_status' => ['required', 'in:PENDING,APPROVED,REJECTED'],
            'rejection_reasons' => [
                Rule::requiredIf($this->isRejecting()),
                Rule::prohibitedIf(! $this->isRejecting()),
                'array',
                'min:1',
            ],
            'rejection_reasons.*' => ['distinct', Rule::enum(EnrollmentRejectionReason::class)],
            // The admin's own note — required when none of the listed
            // reasons covers it.
            'rejection_note' => [
                Rule::requiredIf($this->isRejecting() && in_array(EnrollmentRejectionReason::Other->value, (array) $this->input('rejection_reasons', []), true)),
                'nullable',
                'string',
                'min:5',
                'max:500',
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'rejection_reasons.required' => 'Pick at least one reason — the parent is emailed why the application was rejected.',
            'rejection_reasons.min' => 'Pick at least one reason — the parent is emailed why the application was rejected.',
            'rejection_note.required' => 'Explain the other reason — the parent sees this note.',
        ];
    }

    /**
     * The chosen rejection reasons as enums.
     *
     * @return array<int, EnrollmentRejectionReason>
     */
    public function rejectionReasons(): array
    {
        return array_map(
            fn (string $reason) => EnrollmentRejectionReason::from($reason),
            $this->validated('rejection_reasons', []),
        );
    }

    public function rejectionNote(): ?string
    {
        return $this->filled('rejection_note') ? $this->string('rejection_note')->trim()->toString() : null;
    }

    private function isRejecting(): bool
    {
        return $this->input('enrollment_status') === 'REJECTED';
    }

    /**
     * An application the parent cancelled can't be approved or rejected. And
     * none can be approved until the student has an LRN — it's how the
     * student is identified in DepEd's records — and every required document
     * has a file uploaded.
     *
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                /** @var Enrollment $enrollment */
                $enrollment = $this->route('enrollment');

                if ($enrollment->isCancelled() && in_array($this->input('enrollment_status'), ['APPROVED', 'REJECTED'], true)) {
                    $validator->errors()->add(
                        'enrollment_status',
                        "This application was cancelled by the parent on {$enrollment->cancelled_at->timezone('Asia/Manila')->format('M j, Y')}, so it can't be approved or rejected.",
                    );

                    return;
                }

                if ($this->input('enrollment_status') !== 'APPROVED') {
                    return;
                }

                $enrollment->loadMissing('student', 'officeVerification');
                $studentName = "{$enrollment->student->first_name} {$enrollment->student->last_name}";

                if (blank($enrollment->student->lrn)) {
                    $validator->errors()->add(
                        'enrollment_status',
                        "{$studentName} doesn't have an LRN yet, so this application can't be approved. Assign an LRN first, then approve.",
                    );
                }

                $missingDocuments = $enrollment->missingDocumentLabels();

                if ($missingDocuments !== []) {
                    $validator->errors()->add(
                        'missing_documents',
                        "This application can't be approved yet because these documents haven't been uploaded for {$studentName}: ".implode(', ', $missingDocuments).'. Upload them or remind the parent, then approve.',
                    );
                }
            },
        ];
    }
}
