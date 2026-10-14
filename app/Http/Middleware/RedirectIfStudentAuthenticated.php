<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class RedirectIfStudentAuthenticated
{
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::guard('student')->check()) {
            return redirect()->route('student.dashboard');
        }

        return $next($request);
    }
}
