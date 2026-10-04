<?php

namespace App\Http\Controllers;

use App\Actions\Enrollment\SubmitEnrollmentApplication;
use App\Http\Requests\StoreEnrollmentRequest;
use App\Models\Curriculum;
use App\Models\EnrolleeUser;
use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\Student;
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
        /** @var EnrolleeUser $enrollee Admission routes require a portal account. */
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
            // Fees and subjects of the one school year applications are for,
            // keyed by school year then grade level ID. Only a year the
            // school has set up is open, so nobody applies against guessed fees.
            'curricula' => $this->openCurricula(),
            'previousApplication' => $previousApplication,
            // Only a logged-in enrollee with at least one prior application gets
            // the "confirm your child's LRN" fast-track gate — guests and
            // first-time accounts always get the full blank form.
            'hasExistingRecord' => $hasExistingRecord,
            // Unapproved accounts get a notice instead of the form; the
            // store route refuses them as well.
            'accountStatus' => $enrollee->account_status,
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
        $request->merge(['lrn' => StoreEnrollmentRequest::normalizeLrn($request->input('lrn'))]);

        $validated = $request->validate([
            'lrn' => ['required', 'regex:'.StoreEnrollmentRequest::LRN_PATTERN],
        ], [
            'lrn.regex' => StoreEnrollmentRequest::LRN_MESSAGE,
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

        // The child's latest approved year with this account, up to and
        // including the one that's open, so the parent can always view the
        // documents they last submitted.
        $applicationSchoolYear = Curriculum::applicationSchoolYear();
        $lastApprovedEnrollment = $applicationSchoolYear
            ? $student->enrollments()
                ->where('enrollee_user_id', $enrollee->id)
                ->where('enrollment_status', 'APPROVED')
                ->whereNull('cancelled_at')
                ->where('school_year', '<=', $applicationSchoolYear)
                ->orderByDesc('school_year')
                ->with('officeVerification')
                ->first()
            : null;

        return response()->json([
            'matched' => true,
            // Lets the frontend stop a returning student from applying again
            // for the year they last applied for, before the next one opens.
            'previousSchoolYear' => $latestEnrollment?->school_year,
            // A returning student keeps last year's documents (except Form
            // 138, which the registrar uploads), so the form can say so and
            // let the parent view the copies on file.
            'documentsOnFile' => $lastApprovedEnrollment ? [
                'schoolYear' => $lastApprovedEnrollment->school_year,
                'birth_certificate' => filled($lastApprovedEnrollment->officeVerification?->birth_certificate_path),
                'good_moral_certificate' => filled($lastApprovedEnrollment->officeVerification?->good_moral_path),
                'files' => [
                    'birth_certificate' => $lastApprovedEnrollment->officeVerification?->birth_certificate_path,
                    'good_moral_certificate' => $lastApprovedEnrollment->officeVerification?->good_moral_path,
                ],
            ] : null,
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
     * The school year applications are for, with each grade level's fees
     * and subjects. Empty when no school year is open.
     *
     * @return array<string, array<int, Curriculum>>
     */
    private function openCurricula(): array
    {
        $schoolYear = Curriculum::applicationSchoolYear();

        if ($schoolYear === null) {
            return [];
        }

        return [
            $schoolYear => Curriculum::query()
                ->published()
                ->where('school_year', $schoolYear)
                ->with(['subjects' => fn ($query) => $query
                    ->select(['id', 'curriculum_id', 'name', 'code'])
                    ->orderBy('name')])
                ->get()
                ->keyBy('grade_level_id')
                ->all(),
        ];
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

    public function store(StoreEnrollmentRequest $request, SubmitEnrollmentApplication $submitApplication): RedirectResponse
    {
        /** @var EnrolleeUser $enrollee Admission routes require a portal account. */
        $enrollee = Auth::guard('enrollee')->user();

        $enrollment = $submitApplication->handle(
            $enrollee,
            Arr::except($request->validated(), array_keys(SubmitEnrollmentApplication::DOCUMENT_FIELDS)),
            $submitApplication->storeDocuments($request, 'public', 'documents'),
        );

        return redirect()->route('admission.success', $enrollment->id);
    }

    public function success(Enrollment $enrollment)
    {
        // Only the account that applied may see its confirmation.
        abort_unless($enrollment->enrollee_user_id === Auth::guard('enrollee')->id(), 403);

        $enrollment->load('student', 'gradeLevel');

        return Inertia::render('Enrollment/Success', [
            'enrollment' => $enrollment,
        ]);
    }
}
