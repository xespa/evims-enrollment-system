<?php

namespace App\Models;

use App\Enums\AccountRejectionReason;
use App\Enums\AccountStatus;
use App\Enums\AccountType;
use App\Notifications\VerifyEnrolleeEmail;
use Database\Factories\EnrolleeUserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Casts\AsEnumCollection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;

/**
 * @property AccountType|null $account_type
 * @property AccountStatus $account_status
 * @property Carbon|null $reviewed_at
 * @property int|null $reviewed_by
 * @property Collection<int, AccountRejectionReason>|null $rejection_reasons
 * @property string|null $rejection_reason The admin's own note to the account holder.
 * @property string|null $valid_id_path
 * @property Carbon|null $terms_accepted_at
 */
class EnrolleeUser extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<EnrolleeUserFactory> */
    use HasFactory, Notifiable;

    protected $fillable = ['name', 'email', 'account_type', 'password', 'profile_photo_path', 'valid_id_path', 'terms_accepted_at'];

    /**
     * The ID's storage path is never sent to the browser — admins view the
     * file through an authorized route instead.
     */
    protected $hidden = ['password', 'remember_token', 'valid_id_path'];

    protected $appends = ['profile_photo_url'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'account_type' => AccountType::class,
            'account_status' => AccountStatus::class,
            'reviewed_at' => 'datetime',
            'rejection_reasons' => AsEnumCollection::of(AccountRejectionReason::class),
            'terms_accepted_at' => 'datetime',
        ];
    }

    /**
     * @return HasMany<Enrollment, $this>
     */
    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    /**
     * The admin who last approved or rejected this account.
     *
     * @return BelongsTo<User, $this>
     */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    /**
     * One of this account's own children, recognised by name and birthday —
     * so a returning child without an LRN keeps their record, while a
     * sibling gets a record of their own.
     */
    public function findChild(string $firstName, string $lastName, string $dateOfBirth): ?Student
    {
        return Student::query()
            ->whereHas('enrollments', fn ($query) => $query->whereBelongsTo($this, 'enrolleeUser'))
            ->where('first_name', $firstName)
            ->where('last_name', $lastName)
            ->whereDate('date_of_birth', $dateOfBirth)
            ->first();
    }

    public function isApproved(): bool
    {
        return $this->account_status === AccountStatus::Approved;
    }

    /**
     * A rejected account whose problems a new ID alone can't fix (e.g. a
     * name that doesn't match), so it has to sign up again in full.
     */
    public function needsFullSignup(): bool
    {
        return $this->account_status === AccountStatus::Rejected
            && (bool) $this->rejection_reasons?->contains(fn (AccountRejectionReason $reason) => $reason->needsFullSignup());
    }

    /**
     * Grants the account portal access and online payments.
     */
    public function approve(User $admin): void
    {
        $this->forceFill([
            'account_status' => AccountStatus::Approved,
            'reviewed_at' => now(),
            'reviewed_by' => $admin->id,
            'rejection_reasons' => null,
            'rejection_reason' => null,
        ])->save();
    }

    /**
     * Blocks (or revokes) portal access and online payments.
     *
     * @param  array<int, AccountRejectionReason>  $reasons
     */
    public function reject(User $admin, array $reasons, ?string $note): void
    {
        $this->forceFill([
            'account_status' => AccountStatus::Rejected,
            'reviewed_at' => now(),
            'reviewed_by' => $admin->id,
            'rejection_reasons' => $reasons,
            'rejection_reason' => $note,
        ])->save();
    }

    /**
     * Swaps in a new valid ID after a rejection and sends the account back
     * for review. The last review is kept so admins can see it's a resubmission.
     */
    public function resubmitValidId(string $path): void
    {
        $previousPath = $this->valid_id_path;

        $this->forceFill([
            'valid_id_path' => $path,
            'account_status' => AccountStatus::Pending,
        ])->save();

        if ($previousPath && $previousPath !== $path) {
            Storage::disk('local')->delete($previousPath);
        }
    }

    /**
     * Starts a rejected account over with fresh details and a new ID, keeping
     * its applications. Reaching this through the emailed link proves the
     * email address, so it counts as verified.
     *
     * @param  array<string, mixed>  $details  The account type, name and password.
     */
    public function reapply(array $details, string $validIdPath): void
    {
        $this->fill($details);
        $this->forceFill(['terms_accepted_at' => now()]);

        if (! $this->hasVerifiedEmail()) {
            $this->forceFill(['email_verified_at' => now()]);
        }

        $this->resubmitValidId($validIdPath);
    }

    /**
     * A link, valid for two weeks, that lets this rejected account register
     * again without needing to log in.
     */
    public function reapplicationUrl(): string
    {
        return URL::temporarySignedRoute('portal.reapplication.create', now()->addDays(14), ['enrolleeUser' => $this->id]);
    }

    public function sendEmailVerificationNotification(): void
    {
        $this->notify(new VerifyEnrolleeEmail);
    }

    public function getProfilePhotoUrlAttribute(): ?string
    {
        return $this->profile_photo_path
            ? Storage::disk('public')->url($this->profile_photo_path)
            : null;
    }
}
