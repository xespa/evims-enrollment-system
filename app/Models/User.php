<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Enums\AccountStatus;
use App\Enums\UserRole;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Appends;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Laravel\Fortify\TwoFactorAuthenticatable;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property UserRole $role
 * @property AccountStatus $account_status
 * @property Carbon|null $invited_at
 * @property Carbon|null $deactivated_at
 * @property string|null $profile_photo_path
 * @property-read string|null $profile_photo_url
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'email', 'password', 'role', 'profile_photo_path'])]
#[Appends(['profile_photo_url'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
            'account_status' => AccountStatus::class,
            'invited_at' => 'datetime',
            'deactivated_at' => 'datetime',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    /**
     * The public URL of the profile photo, or null to show initials instead.
     */
    public function getProfilePhotoUrlAttribute(): ?string
    {
        return $this->profile_photo_path
            ? Storage::disk('public')->url($this->profile_photo_path)
            : null;
    }

    /**
     * Approved accounts that haven't been deactivated. Sign-up requests still
     * waiting on an admin are left out, so they never get staff notifications.
     *
     * @param  Builder<self>  $query
     */
    public function scopeActive(Builder $query): void
    {
        $query->whereNull('deactivated_at')->where('account_status', AccountStatus::Approved);
    }

    /**
     * Active administrators, who set up school years and manage staff.
     *
     * @param  Builder<self>  $query
     */
    public function scopeAdmins(Builder $query): void
    {
        $query->active()->where('role', UserRole::Admin);
    }

    /**
     * Active staff who review applications and portal accounts, and so get
     * notified about them.
     *
     * @param  Builder<self>  $query
     */
    public function scopeApplicationReviewers(Builder $query): void
    {
        $query->active()->whereIn('role', UserRole::applicationReviewers());
    }

    /**
     * Active staff who handle payments, and so get notified about them.
     *
     * @param  Builder<self>  $query
     */
    public function scopePaymentHandlers(Builder $query): void
    {
        $query->active()->whereIn('role', UserRole::paymentHandlers());
    }

    /**
     * The subjects a teacher teaches, which their grade sheets are made from.
     *
     * @return BelongsToMany<Subject, $this>
     */
    public function taughtSubjects(): BelongsToMany
    {
        return $this->belongsToMany(Subject::class)->withTimestamps();
    }

    public function isAdmin(): bool
    {
        return $this->role === UserRole::Admin;
    }

    public function isActive(): bool
    {
        return $this->deactivated_at === null;
    }

    /**
     * Signed up from the sign-up page and still waiting on an admin.
     */
    public function isAwaitingApproval(): bool
    {
        return $this->account_status === AccountStatus::Pending;
    }

    public function isRejected(): bool
    {
        return $this->account_status === AccountStatus::Rejected;
    }

    /**
     * Invited, but hasn't set a password through the invitation link yet.
     */
    public function hasPendingInvitation(): bool
    {
        return $this->invited_at !== null && $this->email_verified_at === null;
    }
}
