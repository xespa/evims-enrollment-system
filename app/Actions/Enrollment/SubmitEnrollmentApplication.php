<?php

namespace App\Actions\Enrollment;

use App\Models\Curriculum;
use App\Models\EnrolleeUser;
use App\Models\Enrollment;
use App\Models\OfficeVerification;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SubmitEnrollmentApplication
{
    /**
     * Admission form upload fields, mapped to their office_verifications column.
     */
    public const DOCUMENT_FIELDS = [
        'form_138' => 'form_138_path',
        'birth_certificate' => 'birth_certificate_path',
        'good_moral_certificate' => 'good_moral_path',
    ];

    /**
     * Documents a returning student keeps from their last approved year,
     * keyed like OfficeVerification::DOCUMENT_COLUMNS. Form 138 isn't one:
     * it's a new report card every year, which the school uploads itself.
     */
    public const RETAINED_DOCUMENTS = ['birth_certificate', 'good_moral'];

    /**
     * Student fields printed on the PSA birth certificate. Changing any of
     * them means the copy on file no longer matches, so a new one is needed.
     */
    private const PSA_FIELDS = ['psa_birth_cert_no', 'last_name', 'first_name', 'middle_name', 'extension_name', 'date_of_birth', 'sex'];

    /**
     * @return array{form_138_path: ?string, birth_certificate_path: ?string, good_moral_path: ?string}
     */
    public function storeDocuments(Request $request, string $disk, string $directory): array
    {
        $paths = [];

        foreach (self::DOCUMENT_FIELDS as $field => $column) {
            $paths[$column] = $request->hasFile($field)
                ? $request->file($field)->store($directory, $disk)
                : null;
        }

        /** @var array{form_138_path: ?string, birth_certificate_path: ?string, good_moral_path: ?string} */
        return $paths;
    }

    /**
     * The student an application is for, if they're already on record: an
     * LRN match first (works even for guests), then one of the account's
     * own children with the same name and birthday (covers No LRN children).
     * Anyone else is a new child, so a family can enroll as many as they have.
     *
     * @param  array<string, mixed>  $input
     */
    public function findExistingStudent(?EnrolleeUser $enrollee, array $input): ?Student
    {
        $lrn = $input['lrn'] ?? null;

        if (filled($lrn) && is_scalar($lrn)) {
            $student = Student::where('lrn', (string) $lrn)->first();

            if ($student) {
                return $student;
            }
        }

        $firstName = $input['first_name'] ?? null;
        $lastName = $input['last_name'] ?? null;
        $dateOfBirth = $input['date_of_birth'] ?? null;

        if (! $enrollee || ! is_string($firstName) || ! is_string($lastName) || ! is_string($dateOfBirth) || strtotime($dateOfBirth) === false) {
            return null;
        }

        return $enrollee->findChild($firstName, $lastName, $dateOfBirth);
    }

    /**
     * Creates the full record set for one admission application: the student
     * (or reuses an existing one), address, parents, enrollment, subjects,
     * history, vital info, billing schedule and document paths.
     *
     * @param  array<string, mixed>  $validated  Output of StoreEnrollmentRequest, without the uploaded files.
     * @param  array{form_138_path: ?string, birth_certificate_path: ?string, good_moral_path: ?string}  $documentPaths  Paths on the public disk.
     */
    public function handle(EnrolleeUser $enrollee, array $validated, array $documentPaths): Enrollment
    {
        return DB::transaction(function () use ($enrollee, $validated, $documentPaths) {
            $existingStudent = $this->findExistingStudent($enrollee, $validated);

            // Only allow overwriting identity fields if the logged-in account is
            // actually the one linked to this student — otherwise someone typing
            // in a different family's LRN could silently edit that student's identity.
            $isOwner = $existingStudent
                && $enrollee->enrollments()->where('student_id', $existingStudent->id)->exists();

            // Only the family's own returning student keeps documents on file,
            // never someone else's child matched by LRN.
            $previousEnrollment = $isOwner
                ? $existingStudent->lastApprovedEnrollmentBefore($validated['school_year'])
                : null;
            $psaDetailsChanged = $existingStudent && $this->psaDetailsChanged($existingStudent, $validated);

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
                // Always the day it's actually submitted, in the school's
                // timezone — never whatever date the form sent.
                'date_of_application' => now('Asia/Manila')->toDateString(),
                'age' => $validated['age'],
                'session_time_preference' => $validated['session_time_preference'],
                'email' => $validated['email'],
                'enrollment_status' => 'PENDING',
            ]);

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

            // Priced from this grade level's fees for the chosen school year.
            // The total is copied onto the contract, so later fee changes
            // never alter a bill that's already been issued.
            $curriculum = Curriculum::query()
                ->published()
                ->where('grade_level_id', $validated['grade_level_id'])
                ->where('school_year', $validated['school_year'])
                ->firstOrFail();

            $billingContract = $enrollment->billingContract()->create([
                'payment_option' => $validated['payment_option'],
                'payment_channel' => $validated['payment_channel'],
                'total_fee' => $curriculum->tuition_fee,
            ]);

            $billingContract->generateInstallments();

            $enrollment->officeVerification()->create(
                $previousEnrollment
                    ? $this->withRetainedDocuments($previousEnrollment, $documentPaths, $psaDetailsChanged)
                    : $documentPaths,
            );

            return $enrollment;
        });
    }

    /**
     * Whether the submission changes anything printed on the PSA birth
     * certificate compared with the student's record.
     *
     * @param  array<string, mixed>  $validated
     */
    private function psaDetailsChanged(Student $student, array $validated): bool
    {
        foreach (self::PSA_FIELDS as $field) {
            $current = $field === 'date_of_birth'
                ? $student->date_of_birth->format('Y-m-d')
                : $student->{$field};
            $submitted = $field === 'date_of_birth' && is_string($validated[$field] ?? null)
                ? date('Y-m-d', (int) strtotime($validated[$field]))
                : ($validated[$field] ?? null);

            if (blank($current) !== blank($submitted) || (filled($current) && (string) $current !== (string) $submitted)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Fills each document the parent didn't upload again with a copy of the
     * one from the student's last approved year, keeping its verification.
     * The PSA isn't kept when its details changed. Files are copied, not
     * shared, so replacing one year's file never deletes the other's.
     *
     * @param  array{form_138_path: ?string, birth_certificate_path: ?string, good_moral_path: ?string}  $documentPaths
     * @return array<string, string|bool|null>
     */
    private function withRetainedDocuments(Enrollment $previousEnrollment, array $documentPaths, bool $psaDetailsChanged): array
    {
        $previousVerification = $previousEnrollment->officeVerification;
        $attributes = $documentPaths;

        foreach (self::RETAINED_DOCUMENTS as $type) {
            $columns = OfficeVerification::DOCUMENT_COLUMNS[$type];
            $previousPath = $previousVerification?->{$columns['path']};

            if (filled($attributes[$columns['path']]) || blank($previousPath) || ($type === 'birth_certificate' && $psaDetailsChanged)) {
                continue;
            }

            if (! Storage::disk('public')->exists($previousPath)) {
                continue;
            }

            $copyPath = 'documents/'.Str::random(40).'.'.pathinfo($previousPath, PATHINFO_EXTENSION);
            Storage::disk('public')->copy($previousPath, $copyPath);

            $attributes[$columns['path']] = $copyPath;
            $attributes[$columns['verified']] = (bool) $previousVerification->{$columns['verified']};
        }

        return $attributes;
    }
}
