<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Keeps staff whose role requires two-factor authentication on their
 * settings pages until they've set it up.
 */
class EnsureTwoFactorIsEnabled
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (
            $user instanceof User
            && $user->role->requiresTwoFactor()
            && ! $user->hasEnabledTwoFactorAuthentication()
            && ! $request->routeIs('admin.settings.*')
        ) {
            if ($request->expectsJson()) {
                abort(403, 'Set up two-factor authentication to continue.');
            }

            // The security page explains why they landed there.
            return redirect()->route('admin.settings.security.edit');
        }

        return $next($request);
    }
}
