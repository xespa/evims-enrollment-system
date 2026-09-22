<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEnrollmentRequest;
use App\Models\EnrolleeUser;
use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\Student;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class EnrollmentController extends Controller
{
    public function create()
    {
        $previousApplication = null;
        $enrollee = Auth::guard('enrollee')->user();

        if ($enrollee) {
            $latestEnrollment = $enrollee->enrollments()->with('student')->latest()->first();

            if ($latestEnrollment) {
                $previousApplication = [
                    'last_name' => $latestEnrollment->student->last_name,
                    'first_name' => $latestEnrollment->student->first_name,
                    'middle_name' => $latestEnrollment->student->middle_name,
                    'extension_name' => $latestEnrollment->student->extension_name,
                    'lrn' => $latestEnrollment->student->lrn,
                    'date_of_birth' => $latestEnrollment->student->date_of_birth->format('Y-m-d'),
                    'sex' => $latestEnrollment->student->sex,
                    'psa_birth_cert_no' => $latestEnrollment->student->psa_birth_cert_no,
                    'student_type' => $latestEnrollment->student_type,
                    'grade_level_id' => $latestEnrollment->grade_level_id,
                ];
            }
        }

        return Inertia::render('Enrollment/Create', [
            'gradeLevels' => GradeLevel::with('subjects')->orderBy('level_order')->get(),
            'previousApplication' => $previousApplication,
        ]);
    }

    public function store(StoreEnrollmentRequest $request)
    {
        $validated = $request->validated();

        $enrollment = DB::transaction(function () use ($validated, $request) {
            $enrollee = Auth::guard('enrollee')->user();

            // Find by LRN first (works for guests too), falling back to the
            // logged-in account's own existing student (covers NO_LRN cases).
            $existingStudent = null;

            if (! empty($validated['lrn'])) {
                $existingStudent = Student::where('lrn', $validated['lrn'])->first();
            }

            if (! $existingStudent && $enrollee) {
                $linkedStudentId = $enrollee->enrollments()->value('student_id');
                if ($linkedStudentId) {
                    $existingStudent = Student::find($linkedStudentId);
                }
            }

            // Only allow overwriting identity fields if the submitter is logged in
            // AND is actually the account linked to this student — otherwise a guest
            // typing in someone else's LRN could silently edit that student's identity.
            $isOwner = $existingStudent && $enrollee
                && $enrollee->enrollments()->where('student_id', $existingStudent->id)->exists();

            if ($existingStudent && ($isOwner || ! $enrollee)) {
                // Owner editing their own record, OR a fresh guest match with no
                // conflicting account — safe to sync identity fields.
            }

            if ($existingStudent) {
                $student = $existingStudent;

                if ($isOwner) {
                    $student->update([
                        'lrn' => $validated['lrn'] ?? null,
                        'psa_birth_cert_no' => $validated['psa_birth_cert_no'] ?? null,
                        'last_name' => $validated['last_name'],
                        'first_name' => $validated['first_name'],
                        'middle_name' => $validated['middle_name'] ?? null,
                        'extension_name' => $validated['extension_name'] ?? null,
                        'date_of_birth' => $validated['date_of_birth'],
                        'sex' => $validated['sex'],
                    ]);
                }
                // If matched by LRN but not the verified owner (e.g. guest, or a
                // different logged-in account), we deliberately keep the existing
                // identity fields as-is rather than trusting the new submission.
            } else {
                $student = Student::create([
                    'lrn' => $validated['lrn'] ?? null,
                    'psa_birth_cert_no' => $validated['psa_birth_cert_no'] ?? null,
                    'last_name' => $validated['last_name'],
                    'first_name' => $validated['first_name'],
                    'middle_name' => $validated['middle_name'] ?? null,
                    'extension_name' => $validated['extension_name'] ?? null,
                    'date_of_birth' => $validated['date_of_birth'],
                    'sex' => $validated['sex'],
                ]);
            }

            $student->address()->updateOrCreate([], [
                'house_number_street' => $validated['house_number_street'] ?? null,
                'barangay' => $validated['barangay'],
                'city_municipality' => $validated['city_municipality'],
                'city_code' => $validated['city_code'] ?? null,
                'province' => $validated['province'],
                'province_code' => $validated['province_code'] ?? null,
                'country' => $validated['country'],
                'zip_code' => $validated['zip_code'] ?? null,
            ]);

            $student->parentProfile()->updateOrCreate([], [
                'father_last_name' => $validated['father_last_name'] ?? null,
                'father_first_name' => $validated['father_first_name'] ?? null,
                'father_middle_name' => $validated['father_middle_name'] ?? null,
                'father_occupation' => $validated['father_occupation'] ?? null,
                'father_name_of_office' => $validated['father_name_of_office'] ?? null,
                'father_mobile_no' => $validated['father_mobile_no'] ?? null,
                'mother_maiden_last_name' => $validated['mother_maiden_last_name'] ?? null,
                'mother_first_name' => $validated['mother_first_name'] ?? null,
                'mother_middle_name' => $validated['mother_middle_name'] ?? null,
                'mother_occupation' => $validated['mother_occupation'] ?? null,
                'mother_name_of_office' => $validated['mother_name_of_office'] ?? null,
                'mother_mobile_no' => $validated['mother_mobile_no'] ?? null,
            ]);

            $enrollment = $student->enrollments()->create([
                'grade_level_id' => $validated['grade_level_id'],
                'school_year' => $validated['school_year'],
                'student_type' => $validated['student_type'],
                'date_of_application' => $validated['date_of_application'],
                'age' => $validated['age'],
                'session_time_preference' => $validated['session_time_preference'],
                'email' => $validated['email'],
                'enrollment_status' => 'PENDING',
            ]);

            if ($enrollee) {
                $enrollment->update(['enrollee_user_id' => $enrollee->id]);
            } else {
                $verifiedAccount = EnrolleeUser::where('email', $validated['email'])
                    ->whereNotNull('email_verified_at')
                    ->first();

                if ($verifiedAccount) {
                    $enrollment->update(['enrollee_user_id' => $verifiedAccount->id]);
                }
            }

            $enrollment->subjects()->sync($validated['subject_ids']);

            $enrollment->academicHistory()->create([
                'last_grade_level_completed' => $validated['last_grade_level_completed'] ?? null,
                'last_school_year_completed' => $validated['last_school_year_completed'] ?? null,
                'previous_school_name' => $validated['previous_school_name'] ?? null,
                'previous_school_id' => $validated['previous_school_id'] ?? null,
                'previous_school_address' => $validated['previous_school_address'] ?? null,
            ]);

            $enrollment->vitalInformation()->create([
                'has_attended_summer_school' => $validated['has_attended_summer_school'] ?? false,
                'has_emotional_mental_physical_difficulties' => $validated['has_emotional_mental_physical_difficulties'] ?? false,
                'has_learning_difficulties' => $validated['has_learning_difficulties'] ?? false,
                'has_extended_absences' => $validated['has_extended_absences'] ?? false,
                'shows_special_abilities_interests' => $validated['shows_special_abilities_interests'] ?? false,
                'has_been_expelled' => $validated['has_been_expelled'] ?? false,
                'has_been_suspended' => $validated['has_been_suspended'] ?? false,
                'has_repeated_a_grade' => $validated['has_repeated_a_grade'] ?? false,
                'history_particulars' => $validated['history_particulars'] ?? null,
                'special_health_problems' => $validated['special_health_problems'] ?? null,
            ]);

            $gradeLevel = GradeLevel::findOrFail($validated['grade_level_id']);

            $billingContract = $enrollment->billingContract()->create([
                'payment_option' => $validated['payment_option'],
                'payment_channel' => $validated['payment_channel'],
                'total_fee' => $gradeLevel->tuition_fee,
            ]);

            $billingContract->generateInstallments();

            $enrollment->officeVerification()->create([
                'form_138_path' => $request->hasFile('form_138')
                    ? $request->file('form_138')->store('documents', 'public')
                    : null,
                'birth_certificate_path' => $request->hasFile('birth_certificate')
                    ? $request->file('birth_certificate')->store('documents', 'public')
                    : null,
                'good_moral_path' => $request->hasFile('good_moral_certificate')
                    ? $request->file('good_moral_certificate')->store('documents', 'public')
                    : null,
            ]);

            return $enrollment;
        });

        return redirect()->route('enrollment.success', $enrollment->id);
    }

    public function success(Enrollment $enrollment)
    {
        $enrollment->load('student', 'gradeLevel');

        return Inertia::render('Enrollment/Success', [
            'enrollment' => $enrollment,
        ]);
    }
}
