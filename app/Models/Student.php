<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Student extends Model
{
    use HasFactory;

    protected $fillable = [
        'lrn', 'psa_birth_cert_no', 'last_name', 'first_name',
        'middle_name', 'extension_name', 'date_of_birth', 'sex',
    ];

    protected $casts = [
        'date_of_birth' => 'date:Y-m-d',
    ];

    /**
     * @return HasOne<Address, $this>
     */
    public function address(): HasOne
    {
        return $this->hasOne(Address::class);
    }

    /**
     * @return HasOne<ParentProfile, $this>
     */
    public function parentProfile(): HasOne
    {
        return $this->hasOne(ParentProfile::class);
    }

    /**
     * @return HasMany<Enrollment, $this>
     */
    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    /**
     * The student's sign-in account, once one has been requested.
     *
     * @return HasOne<StudentAccount, $this>
     */
    public function account(): HasOne
    {
        return $this->hasOne(StudentAccount::class);
    }

    /**
     * The student's latest approved application that wasn't cancelled:
     * what a student account is requested from.
     */
    public function latestApprovedEnrollment(): ?Enrollment
    {
        return $this->enrollments()
            ->where('enrollment_status', 'APPROVED')
            ->whereNull('cancelled_at')
            ->orderByDesc('school_year')
            ->latest('id')
            ->first();
    }

    /**
     * The same application as latestApprovedEnrollment(), as a relation so
     * it can be eager loaded for a list of students.
     *
     * @return HasOne<Enrollment, $this>
     */
    public function approvedEnrollment(): HasOne
    {
        return $this->hasOne(Enrollment::class)->ofMany(
            ['school_year' => 'max', 'id' => 'max'],
            fn (Builder $query) => $query->where('enrollment_status', 'APPROVED')->whereNull('cancelled_at'),
        );
    }

    /**
     * Students with an approved application, who can have a student account.
     *
     * @param  Builder<self>  $query
     */
    public function scopeWithApprovedEnrollment(Builder $query): void
    {
        $query->whereHas('enrollments', fn (Builder $enrollments) => $enrollments->where('enrollment_status', 'APPROVED')->whereNull('cancelled_at'));
    }

    /**
     * Where the student's sign-in account stands, for the admin pages, and
     * what stops one being requested yet (no LRN, or no approved
     * application). Expects the account to be loaded or loadable.
     *
     * @return array{status: string|null, status_label: string|null, consent_email: string|null, requested_at: string|null, expires_at: string|null, responded_at: string|null, consent_given_by: string|null, blocker: string|null}
     */
    public function accountSummary(?Enrollment $approvedEnrollment): array
    {
        $account = $this->account;

        return [
            'status' => $account?->status->value,
            'status_label' => $account?->status->label(),
            'consent_email' => $account?->consent_email,
            'requested_at' => $account?->consent_requested_at->toIso8601String(),
            'expires_at' => $account?->consent_expires_at?->toIso8601String(),
            'responded_at' => $account?->consent_responded_at?->toIso8601String(),
            'consent_given_by' => $account?->consent_given_by,
            'blocker' => match (true) {
                ! $this->lrn => 'Assign an LRN first; the account is bound to it.',
                $approvedEnrollment === null => 'Available once an application is approved.',
                default => null,
            },
        ];
    }

    public function latestEnrollment()
    {
        return $this->hasOne(Enrollment::class)->latestOfMany();
    }

    /**
     * The student's most recent approved enrollment in a school year before
     * the given one. Its documents are what a returning student keeps.
     */
    public function lastApprovedEnrollmentBefore(string $schoolYear): ?Enrollment
    {
        return $this->enrollments()
            ->where('enrollment_status', 'APPROVED')
            ->whereNull('cancelled_at')
            ->where('school_year', '<', $schoolYear)
            ->orderByDesc('school_year')
            ->first();
    }

    public function getFullNameAttribute(): string
    {
        return trim("{$this->last_name}, {$this->first_name} {$this->middle_name} {$this->extension_name}");
    }
}
