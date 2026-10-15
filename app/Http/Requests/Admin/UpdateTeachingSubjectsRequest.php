<?php

namespace App\Http\Requests\Admin;

use App\Models\Curriculum;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Database\Query\Builder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * The full list of subjects a teacher teaches, replacing the old one. Only
 * subjects of school years the school has published can be chosen.
 */
class UpdateTeachingSubjectsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('teach-subjects') ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'subject_ids' => ['present', 'array'],
            'subject_ids.*' => [
                'integer',
                'distinct',
                Rule::exists('subjects', 'id')->where(fn (Builder $query) => $query->whereIn(
                    'curriculum_id',
                    Curriculum::query()->published()->select('id'),
                )),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'subject_ids.*.exists' => 'One of the chosen subjects isn’t offered in a published school year.',
        ];
    }
}
