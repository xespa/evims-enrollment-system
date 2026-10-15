<?php

namespace App\Concerns;

use App\Models\GradeSheet;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;

trait GradeSheetScheduleValidationRules
{
    /**
     * Get the validation rules for when a grade sheet's class meets. All
     * optional, but a start time needs an end time after it.
     *
     * @return array<string, array<int, ValidationRule|array<mixed>|string>>
     */
    protected function scheduleRules(): array
    {
        return [
            'schedule_days' => ['nullable', 'array'],
            'schedule_days.*' => ['distinct', Rule::in(array_keys(GradeSheet::SCHEDULE_DAYS))],
            'start_time' => ['nullable', 'date_format:H:i', 'required_with:end_time'],
            'end_time' => ['nullable', 'date_format:H:i', 'required_with:start_time', 'after:start_time'],
        ];
    }

    /**
     * @return array<string, string>
     */
    protected function scheduleMessages(): array
    {
        return [
            'end_time.after' => 'The class has to end after it starts.',
            'start_time.required_with' => 'Enter when the class starts.',
            'end_time.required_with' => 'Enter when the class ends.',
        ];
    }
}
