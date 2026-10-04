<?php

namespace App\Http\Requests;

use App\Actions\Enrollment\SubmitEnrollmentApplication;
use App\Models\BillingContract;
use App\Models\Curriculum;
use App\Models\EnrolleeUser;
use App\Models\GradeLevel;
use App\Models\Student;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class StoreEnrollmentRequest extends FormRequest
{
    private const MOBILE_NUMBER_FIELDS = ['father_mobile_no', 'mother_mobile_no'];

    /**
     * International form: a Philippine mobile (+63 9XX XXX XXXX), or any
     * other country's number of 7 to 15 digits in all (the E.164 maximum).
     */
    public const MOBILE_NUMBER_PATTERN = '/^\+(?:639\d{9}|(?!63)[1-9]\d{6,14})$/';

    /**
     * The only grade level whose students never have an LRN yet (they're new
     * to school). Must match NO_LRN_GRADE_LEVEL in StudentInfoStep.
     */
    public const NO_LRN_GRADE_LEVEL = 'Nursery';

    /**
     * A DepEd LRN (12 digits — what transferees bring from their previous
     * school) or one issued by EVIMS (14 digits, starting with 452501).
     */
    public const LRN_PATTERN = '/^(\d{12}|\d{14})$/';

    public const LRN_MESSAGE = 'Enter the 12-digit LRN from DepEd (on the child’s Form 138 / report card), or the 14-digit LRN issued by EVIMS.';

    /**
     * Strips the spaces and dashes people type into an LRN; anything else is
     * left alone so it still fails validation.
     */
    public static function normalizeLrn(mixed $input): mixed
    {
        if (! is_string($input) || ! preg_match('/^[\d\s\-]+$/', trim($input))) {
            return $input;
        }

        return preg_replace('/\D/', '', $input);
    }

    public function authorize(): bool
    {
        return true;
    }

    /**
     * Sets the school year to the one applications are for. Mobile numbers
     * are stored in international form ("+639171234567"), however they
     * were typed: spaces, dashes, a leading 0 and a missing +63 on a
     * Philippine number are all accepted.
     */
    protected function prepareForValidation(): void
    {
        // Applications are always for the newest open school year, never
        // whatever year the form sent.
        $this->merge(['school_year' => Curriculum::applicationSchoolYear()]);

        if ($this->filled('lrn')) {
            $this->merge(['lrn' => self::normalizeLrn($this->input('lrn'))]);
        }

        foreach (self::MOBILE_NUMBER_FIELDS as $field) {
            if ($this->filled($field) && is_string($this->input($field))) {
                $this->merge([$field => self::normalizeMobileNumber($this->input($field))]);
            }
        }
    }

    /**
     * Mirrors normalizeMobileNumber() in the admission form. Anything that
     * isn't a digit is kept out of the result only when the rest looks like
     * a number, so letters still fail validation instead of vanishing.
     */
    public static function normalizeMobileNumber(string $input): string
    {
        $trimmed = trim($input);

        if (! preg_match('/^[\d\s\-().+]+$/', $trimmed)) {
            return $trimmed;
        }

        $digits = preg_replace('/\D/', '', $trimmed) ?? '';

        return match (true) {
            $digits === '' => '',
            str_starts_with($trimmed, '+') => '+'.$digits,
            str_starts_with($digits, '00') => '+'.substr($digits, 2),
            str_starts_with($digits, '63') && strlen($digits) > 10 => '+'.$digits,
            str_starts_with($digits, '09') => '+63'.substr($digits, 1),
            str_starts_with($digits, '9') => '+63'.$digits,
            default => $digits,
        };
    }

    /**
     * The student this submission belongs to, if they're already on record,
     * matched the same way the application will be saved.
     */
    protected function resolveExistingStudentId(): ?int
    {
        /** @var EnrolleeUser|null $enrollee */
        $enrollee = Auth::guard('enrollee')->user();

        return app(SubmitEnrollmentApplication::class)
            ->findExistingStudent($enrollee, $this->all())
            ?->id;
    }

    /**
     * The fees and subjects offered for the chosen grade level and school
     * year, or null if that year hasn't been set up for it.
     */
    public function curriculum(): ?Curriculum
    {
        $gradeLevelId = $this->input('grade_level_id');
        $schoolYear = $this->input('school_year');

        if (! is_numeric($gradeLevelId) || ! is_string($schoolYear)) {
            return null;
        }

        return Curriculum::query()
            ->published()
            ->where('grade_level_id', $gradeLevelId)
            ->where('school_year', $schoolYear)
            ->first();
    }

    /**
     * Whether the student was approved at EVIMS in an earlier school year,
     * so the school (not the parent) provides their latest Form 138.
     */
    private function isReturningStudent(?int $existingStudentId): bool
    {
        $schoolYear = $this->input('school_year');

        return $existingStudentId !== null
            && is_string($schoolYear)
            && Student::findOrFail($existingStudentId)->lastApprovedEnrollmentBefore($schoolYear) !== null;
    }

    private function isForNoLrnGradeLevel(): bool
    {
        $gradeLevelId = $this->input('grade_level_id');

        return is_numeric($gradeLevelId)
            && GradeLevel::whereKey($gradeLevelId)->value('name') === self::NO_LRN_GRADE_LEVEL;
    }

    public function rules(): array
    {
        $existingStudentId = $this->resolveExistingStudentId();
        $curriculum = $this->curriculum();
        $isReturningStudent = $this->isReturningStudent($existingStudentId);

        $schoolYearRules = [
            'required',
            'string',
            'max:9',
            // Only school years the school has set up (fees + subjects) can
            // be applied for, so nobody is billed with guessed fees.
            function (string $attribute, mixed $value, Closure $fail) use ($curriculum) {
                if (! $curriculum && $this->filled('grade_level_id')) {
                    $fail("Enrollment for S.Y. {$value} isn't open for this grade level yet.");
                }
            },
        ];
        if ($existingStudentId) {
            // Only an active (pending/approved, not cancelled) application for the
            // same school year counts as a duplicate — a rejected or cancelled one
            // shouldn't stop the family from applying again for that same year.
            $schoolYearRules[] = Rule::unique('enrollments', 'school_year')->where(function ($query) use ($existingStudentId) {
                return $query->where('student_id', $existingStudentId)
                    ->where('enrollment_status', '!=', 'REJECTED')
                    ->whereNull('cancelled_at');
            });
        }

        return [
            // Student — 'lrn' is intentionally NOT unique anymore. A matching LRN
            // means "this is the same returning student," not a validation error.
            'student_type' => [
                'required',
                'in:NO_LRN,WITH_LRN,RETURNEE',
                function (string $attribute, mixed $value, Closure $fail) {
                    if ($value !== 'NO_LRN' && $this->isForNoLrnGradeLevel()) {
                        $fail('Nursery students don’t have an LRN yet, so the student type must be No LRN.');
                    }
                },
            ],
            'lrn' => [
                // A transferee brings their LRN from their previous school.
                'required_if:student_type,WITH_LRN',
                'nullable',
                'regex:'.self::LRN_PATTERN,
                function (string $attribute, mixed $value, Closure $fail) {
                    if (filled($value) && $this->isForNoLrnGradeLevel()) {
                        $fail('Nursery students don’t have an LRN yet. Leave this blank.');
                    }
                },
            ],
            'psa_birth_cert_no' => ['nullable', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'extension_name' => ['nullable', 'string', 'max:50'],
            'date_of_birth' => ['required', 'date', 'before:today'],
            'sex' => ['required', 'in:MALE,FEMALE'],

            // Enrollment
            'grade_level_id' => ['required', 'exists:grade_levels,id'],
            'school_year' => $schoolYearRules,
            'age' => ['required', 'integer', 'min:2'],
            'session_time_preference' => ['required', 'in:MORNING_SESSION,AFTERNOON_SESSION,SCHOOL_SERVICE'],
            'email' => ['required', 'email', 'max:255'],

            // Address
            'house_number_street' => ['nullable', 'string', 'max:255'],
            'barangay' => ['required', 'string', 'max:255'],
            'city_municipality' => ['required', 'string', 'max:255'],
            'city_code' => ['nullable', 'string', 'max:10'],
            'province' => ['required', 'string', 'max:255'],
            'province_code' => ['nullable', 'string', 'max:10'],
            'country' => ['required', 'string', 'max:255'],
            'zip_code' => ['nullable', 'string', 'max:10'],

            // Parents
            'father_last_name' => ['nullable', 'string', 'max:255'],
            'father_first_name' => ['nullable', 'string', 'max:255'],
            'father_middle_name' => ['nullable', 'string', 'max:255'],
            'father_occupation' => ['nullable', 'string', 'max:255'],
            'father_name_of_office' => ['nullable', 'string', 'max:255'],
            'father_mobile_no' => ['nullable', 'regex:'.self::MOBILE_NUMBER_PATTERN],
            'mother_maiden_last_name' => ['nullable', 'string', 'max:255'],
            'mother_first_name' => ['nullable', 'string', 'max:255'],
            'mother_middle_name' => ['nullable', 'string', 'max:255'],
            'mother_occupation' => ['nullable', 'string', 'max:255'],
            'mother_name_of_office' => ['nullable', 'string', 'max:255'],
            'mother_mobile_no' => ['nullable', 'regex:'.self::MOBILE_NUMBER_PATTERN],

            // Academic history
            'last_grade_level_completed' => ['nullable', 'string', 'max:255'],
            'last_school_year_completed' => ['nullable', 'string', 'max:9'],
            'previous_school_name' => ['nullable', 'string', 'max:255'],
            'previous_school_id' => ['nullable', 'string', 'max:255'],
            'previous_school_address' => ['nullable', 'string', 'max:255'],

            // Vital info
            'has_attended_summer_school' => ['boolean'],
            'has_emotional_mental_physical_difficulties' => ['boolean'],
            'has_learning_difficulties' => ['boolean'],
            'has_extended_absences' => ['boolean'],
            'shows_special_abilities_interests' => ['boolean'],
            'has_been_expelled' => ['boolean'],
            'has_been_suspended' => ['boolean'],
            'has_repeated_a_grade' => ['boolean'],
            'history_particulars' => ['nullable', 'string'],
            'special_health_problems' => ['nullable', 'string'],

            // Subjects
            'subject_ids' => ['required', 'array', 'min:1'],
            // Must be offered for this grade level in this school year.
            'subject_ids.*' => [Rule::exists('subjects', 'id')->where('curriculum_id', $curriculum ? $curriculum->id : 0)],

            // Billing
            'payment_option' => ['required', 'string'],
            'payment_channel' => ['required', Rule::in(BillingContract::CHANNELS)],

            // Documents
            'form_138' => [
                'nullable',
                // The registrar uploads a returning student's latest report
                // card, since the school is the one that issues it.
                Rule::prohibitedIf($isReturningStudent),
                'file',
                'mimes:pdf,jpg,jpeg,png',
                'max:10240',
            ],
            'birth_certificate' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
            'good_moral_certificate' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        $mobileNumberMessage = 'Enter a valid mobile number with its country code. Philippine numbers are +63 followed by 10 digits starting with 9, e.g. +63 917 123 4567.';

        return [
            'father_mobile_no.regex' => $mobileNumberMessage,
            'mother_mobile_no.regex' => $mobileNumberMessage,
            'lrn.regex' => self::LRN_MESSAGE,
            'form_138.prohibited' => 'Returning students don’t need to upload a Form 138 — the registrar will attach their latest report card from EVIMS.',
            'lrn.required_if' => 'Transferees need their LRN — enter the 12-digit LRN from their previous school (on their Form 138 / report card).',
        ];
    }
}
