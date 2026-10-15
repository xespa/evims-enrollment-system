<?php

namespace App\Models;

use App\Enums\StudentAccountStatus;
use Database\Factories\StudentAccountFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * A student's sign-in account for the student portal (and, later, the
 * gradesheets teachers encode). It belongs to one student, so it's bound
 * to their LRN: students sign in with the LRN and a password. It can only
 * be used after a parent or guardian consents from the emailed link.
 *
 * @property int $id
 * @property int $student_id
 * @property StudentAccountStatus $status
 * @property string|null $password
 * @property bool $must_change_password
 * @property string $consent_email
 * @property string|null $consent_token
 * @property Carbon|null $consent_requested_at
 * @property Carbon|null $consent_expires_at
 * @property int|null $consent_requested_by
 * @property string|null $consent_given_by
 * @property Carbon|null $consent_responded_at
 */
class StudentAccount extends Authenticatable
{
    /** @use HasFactory<StudentAccountFactory> */
    use HasFactory;

    /** How long the emailed consent link stays usable. */
    public const CONSENT_LINK_DAYS = 7;

    protected $fillable = [
        'student_id',
        'status',
        'password',
        'consent_email',
        'consent_requested_at',
        'consent_expires_at',
        'consent_requested_by',
        'consent_given_by',
        'consent_responded_at',
    ];

    protected $hidden = ['password', 'remember_token', 'consent_token'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => StudentAccountStatus::class,
            'password' => 'hashed',
            'must_change_password' => 'boolean',
            'consent_requested_at' => 'datetime',
            'consent_expires_at' => 'datetime',
            'consent_responded_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Student, $this>
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function consentRequestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'consent_requested_by');
    }

    public function isActive(): bool
    {
        return $this->status === StudentAccountStatus::Active;
    }

    /**
     * Still signing in with the starting password, their LRN. The password
     * is hashed, so this checks the LRN against it rather than reading it.
     */
    public function usesLrnAsPassword(): bool
    {
        $lrn = $this->student->lrn;

        return $lrn !== null && $this->password !== null && Hash::check($lrn, $this->password);
    }

    /**
     * Where the password stands, for staff: never the password itself.
     * Null until the account is active.
     *
     * @return array{value: 'RESET'|'STARTING'|'CHANGED', label: string}|null
     */
    public function passwordStatus(): ?array
    {
        return match (true) {
            ! $this->isActive() => null,
            $this->must_change_password => ['value' => 'RESET', 'label' => 'Reset by the school; must be changed at next sign-in'],
            $this->usesLrnAsPassword() => ['value' => 'STARTING', 'label' => 'Still the starting password (their LRN)'],
            default => ['value' => 'CHANGED', 'label' => 'Changed by the student'],
        };
    }

    /**
     * Starts a new consent request: a fresh one-time token, replacing any
     * earlier link. Returns the plain token for the email; only its hash
     * is stored.
     */
    public function issueConsentToken(): string
    {
        $token = Str::random(64);

        $this->forceFill([
            'consent_token' => self::hashConsentToken($token),
            'consent_expires_at' => now()->addDays(self::CONSENT_LINK_DAYS),
        ]);

        return $token;
    }

    /**
     * The account an emailed consent link points to, while the link is
     * still unanswered and unexpired.
     *
     * @param  Builder<self>  $query
     */
    public function scopeWithUsableConsentToken(Builder $query, string $token): void
    {
        $query->where('consent_token', self::hashConsentToken($token))
            ->where('status', StudentAccountStatus::AwaitingConsent)
            ->where('consent_expires_at', '>', now());
    }

    public static function hashConsentToken(string $token): string
    {
        return hash('sha256', $token);
    }
}
