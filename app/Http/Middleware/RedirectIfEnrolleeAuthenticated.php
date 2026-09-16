<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class RedirectIfEnrolleeAuthenticated
{
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::guard('enrollee')->check()) {
            return redirect()->route('portal.dashboard');
        }

        return $next($request);
    }
}
