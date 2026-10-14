<?php

namespace App\Http\Controllers\Student;

use App\Enums\AccountRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Student\LoginRequest;
use App\Http\Responses\LogoutResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Students signing in and out with their LRN. The form is on the shared
 * login page, under "Student".
 */
class SessionController extends Controller
{
    /**
     * The old student sign-in address, kept so emailed links still work.
     */
    public function create(): RedirectResponse
    {
        return redirect()->route('login', ['role' => AccountRole::Student->value]);
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

        if (LogoutResponse::isSwitchingAccount($request)) {
            return LogoutResponse::toLoginForAnotherAccount();
        }

        return redirect()->route('login', ['role' => AccountRole::Student->value]);
    }
}
