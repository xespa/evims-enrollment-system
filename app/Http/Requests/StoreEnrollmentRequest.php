<?php

namespace App\Http\Requests;

use App\Models\BillingContract;
use App\Models\Curriculum;
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
     * The only grade level whose students never have an LRN yet (they're new
     * to school). Must match NO_LRN_GRADE_LEVEL in StudentInfoStep.
     */
    public const NO_LRN_GRADE_LEVEL = 'Nursery';

    public function authorize(): bool
    {
        return true;
    }

    /**
     * Mobile numbers are stored as 11 digits ("09171234567"), however they
     * were typed: spaces, dashes and a +63 prefix are accepted and removed.
     */
    protected function prepareForValidation(): void
    {
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

        if (str_starts_with($digits, '63') && strlen($digits) > 10) {
            return '0'.substr($digits, 2);
        }

        return str_starts_with($digits, '9') ? '0'.$digits : $digits;
    }

    /**
     * Find the student this submission belongs to, if any:
     * an LRN match takes priority (works even for guests), falling back
     * to the logged-in account's existing student (for NO_LRN cases).
     */
    protected function resolveExistingStudentId(): ?int
    {
        $lrn = $this->input('lrn');

        if ($lrn) {
            $student = Student::where('lrn', $lrn)->first();
            if ($student) {
                return $student->id;
            }
        }

        $enrollee = Auth::guard('enrollee')->user();

        return $enrollee?->enrollments()->value('student_id');
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
                'nullable',
                'digits:14',
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
            'date_of_application' => ['required', 'date'],
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
            'father_mobile_no' => ['nullable', 'regex:/^09\d{9}$/'],
            'mother_maiden_last_name' => ['nullable', 'string', 'max:255'],
            'mother_first_name' => ['nullable', 'string', 'max:255'],
            'mother_middle_name' => ['nullable', 'string', 'max:255'],
            'mother_occupation' => ['nullable', 'string', 'max:255'],
            'mother_name_of_office' => ['nullable', 'string', 'max:255'],
            'mother_mobile_no' => ['nullable', 'regex:/^09\d{9}$/'],

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
            'form_138' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
            'birth_certificate' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
            'good_moral_certificate' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        $mobileNumberMessage = 'Enter a valid mobile number: +63 followed by 10 digits starting with 9, e.g. +63 917 123 4567.';

        return [
            'father_mobile_no.regex' => $mobileNumberMessage,
            'mother_mobile_no.regex' => $mobileNumberMessage,
        ];
    }
}
