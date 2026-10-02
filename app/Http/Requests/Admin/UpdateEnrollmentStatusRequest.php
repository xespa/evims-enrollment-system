<?php

namespace App\Http\Requests\Admin;

use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
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
        ];
    }

    /**
     * An application can't be approved until the student has an LRN —
     * it's how the student is identified in DepEd's records.
     *
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                /** @var Enrollment $enrollment */
                $enrollment = $this->route('enrollment');
                $enrollment->loadMissing('student');

                if ($this->input('enrollment_status') === 'APPROVED' && blank($enrollment->student->lrn)) {
                    $validator->errors()->add(
                        'enrollment_status',
                        "{$enrollment->student->first_name} {$enrollment->student->last_name} doesn't have an LRN yet, so this application can't be approved. Assign an LRN first, then approve.",
                    );
                }
            },
        ];
    }
}
