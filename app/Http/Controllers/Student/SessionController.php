<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\Student\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Students signing in and out with their LRN.
 */
class SessionController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Student/Login');
    }

    public function store(LoginRequest $request): RedirectResponse
    {
        Auth::guard('student')->login($request->authenticatedAccount(), $request->boolean('remember'));

        $request->session()->regenerate();

        return redirect()->intended(route('student.dashboard'));
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('student')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('student.login');
    }
}
