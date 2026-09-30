<?php

namespace App\Http\Controllers;

use App\Actions\Enrollment\SubmitEnrollmentApplication;
use App\Http\Requests\StoreEnrollmentRequest;
use App\Models\Curriculum;
use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\Student;
use App\Services\PendingEnrollment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
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
            'gradeLevels' => GradeLevel::orderBy('level_order')->get(['id', 'name', 'level_order']),
            // Fees and subjects per open school year, keyed by school year
            // then grade level ID. Only years the school has set up are
            // open, so nobody applies against guessed fees.
            'curricula' => $this->openCurricula(),
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
                'previous_school_id' => $latestEnrollment ? config('services.evims.school_id') : null,
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
     * Every set-up school year from last year onward (late enrollees can
     * still apply for the year that just started), with each grade level's
     * fees and subjects.
     *
     * @return array<string, array<int, Curriculum>>
     */
    private function openCurricula(): array
    {
        $startYear = (int) explode('-', Enrollment::currentSchoolYear())[0] - 1;
        $previousSchoolYear = $startYear.'-'.($startYear + 1);

        return Curriculum::query()
            ->published()
            ->where('school_year', '>=', $previousSchoolYear)
            ->with(['subjects' => fn ($query) => $query
                ->select(['id', 'curriculum_id', 'name', 'code'])
                ->orderBy('name')])
            ->orderBy('school_year')
            ->get()
            ->groupBy('school_year')
            ->map(fn ($curricula) => $curricula->keyBy('grade_level_id')->all())
            ->all();
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

    public function store(
        StoreEnrollmentRequest $request,
        SubmitEnrollmentApplication $submitApplication,
        PendingEnrollment $pendingEnrollment,
    ): RedirectResponse {
        $validated = $request->validated();

        // Everything is filled in and valid — only an account stands between
        // this and actually submitting. Hold the application (uploads
        // included) in the session and send them to create one; it's
        // submitted for them the moment they register or log in.
        if (! Auth::guard('enrollee')->check()) {
            $pendingEnrollment->stash($request, $validated);

            return redirect()->route('portal.register', [
                'name' => trim("{$validated['first_name']} {$validated['last_name']}"),
                'email' => $validated['email'],
            ]);
        }

        $enrollment = $submitApplication->handle(
            Auth::guard('enrollee')->user(),
            Arr::except($validated, array_keys(SubmitEnrollmentApplication::DOCUMENT_FIELDS)),
            $submitApplication->storeDocuments($request, 'public', 'documents'),
        );

        return redirect()->route('admission.success', $enrollment->id);
    }

    public function success(Enrollment $enrollment)
    {
        $enrollment->load('student', 'gradeLevel');

        return Inertia::render('Enrollment/Success', [
            'enrollment' => $enrollment,
        ]);
    }
}
