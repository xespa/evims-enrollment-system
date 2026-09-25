<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEnrollmentRequest;
use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class EnrollmentController extends Controller
{
    private const SCHOOL_NAME = 'Eastern Visayas International Montessori School';

    private const SCHOOL_ADDRESS = 'Santiago St., Brgy. Balud';

    public function create()
    {
        $previousApplication = null;
        $enrollee = Auth::guard('enrollee')->user();
        $hasExistingRecord = false;

        if ($enrollee) {
            $latestEnrollment = $enrollee->enrollments()->with('student')->latest()->first();

            if ($latestEnrollment) {
                $hasExistingRecord = true;
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
            // Only a logged-in enrollee with at least one prior application gets
            // the "confirm your child's LRN" fast-track gate — guests and
            // first-time accounts always get the full blank form.
            'hasExistingRecord' => $hasExistingRecord,
        ]);
    }

    /**
     * Looks up one of this enrollee's own previously-enrolled children by LRN,
     * for the "returning student" fast-track on the admission form. Scoped
     * strictly to students linked to the authenticated account — this must
     * never be a general LRN lookup, or it'd leak whether an LRN exists at all.
     */
    public function verifyLrn(Request $request)
    {
        $validated = $request->validate([
            'lrn' => ['required', 'digits:14'],
        ]);

        $enrollee = $request->user('enrollee');

        $studentIds = $enrollee->enrollments()->pluck('student_id');

        $student = Student::whereIn('id', $studentIds)
            ->where('lrn', $validated['lrn'])
            ->with(['address', 'parentProfile'])
            ->first();

        if (! $student) {
            return response()->json(['matched' => false]);
        }

        $latestEnrollment = $student->enrollments()
            ->where('enrollee_user_id', $enrollee->id)
            ->with(['gradeLevel', 'academicHistory', 'vitalInformation'])
            ->latest()
            ->first();

        return response()->json([
            'matched' => true,
            // Lets the frontend enforce that this new application's school
            // year is exactly one year after the last one — a returning
            // student can't apply for the same year twice (already blocked
            // elsewhere) or skip years ahead.
            'previousSchoolYear' => $latestEnrollment?->school_year,
            'student' => [
                // Student
                'last_name' => $student->last_name,
                'first_name' => $student->first_name,
                'middle_name' => $student->middle_name,
                'extension_name' => $student->extension_name,
                'lrn' => $student->lrn,
                'date_of_birth' => $student->date_of_birth->format('Y-m-d'),
                'sex' => $student->sex,
                'psa_birth_cert_no' => $student->psa_birth_cert_no,
                'student_type' => 'WITH_LRN',
                // Default to the NEXT grade level up from where they last
                // enrolled (e.g. Kinder -> Grade 1) — a returning student is
                // moving up a year, not repeating. Still editable on step 1
                // or the fast-track banner if that's wrong (e.g. repeating).
                'grade_level_id' => $this->nextGradeLevelId($latestEnrollment?->grade_level_id),

                // Address
                'house_number_street' => $student->address?->house_number_street,
                'barangay' => $student->address?->barangay,
                'city_municipality' => $student->address?->city_municipality,
                'city_code' => $student->address?->city_code,
                'province' => $student->address?->province,
                'province_code' => $student->address?->province_code,
                'country' => $student->address?->country ?? 'Philippines',
                'zip_code' => $student->address?->zip_code,

                // Parents
                'father_last_name' => $student->parentProfile?->father_last_name,
                'father_first_name' => $student->parentProfile?->father_first_name,
                'father_middle_name' => $student->parentProfile?->father_middle_name,
                'father_occupation' => $student->parentProfile?->father_occupation,
                'father_name_of_office' => $student->parentProfile?->father_name_of_office,
                'father_mobile_no' => $student->parentProfile?->father_mobile_no,
                'mother_maiden_last_name' => $student->parentProfile?->mother_maiden_last_name,
                'mother_first_name' => $student->parentProfile?->mother_first_name,
                'mother_middle_name' => $student->parentProfile?->mother_middle_name,
                'mother_occupation' => $student->parentProfile?->mother_occupation,
                'mother_name_of_office' => $student->parentProfile?->mother_name_of_office,
                'mother_mobile_no' => $student->parentProfile?->mother_mobile_no,

                // Academic history — a returning student's "previous school"
                // is EVIMS itself, not whatever they attended before EVIMS
                // (that belongs to their original application, not this one).
                'last_grade_level_completed' => $latestEnrollment?->gradeLevel?->name,
                'last_school_year_completed' => $latestEnrollment?->school_year,
                'previous_school_name' => $latestEnrollment ? self::SCHOOL_NAME : null,
                'previous_school_id' => null,
                'previous_school_address' => $latestEnrollment ? self::SCHOOL_ADDRESS : null,

                // Vital info
                'has_attended_summer_school' => $latestEnrollment?->vitalInformation?->has_attended_summer_school ?? false,
                'has_emotional_mental_physical_difficulties' => $latestEnrollment?->vitalInformation?->has_emotional_mental_physical_difficulties ?? false,
                'has_learning_difficulties' => $latestEnrollment?->vitalInformation?->has_learning_difficulties ?? false,
                'has_extended_absences' => $latestEnrollment?->vitalInformation?->has_extended_absences ?? false,
                'shows_special_abilities_interests' => $latestEnrollment?->vitalInformation?->shows_special_abilities_interests ?? false,
                'has_been_expelled' => $latestEnrollment?->vitalInformation?->has_been_expelled ?? false,
                'has_been_suspended' => $latestEnrollment?->vitalInformation?->has_been_suspended ?? false,
                'has_repeated_a_grade' => $latestEnrollment?->vitalInformation?->has_repeated_a_grade ?? false,
                'history_particulars' => $latestEnrollment?->vitalInformation?->history_particulars,
                'special_health_problems' => $latestEnrollment?->vitalInformation?->special_health_problems,
            ],
        ]);
    }

    /**
     * The grade level directly above the given one, ordered by level_order
     * (e.g. Kinder -> Grade 1 -> Grade 2 ...). Falls back to the same grade
     * level if it's already the highest one (Grade 10) or unknown, since
     * there's nothing further to promote to.
     */
    private function nextGradeLevelId(?int $currentGradeLevelId): ?int
    {
        if (! $currentGradeLevelId) {
            return $currentGradeLevelId;
        }

        $current = GradeLevel::find($currentGradeLevelId);

        if (! $current) {
            return $currentGradeLevelId;
        }

        $next = GradeLevel::where('level_order', '>', $current->level_order)
            ->orderBy('level_order')
            ->first();

        return $next?->id ?? $currentGradeLevelId;
    }

    public function store(StoreEnrollmentRequest $request)
    {
        $validated = $request->validated();

        // Everything is filled in and valid — only an account stands between
        // this and actually submitting. Send them to create one (or log in),
        // then bring them straight back here to finish once they have.
        if (! Auth::guard('enrollee')->check()) {
            // redirect()->guest() only captures the current URL as "intended"
            // for GET requests (for POST it falls back to the Referer header,
            // which isn't reliable) — set it explicitly instead, so it's the
            // admission page regardless of method or browser referrer policy.
            session(['url.intended' => route('enrollment.create')]);

            return redirect()->route('portal.register', [
                'name' => trim("{$validated['first_name']} {$validated['last_name']}"),
                'email' => $validated['email'],
            ]);
        }

        $enrollment = DB::transaction(function () use ($validated, $request) {
            $enrollee = Auth::guard('enrollee')->user();

            // Find by LRN first, falling back to the logged-in account's own
            // existing student (covers NO_LRN cases).
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

            // Only allow overwriting identity fields if the logged-in account is
            // actually the one linked to this student — otherwise someone typing
            // in a different family's LRN could silently edit that student's identity.
            $isOwner = $existingStudent
                && $enrollee->enrollments()->where('student_id', $existingStudent->id)->exists();

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
                // Matched by LRN but this account isn't the verified owner — we
                // deliberately keep the existing identity fields as-is rather
                // than trusting the new submission.
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

            // Submitting is now gated on being logged in (see the check above),
            // so $enrollee is always present here.
            $enrollment->update(['enrollee_user_id' => $enrollee->id]);

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
