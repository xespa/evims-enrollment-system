<?php

namespace App\Http\Requests\Admin;

use App\Models\Curriculum;
use App\Models\Section;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Setting a grade level's sections for one school year: their names and
 * slots, adding new ones and removing empty ones. A section can't shrink
 * below, or be removed with, the students already placed in it.
 */
class UpdateCurriculumSectionsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('manage-school') ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'sections' => ['present', 'array', 'max:26'],
            'sections.*.id' => ['nullable', 'integer', 'distinct', Rule::exists('sections', 'id')->where('curriculum_id', $this->curriculum()->id)],
            'sections.*.name' => ['required', 'string', 'max:20', 'distinct:ignore_case'],
            'sections.*.slots' => ['required', 'integer', 'min:1', 'max:500'],
        ];
    }

    /**
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                $studentCounts = $this->curriculum()->sections()->withCount('students')->get()->keyBy('id');
                $keptIds = [];

                foreach ($this->input('sections', []) as $index => $section) {
                    $existing = isset($section['id']) ? $studentCounts->get((int) $section['id']) : null;

                    if ($existing === null) {
                        continue;
                    }

                    $keptIds[] = $existing->id;
                    $studentCount = (int) $existing->getAttribute('students_count');

                    if ((int) $section['slots'] < $studentCount) {
                        $validator->errors()->add("sections.{$index}.slots", "Section {$existing->name} already has {$studentCount} students, so it needs at least {$studentCount} slots.");
                    }
                }

                $studentCounts->except($keptIds)
                    ->filter(fn (Section $section): bool => $section->getAttribute('students_count') > 0)
                    ->each(fn (Section $section) => $validator->errors()->add('sections', "Section {$section->name} still has students, so it can't be removed. Move them to another section first."));
            },
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'sections.*.name.required' => 'Give every section a name.',
            'sections.*.name.distinct' => 'Each section needs its own name.',
            'sections.*.slots.required' => 'Enter how many students the section takes.',
            'sections.*.slots.min' => 'A section takes at least 1 student.',
            'sections.*.slots.max' => 'A section takes at most 500 students.',
        ];
    }

    public function curriculum(): Curriculum
    {
        /** @var Curriculum */
        return $this->route('curriculum');
    }
}
