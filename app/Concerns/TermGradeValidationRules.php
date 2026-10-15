<?php

namespace App\Concerns;

use App\Models\StudentGrade;
use Illuminate\Contracts\Validation\ValidationRule;

trait TermGradeValidationRules
{
    /**
     * Get the validation rules for a student's three term grades. Each is
     * optional, since terms are graded as they end.
     *
     * @return array<string, array<int, ValidationRule|array<mixed>|string>>
     */
    protected function termGradeRules(): array
    {
        return collect(StudentGrade::TERMS)
            ->mapWithKeys(fn (string $term) => [$term => ['nullable', 'numeric', 'between:0,100', 'decimal:0,2']])
            ->all();
    }

    /**
     * @return array<string, string>
     */
    protected function termGradeAttributes(): array
    {
        return [
            'term_1' => 'Term 1 grade',
            'term_2' => 'Term 2 grade',
            'term_3' => 'Term 3 grade',
        ];
    }
}
