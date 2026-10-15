<?php

namespace App\Models;

use App\Enums\EnrollmentRejectionReason;
use App\Enums\PaymentMethod;
use Closure;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\AsEnumCollection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Enrollment extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id', 'enrollee_user_id', 'grade_level_id', 'school_year', 'student_type',
        'date_of_application', 'age', 'session_time_preference', 'email', 'applicant_name',
        'enrollment_status', 'rejection_reasons', 'rejection_note', 'cancelled_at',
    ];

    protected $casts = [
        'date_of_application' => 'date',
        'rejection_reasons' => AsEnumCollection::class.':'.EnrollmentRejectionReason::class,
        'cancelled_at' => 'datetime',
        'archived_at' => 'datetime',
    ];

    /**
     * @return BelongsTo<Student, $this>
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    /**
     * @return BelongsTo<GradeLevel, $this>
     */
    public function gradeLevel(): BelongsTo
    {
        return $this->belongsTo(GradeLevel::class);
    }

    /**
     * @return HasOne<AcademicHistory, $this>
     */
    public function academicHistory(): HasOne
    {
        return $this->hasOne(AcademicHistory::class);
    }

    /**
     * @return HasOne<VitalInformation, $this>
     */
    public function vitalInformation(): HasOne
    {
        return $this->hasOne(VitalInformation::class);
    }

    /**
     * @return HasOne<BillingContract, $this>
     */
    public function billingContract(): HasOne
    {
        return $this->hasOne(BillingContract::class);
    }

    /**
     * @return HasManyThrough<Installment, BillingContract, $this>
     */
    public function installments(): HasManyThrough
    {
        return $this->hasManyThrough(Installment::class, BillingContract::class);
    }

    /**
     * @return HasMany<Payment, $this>
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * @return HasOne<OfficeVerification, $this>
     */
    public function officeVerification(): HasOne
    {
        return $this->hasOne(OfficeVerification::class);
    }

    /**
     * @return HasOne<DocumentAppointment, $this>
     */
    public function documentAppointment(): HasOne
    {
        return $this->hasOne(DocumentAppointment::class);
    }

    /**
     * @return BelongsToMany<Subject, $this>
     */
    public function subjects(): BelongsToMany
    {
        return $this->belongsToMany(Subject::class, 'enrollment_subject');
    }

    /**
     * The student's rows on grade sheets for this school year.
     *
     * @return HasMany<StudentGrade, $this>
     */
    public function studentGrades(): HasMany
    {
        return $this->hasMany(StudentGrade::class);
    }

    /**
     * The student's grades for this school year, one row per subject, from
     * the teachers' grade sheets: what the student sees on their dashboard.
     * Archived sheets don't count until they're restored.
     *
     * @return list<array{id: int, subject: string, teacher: string, term_1: string|null, term_2: string|null, term_3: string|null, final_grade: float|null, remarks: string|null}>
     */
    public function gradeReport(): array
    {
        return array_values($this->studentGrades()
            ->whereHas('gradeSheet', fn (Builder $gradeSheet) => $gradeSheet->whereNull('grade_sheets.archived_at'))
            ->with(['gradeSheet.subject:id,name', 'gradeSheet.teacher:id,name'])
            ->get()
            ->sortBy(fn (StudentGrade $studentGrade) => $studentGrade->gradeSheet->subject->name)
            ->map(fn (StudentGrade $studentGrade) => [
                'id' => $studentGrade->id,
                'subject' => $studentGrade->gradeSheet->subject->name,
                'teacher' => $studentGrade->gradeSheet->teacher->name,
                'term_1' => $studentGrade->term_1,
                'term_2' => $studentGrade->term_2,
                'term_3' => $studentGrade->term_3,
                'final_grade' => $studentGrade->finalGrade(),
                'remarks' => $studentGrade->remarks(),
            ])
            ->all());
    }

    /**
     * The average of every subject's final grade in a grade report, or null
     * until they're all in.
     *
     * @param  list<array{final_grade: float|null}>  $gradeReport
     */
    public static function generalAverage(array $gradeReport): ?float
    {
        $finalGrades = array_column($gradeReport, 'final_grade');

        return $finalGrades !== [] && ! in_array(null, $finalGrades, true)
            ? round(array_sum($finalGrades) / count($finalGrades), 2)
            : null;
    }

    /**
     * @return BelongsTo<EnrolleeUser, $this>
     */
    public function enrolleeUser(): BelongsTo
    {
        return $this->belongsTo(EnrolleeUser::class);
    }

    /**
     * Adds a boolean `parent_email_verified` attribute: whether the parent
     * account behind this application has confirmed its email address.
     * Applications are accepted before verification, so the admin needs this
     * to spot a mistyped or unreachable address before approving.
     *
     * @param  Builder<self>  $query
     */
    public function scopeWithParentEmailVerified(Builder $query): void
    {
        $query->withExists(self::parentEmailVerifiedExists());
    }

    public function loadParentEmailVerified(): static
    {
        return $this->loadExists(self::parentEmailVerifiedExists());
    }

    /**
     * @return array<string, Closure(Builder<EnrolleeUser>): void>
     */
    private static function parentEmailVerifiedExists(): array
    {
        return [
            'enrolleeUser as parent_email_verified' => function (Builder $query): void {
                $query->whereNotNull('email_verified_at');
            },
        ];
    }

    /**
     * What paymentSummary() needs, for eager loading: the bill and its
     * installments with the amount paid on each (voided money excluded).
     *
     * @return array<int|string, mixed>
     */
    public static function paymentSummaryRelations(): array
    {
        return [
            'billingContract:id,enrollment_id,payment_channel,total_fee',
            'billingContract.installments' => fn ($installments) => $installments
                ->select(['id', 'billing_contract_id', 'installment_number', 'amount_due', 'due_date', 'status'])
                ->withSum(['payments as paid_amount' => fn ($payments) => $payments->where('status', 'COMPLETED')], 'amount')
                ->orderBy('installment_number'),
        ];
    }

    /**
     * Where this application stands on payment: status, totals, and what
     * each unpaid installment still owes. Null when there's no bill yet.
     * Load paymentSummaryRelations() first so this doesn't query per row.
     *
     * @return array{status: string, channel: string, channel_label: string, total: float, paid: float, balance: float, unpaid_installments: list<array{id: int, installment_number: int, owed: float}>}|null
     */
    public function paymentSummary(): ?array
    {
        $billingContract = $this->billingContract;

        if (! $billingContract) {
            return null;
        }

        $total = round((float) $billingContract->installments->sum('amount_due'), 2);
        $paid = round((float) $billingContract->installments->sum('paid_amount'), 2);
        $balance = round(max(0, $total - $paid), 2);

        $unpaidInstallments = array_values($billingContract->installments
            ->map(fn (Installment $installment) => [
                'id' => $installment->id,
                'installment_number' => $installment->installment_number,
                'owed' => round(max(0, (float) $installment->amount_due - (float) $installment->paid_amount), 2),
            ])
            ->filter(fn (array $installment) => $installment['owed'] > 0)
            ->all());

        return [
            'status' => match (true) {
                $balance <= 0 => 'PAID',
                $paid > 0 => 'PARTIALLY_PAID',
                default => 'UNPAID',
            },
            'channel' => $billingContract->payment_channel,
            'channel_label' => PaymentMethod::tryFrom($billingContract->payment_channel)?->label() ?? $billingContract->payment_channel,
            'total' => $total,
            'paid' => $paid,
            'balance' => $balance,
            'unpaid_installments' => $unpaidInstallments,
        ];
    }

    /**
     * What installmentSchedule() needs, for eager loading: the bill, its
     * installments and the payments made on each.
     *
     * @return array<int|string, mixed>
     */
    public static function installmentScheduleRelations(): array
    {
        return [
            ...self::paymentSummaryRelations(),
            'billingContract.installments.payments' => fn ($payments) => $payments
                ->select(['id', 'installment_id', 'amount', 'method', 'receipt_number', 'status', 'paid_at'])
                ->whereIn('status', ['COMPLETED', 'VOIDED'])
                ->orderBy('paid_at'),
        ];
    }

    /**
     * Each installment with what's been paid on it and the payments behind
     * it — voided ones included, so the record is complete. Load
     * installmentScheduleRelations() first so this doesn't query per row.
     *
     * @return list<array{id: int, installment_number: int, due_date: string, amount_due: float, paid: float, status: string, payments: list<array{id: int, amount: float, method: string, receipt_number: string|null, status: string, paid_at: string|null}>}>
     */
    public function installmentSchedule(): array
    {
        if (! $this->billingContract) {
            return [];
        }

        return array_values($this->billingContract->installments
            ->map(fn (Installment $installment) => [
                'id' => $installment->id,
                'installment_number' => $installment->installment_number,
                'due_date' => $installment->due_date->toDateString(),
                'amount_due' => (float) $installment->amount_due,
                'paid' => round((float) $installment->getAttribute('paid_amount'), 2),
                'status' => $installment->status,
                'payments' => array_values($installment->payments
                    ->map(fn (Payment $payment) => [
                        'id' => $payment->id,
                        'amount' => (float) $payment->amount,
                        'method' => $payment->method,
                        'receipt_number' => $payment->receipt_number,
                        'status' => $payment->status,
                        'paid_at' => $payment->paid_at?->toDateString(),
                    ])
                    ->all()),
            ])
            ->all());
    }

    public function isCancelled(): bool
    {
        return $this->cancelled_at !== null;
    }

    public function isArchived(): bool
    {
        return $this->archived_at !== null;
    }

    public function archive(User $admin): void
    {
        $this->forceFill([
            'archived_at' => now(),
            'archived_by' => $admin->id,
        ])->save();
    }

    public function restoreFromArchive(): void
    {
        $this->forceFill([
            'archived_at' => null,
            'archived_by' => null,
        ])->save();
    }

    /**
     * Only archived applications, or with `false`, only those not archived.
     *
     * @param  Builder<Enrollment>  $query
     */
    public function scopeArchived(Builder $query, bool $archived = true): void
    {
        if ($archived) {
            $query->whereNotNull('enrollments.archived_at');
        } else {
            $query->whereNull('enrollments.archived_at');
        }
    }

    /**
     * Narrows to a school year and grade level, when given.
     *
     * @param  Builder<Enrollment>  $query
     * @param  array{school_year?: string|null, grade_level_id?: int|string|null}  $filters
     */
    public function scopeInSchoolYearAndGrade(Builder $query, array $filters): void
    {
        $query
            ->when($filters['school_year'] ?? null, fn (Builder $query, string $schoolYear) => $query->where('enrollments.school_year', $schoolYear))
            ->when($filters['grade_level_id'] ?? null, fn (Builder $query, int|string $gradeLevelId) => $query->where('enrollments.grade_level_id', $gradeLevelId));
    }

    /**
     * Matches the student's name or LRN, the parent's email, or the
     * application number ("#12" or "12").
     *
     * @param  Builder<Enrollment>  $query
     */
    public function scopeMatchingSearch(Builder $query, string $search): void
    {
        $query->where(function (Builder $query) use ($search) {
            $query->where('enrollments.email', 'like', "%{$search}%")
                ->orWhereHas('student', fn (Builder $student) => $student
                    ->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('lrn', 'like', "%{$search}%"));

            if (ctype_digit(ltrim($search, '#'))) {
                $query->orWhere('enrollments.id', (int) ltrim($search, '#'));
            }
        });
    }

    /**
     * Applications with the given status as the admin sees it: CANCELLED
     * (withdrawn by the parent) takes the place of the review status, so
     * PENDING, APPROVED and REJECTED only match applications still active.
     *
     * @param  Builder<Enrollment>  $query
     */
    public function scopeWithStatus(Builder $query, string $status): void
    {
        if ($status === 'CANCELLED') {
            $query->whereNotNull('enrollments.cancelled_at');

            return;
        }

        $query->whereNull('enrollments.cancelled_at')
            ->where('enrollments.enrollment_status', $status);
    }

    /**
     * Applications of returning students: the same student was approved for
     * an earlier school year. The school issues their Form 138, so the
     * registrar uploads it instead of the parent.
     *
     * @param  Builder<Enrollment>  $query
     */
    public function scopeReturning(Builder $query): void
    {
        $query->whereExists(fn ($previous) => $previous
            ->from('enrollments as previous')
            ->whereColumn('previous.student_id', 'enrollments.student_id')
            ->whereColumn('previous.school_year', '<', 'enrollments.school_year')
            ->where('previous.enrollment_status', 'APPROVED')
            ->whereNull('previous.cancelled_at'));
    }

    /**
     * Pending returning-student applications whose latest Form 138 the
     * registrar hasn't uploaded yet.
     *
     * @param  Builder<Enrollment>  $query
     */
    public function scopeAwaitingSchoolForm138(Builder $query): void
    {
        $query->returning()
            ->archived(false)
            ->withStatus('PENDING')
            ->whereDoesntHave('officeVerification', fn (Builder $verification) => $verification->whereNotNull('form_138_path'));
    }

    public function isReturning(): bool
    {
        return $this->previousApprovedEnrollment() !== null;
    }

    /**
     * The same student's approved enrollment from the school year before
     * this one, if they're a returning student.
     */
    public function previousApprovedEnrollment(): ?self
    {
        return $this->student?->lastApprovedEnrollmentBefore($this->school_year);
    }

    /**
     * Names of the required documents that have no file uploaded yet.
     *
     * @return array<int, string>
     */
    public function missingDocumentLabels(): array
    {
        $verification = $this->officeVerification;

        return collect(OfficeVerification::DOCUMENT_COLUMNS)
            ->filter(fn (array $document) => blank($verification?->{$document['path']}))
            ->pluck('label')
            ->values()
            ->all();
    }

    /**
     * Rejects the application, recording why so the parent can be told.
     *
     * @param  array<int, EnrollmentRejectionReason>  $reasons
     */
    public function reject(array $reasons, ?string $note): void
    {
        $this->update([
            'enrollment_status' => 'REJECTED',
            'rejection_reasons' => $reasons,
            'rejection_note' => $note,
        ]);
    }

    /**
     * Sets any status other than rejected, clearing an earlier rejection's reasons.
     */
    public function changeStatus(string $status): void
    {
        $this->update([
            'enrollment_status' => $status,
            'rejection_reasons' => null,
            'rejection_note' => null,
        ]);
    }

    /**
     * The rejection reasons as the parent sees them.
     *
     * @return array<int, array{label: string, guidance: string}>
     */
    public function rejectionDetails(): array
    {
        if (! $this->rejection_reasons) {
            return [];
        }

        return $this->rejection_reasons
            ->map(fn (EnrollmentRejectionReason $reason) => [
                'label' => $reason->label(),
                'guidance' => $reason->guidance(),
            ])
            ->values()
            ->all();
    }

    /**
     * The students behind the applications, by name, as the student pickers
     * list them.
     *
     * @param  Builder<self>  $query
     * @return list<array{enrollment_id: int, name: string, lrn: string|null}>
     */
    public static function studentOptions(Builder $query): array
    {
        return array_values($query
            ->join('students', 'students.id', '=', 'enrollments.student_id')
            ->orderBy('students.last_name')
            ->orderBy('students.first_name')
            ->select('enrollments.*')
            ->with('student')
            ->get()
            ->map(fn (self $enrollment) => [
                'enrollment_id' => $enrollment->id,
                'name' => $enrollment->student->full_name,
                'lrn' => $enrollment->student->lrn,
            ])
            ->all());
    }

    /**
     * The school years to filter applications by, newest first: every year
     * with an application, plus the current one, which the filters start on.
     *
     * @return list<string>
     */
    public static function schoolYearOptions(): array
    {
        return array_values(self::query()
            ->distinct()
            ->pluck('school_year')
            ->push(self::currentSchoolYear())
            ->map(fn (mixed $schoolYear) => (string) $schoolYear)
            ->unique()
            ->sortDesc()
            ->all());
    }

    /**
     * The school year a list is filtered to: the one asked for, none (an
     * empty value, meaning "All school years"), or the current one when
     * the filter hasn't been touched yet.
     */
    public static function filteredSchoolYear(bool $wasChosen, ?string $chosen): ?string
    {
        if (! $wasChosen) {
            return self::currentSchoolYear();
        }

        return filled($chosen) ? $chosen : null;
    }

    /**
     * The PH school year runs roughly June–March, so before June we're still
     * in the one that started the previous calendar year (e.g. "2026-2027").
     * Mirrors currentSchoolYearStart() in the enrollment form.
     */
    public static function currentSchoolYear(): string
    {
        $startYear = now()->month >= 6 ? now()->year : now()->year - 1;

        return $startYear.'-'.($startYear + 1);
    }
}
