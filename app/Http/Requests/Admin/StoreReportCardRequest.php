<?php

namespace App\Http\Requests\Admin;

use App\Actions\GradeSheets\SendGradesToNextApplication;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * Sending chosen students' grades on to their next school year. Each must
 * be one the staff member grades, have applied for the next year, and have
 * a final grade in every learning area.
 */
class StoreReportCardRequest extends FormRequest
{
    /** @var Collection<int, Enrollment>|null */
    private ?Collection $enrollments = null;

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        return $user instanceof User
            && $user->can('manage-grade-sheets')
            && $user->can('upload-document', 'form_138');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'school_year' => ['required', 'string', 'regex:/^\d{4}-\d{4}$/'],
            'enrollment_ids' => ['required', 'array', 'min:1', 'max:500'],
            'enrollment_ids.*' => ['integer', 'distinct'],
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

                $enrollments = $this->enrollments();

                if ($enrollments->count() !== count($this->input('enrollment_ids'))) {
                    $validator->errors()->add('enrollment_ids', 'Some of these students can\'t be sent: they aren\'t on your grade sheets for the year, or haven\'t applied for the next one.');

                    return;
                }

                foreach ($enrollments as $enrollment) {
                    $missing = $enrollment->subjectsWithoutFinalGrade();

                    if ($missing !== []) {
                        $validator->errors()->add('enrollment_ids', "{$enrollment->student->full_name} has no final grade yet in ".implode(', ', $missing).'.');
                    }
                }
            },
        ];
    }

    /**
     * The chosen students' applications for the school year, with what
     * sending needs loaded.
     *
     * @return Collection<int, Enrollment>
     */
    public function enrollments(): Collection
    {
        /** @var User $staff */
        $staff = $this->user();

        return $this->enrollments ??= SendGradesToNextApplication::candidatesQuery($staff, $this->string('school_year')->toString())
            ->whereKey($this->input('enrollment_ids', []))
            ->with(['student', 'subjects:id,name', ...Enrollment::GRADE_REPORT_RELATIONS])
            ->get();
    }
}
