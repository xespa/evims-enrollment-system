<?php

namespace App\Models;

use App\Enums\AuditAction;
use App\Enums\UserRole;
use Database\Factories\AuditLogFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Carbon;
use LogicException;

/**
 * One entry in the staff audit log. Entries are written once and never
 * changed; see record().
 *
 * @property int $id
 * @property int|null $user_id
 * @property AuditAction $action
 * @property string|null $subject_type
 * @property int|null $subject_id
 * @property array<string, mixed>|null $properties
 * @property string|null $ip_address
 * @property Carbon $created_at
 */
class AuditLog extends Model
{
    /** @use HasFactory<AuditLogFactory> */
    use HasFactory;

    public const UPDATED_AT = null;

    protected $fillable = ['user_id', 'action', 'subject_type', 'subject_id', 'properties', 'ip_address'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'action' => AuditAction::class,
            'properties' => 'array',
            'created_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::updating(function (): never {
            throw new LogicException('Audit log entries cannot be changed.');
        });
    }

    /**
     * Write an entry for the current request. The actor defaults to the
     * signed-in staff member; pass one when nobody is signed in yet (e.g.
     * accepting an invitation).
     *
     * @param  array<string, mixed>  $properties  Never put passwords, tokens, or student details here.
     */
    public static function record(AuditAction $action, ?Model $subject = null, array $properties = [], ?User $actor = null): self
    {
        $request = request();
        $actor ??= $request->user('web');

        return self::create([
            'user_id' => $actor?->getKey(),
            'action' => $action,
            'subject_type' => $subject?->getMorphClass(),
            'subject_id' => $subject?->getKey(),
            'properties' => $properties ?: null,
            'ip_address' => $request->ip(),
        ]);
    }

    /**
     * A short, human-readable note about the entry, e.g. "Cashier → Registrar".
     */
    public function details(): ?string
    {
        $properties = $this->properties ?? [];
        $roleLabel = fn (mixed $value): string => is_string($value)
            ? (UserRole::tryFrom($value)?->label() ?? $value)
            : '';

        return match ($this->action) {
            AuditAction::StaffInvited => 'as '.$roleLabel($properties['role'] ?? null),
            AuditAction::RoleChanged => $roleLabel($properties['from'] ?? null).' → '.$roleLabel($properties['to'] ?? null),
            AuditAction::DocumentUploaded => (OfficeVerification::DOCUMENT_COLUMNS[$properties['document'] ?? '']['label'] ?? 'Document')
                .(($properties['replaced'] ?? false) ? ' (replaced the old file)' : ''),
            AuditAction::SignInFailed => isset($properties['email']) ? "as {$properties['email']}" : null,
            AuditAction::SignedIn => ($properties['remembered'] ?? false) ? 'stayed signed in' : null,
            default => null,
        };
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return MorphTo<Model, $this>
     */
    public function subject(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * @param  Builder<self>  $query
     */
    public function scopeLatestFirst(Builder $query): void
    {
        $query->latest('created_at')->latest('id');
    }
}
