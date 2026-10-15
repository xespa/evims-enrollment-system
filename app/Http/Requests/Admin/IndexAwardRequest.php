<?php

namespace App\Http\Requests\Admin;

use App\Actions\Awards\DetermineAcademicAwards;
use App\Enums\AcademicAward;
use App\Models\Enrollment;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * The awards list's filters: one school year (the current one unless
 * chosen), a grade level, and which recognition to show.
 */
class IndexAwardRequest extends FormRequest
{
    /**
     * Everyone with any recognition; the default.
     */
    public const RECOGNIZED = 'RECOGNIZED';

    /**
     * Grades are all in, but they missed the Academic Excellence Award.
     */
    public const NOT_QUALIFIED = DetermineAcademicAwards::STANDING_NOT_QUALIFIED;

    /**
     * Not every learning area has a final grade yet.
     */
    public const INCOMPLETE = DetermineAcademicAwards::STANDING_INCOMPLETE;

    public const EVERYONE = 'EVERYONE';

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('view-awards') ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'school_year' => ['nullable', 'string', 'regex:/^\d{4}-\d{4}$/'],
            'grade_level_id' => ['nullable', 'integer', Rule::in(DetermineAcademicAwards::eligibleGradeLevels()->modelKeys())],
            'recognition' => ['nullable', Rule::in(array_keys(self::recognitionOptions()))],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'grade_level_id.in' => 'Academic awards start at Grade 4.',
        ];
    }

    /**
     * Awards are for one school year: the one chosen, or else the current one.
     */
    public function schoolYear(): string
    {
        return $this->filled('school_year')
            ? $this->string('school_year')->toString()
            : Enrollment::currentSchoolYear();
    }

    public function gradeLevelId(): ?int
    {
        return $this->filled('grade_level_id') ? $this->integer('grade_level_id') : null;
    }

    public function recognition(): string
    {
        return $this->filled('recognition') ? $this->string('recognition')->toString() : self::RECOGNIZED;
    }

    /**
     * The recognition filter's choices, in order.
     *
     * @return array<string, string>
     */
    public static function recognitionOptions(): array
    {
        return [
            self::RECOGNIZED => 'All recognitions',
            AcademicAward::AcademicExcellence->value => AcademicAward::AcademicExcellence->label(),
            AcademicAward::LearningAreaExcellence->value => AcademicAward::LearningAreaExcellence->label(),
            self::NOT_QUALIFIED => 'Missed Academic Excellence',
            self::INCOMPLETE => 'Grades still incomplete',
            self::EVERYONE => 'Every student',
        ];
    }

    /**
     * Whether the student shows under the chosen recognition.
     *
     * @param  array{standing: string, awards: list<array{type: string, label: string, learning_area: string|null}>}  $student
     */
    public static function matches(array $student, string $recognition): bool
    {
        $awardTypes = array_column($student['awards'], 'type');

        return match ($recognition) {
            self::EVERYONE => true,
            self::RECOGNIZED => $awardTypes !== [],
            self::NOT_QUALIFIED, self::INCOMPLETE => $student['standing'] === $recognition,
            default => in_array($recognition, $awardTypes, true),
        };
    }
}
