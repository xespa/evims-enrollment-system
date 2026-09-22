<?php

namespace App\Http\Requests;

use App\Models\Student;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class StoreEnrollmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
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

    public function rules(): array
    {
        $existingStudentId = $this->resolveExistingStudentId();

        $schoolYearRules = ['required', 'string', 'max:9'];
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
            'student_type' => ['required', 'in:NO_LRN,WITH_LRN,RETURNEE'],
            'lrn' => ['nullable', 'digits:14'],
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
            'father_mobile_no' => ['nullable', 'string', 'max:20'],
            'mother_maiden_last_name' => ['nullable', 'string', 'max:255'],
            'mother_first_name' => ['nullable', 'string', 'max:255'],
            'mother_middle_name' => ['nullable', 'string', 'max:255'],
            'mother_occupation' => ['nullable', 'string', 'max:255'],
            'mother_name_of_office' => ['nullable', 'string', 'max:255'],
            'mother_mobile_no' => ['nullable', 'string', 'max:20'],

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
            'subject_ids.*' => ['exists:subjects,id'],

            // Billing
            'payment_option' => ['required', 'string'],
            'payment_channel' => ['required', 'string'],

            // Documents
            'form_138' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
            'birth_certificate' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
            'good_moral_certificate' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
        ];
    }
}
