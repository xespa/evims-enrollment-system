<?php

namespace App\Listeners;

use App\Enums\AuditAction;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Login;
use Laravel\Fortify\Events\RecoveryCodesGenerated;
use Laravel\Fortify\Events\TwoFactorAuthenticationConfirmed;
use Laravel\Fortify\Events\TwoFactorAuthenticationDisabled;

/**
 * Writes staff sign-ins and two-factor changes to the audit log. Portal
 * (enrollee) sign-ins use another guard and aren't recorded here.
 */
class RecordSecurityAuditLog
{
    public function handleLogin(Login $event): void
    {
        if ($event->guard !== 'web' || ! $event->user instanceof User) {
            return;
        }

        AuditLog::record(AuditAction::SignedIn, $event->user, ['remembered' => $event->remember], $event->user);
    }

    public function handleFailed(Failed $event): void
    {
        if ($event->guard !== 'web') {
            return;
        }

        $user = $event->user instanceof User ? $event->user : null;

        // Only the address typed is kept; never the password.
        AuditLog::record(AuditAction::SignInFailed, $user, [
            'email' => is_string($event->credentials['email'] ?? null) ? $event->credentials['email'] : null,
        ], $user);
    }

    public function handleTwoFactorConfirmed(TwoFactorAuthenticationConfirmed $event): void
    {
        AuditLog::record(AuditAction::TwoFactorEnabled, $event->user);
    }

    public function handleTwoFactorDisabled(TwoFactorAuthenticationDisabled $event): void
    {
        // Fortify also fires this when a setup that was never confirmed is
        // cancelled or cleared; only turning off a confirmed one is recorded.
        if (! array_key_exists('two_factor_confirmed_at', $event->user->getChanges())) {
            return;
        }

        AuditLog::record(AuditAction::TwoFactorDisabled, $event->user);
    }

    public function handleRecoveryCodesGenerated(RecoveryCodesGenerated $event): void
    {
        // Codes are also made when two-factor is first turned on; only a
        // deliberate regeneration is recorded.
        if (! request()->routeIs('two-factor.regenerate-recovery-codes')) {
            return;
        }

        AuditLog::record(AuditAction::RecoveryCodesRegenerated, $event->user);
    }
}
