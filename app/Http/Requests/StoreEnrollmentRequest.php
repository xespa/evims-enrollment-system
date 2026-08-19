<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreEnrollmentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // Student
            'student_type' => ['required', 'in:NO_LRN,WITH_LRN,RETURNEE'],
            'lrn' => ['nullable', 'digits:14', 'unique:students,lrn'],
            'psa_birth_cert_no' => ['nullable', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'extension_name' => ['nullable', 'string', 'max:50'],
            'date_of_birth' => ['required', 'date', 'before:today'],
            'sex' => ['required', 'in:MALE,FEMALE'],

            // Enrollment
            'grade_level_id' => ['required', 'exists:grade_levels,id'],
            'school_year' => ['required', 'string', 'max:9'],
            'date_of_application' => ['required', 'date'],
            'age' => ['required', 'integer', 'min:2', 'max:25'],
            'session_time_preference' => ['required', 'in:MORNING_SESSION,AFTERNOON_SESSION,SCHOOL_SERVICE'],
            'email' => ['required', 'email', 'max:255'],
            'subject_ids' => ['required', 'array', 'min:1'],
            'subject_ids.*' => ['exists:subjects,id'],

            // Address
            'house_number_street' => ['nullable', 'string', 'max:255'],
            'barangay' => ['required', 'string', 'max:255'],
            'city_municipality' => ['required', 'string', 'max:255'],
            'province' => ['required', 'string', 'max:255'],
            'country' => ['required', 'string', 'max:255'],
            'zip_code' => ['nullable', 'string', 'max:10'],

            // Parent profile
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

            // Academic history (only relevant for RETURNEE, but keep nullable)
            'last_grade_level_completed' => ['nullable', 'string', 'max:255'],
            'last_school_year_completed' => ['nullable', 'string', 'max:255'],
            'previous_school_name' => ['nullable', 'string', 'max:255'],
            'previous_school_id' => ['nullable', 'string', 'max:255'],
            'previous_school_address' => ['nullable', 'string'],

            // Vital information
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

            // Billing
            'payment_option' => ['required', 'in:MONTHLY,BI_MONTHLY,FULL_PAYMENT'],
            'scanned_contract' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'payment_channel' => ['required', 'in:COUNTER,GCASH'],
        ];
    }
}
