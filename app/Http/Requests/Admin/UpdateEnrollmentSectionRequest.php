<?php

namespace App\Http\Requests\Admin;

use App\Models\Enrollment;
use App\Models\Section;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Placing an approved student in one of their grade level's sections for
 * that school year (or taking them out of it), as long as it has room.
 */
class UpdateEnrollmentSectionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('review-applications') ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'section_id' => [
                'nullable',
                'integer',
                Rule::in($this->enrollment()->offeredSections()->modelKeys()),
            ],
        ];
    }

    /**
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $enrollment = $this->enrollment();

                if ($enrollment->enrollment_status !== 'APPROVED' || $enrollment->isCancelled()) {
                    $validator->errors()->add('section_id', 'Only approved students can be placed in a section.');

                    return;
                }

                $section = $this->filled('section_id') ? Section::find($this->integer('section_id')) : null;

                if ($section === null || $section->id === $enrollment->section_id) {
                    return;
                }

                if ($section->students()->count() >= $section->slots) {
                    $validator->errors()->add('section_id', "Section {$section->name} is full ({$section->slots} of {$section->slots} slots taken). Choose another section or add slots to it.");
                }
            },
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'section_id.in' => 'Choose one of this grade level\'s sections for the school year.',
        ];
    }

    public function enrollment(): Enrollment
    {
        /** @var Enrollment */
        return $this->route('enrollment');
    }
}
