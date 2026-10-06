<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Lets any staff role into the admin panel (each page then checks its own
 * ability), but signs out an account the moment it's deactivated, even
 * mid-session.
 */
class EnsureStaffIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user instanceof User && ! $user->isActive()) {
            Auth::guard('web')->logout();

            $request->session()->invalidate();
            $request->session()->regenerateToken();

            if ($request->expectsJson()) {
                abort(403, 'This account has been deactivated.');
            }

            return redirect()->route('login')->withErrors([
                'email' => 'This account has been deactivated.',
            ]);
        }

        return $next($request);
    }
}
