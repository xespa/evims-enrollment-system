<?php

namespace App\Models;

use App\Enums\EnrollmentRejectionReason;
use Closure;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\AsEnumCollection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
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
     * @return HasOne<OfficeVerification, $this>
     */
    public function officeVerification(): HasOne
    {
        return $this->hasOne(OfficeVerification::class);
    }

    /**
     * @return BelongsToMany<Subject, $this>
     */
    public function subjects(): BelongsToMany
    {
        return $this->belongsToMany(Subject::class, 'enrollment_subject');
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
                ->select(['id', 'billing_contract_id', 'installment_number', 'amount_due'])
                ->withSum(['payments as paid_amount' => fn ($payments) => $payments->where('status', 'COMPLETED')], 'amount')
                ->orderBy('installment_number'),
        ];
    }

    /**
     * Where this application stands on payment: status, totals, and what
     * each unpaid installment still owes. Null when there's no bill yet.
     * Load paymentSummaryRelations() first so this doesn't query per row.
     *
     * @return array{status: string, channel: string, total: float, paid: float, balance: float, unpaid_installments: list<array{id: int, installment_number: int, owed: float}>}|null
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
            'total' => $total,
            'paid' => $paid,
            'balance' => $balance,
            'unpaid_installments' => $unpaidInstallments,
        ];
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
