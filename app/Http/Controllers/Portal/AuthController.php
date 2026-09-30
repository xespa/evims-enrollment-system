<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\EnrolleeUser;
use App\Services\PendingEnrollment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
    public function create(Request $request, PendingEnrollment $pendingEnrollment): Response
    {
        return Inertia::render('Portal/Register', [
            'prefillName' => $request->query('name', ''),
            'prefillEmail' => $request->query('email', ''),
            'hasPendingApplication' => $pendingEnrollment->exists(),
        ]);
    }

    public function store(Request $request, PendingEnrollment $pendingEnrollment): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:enrollee_users,email'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $enrollee = EnrolleeUser::create($validated);

        Auth::guard('enrollee')->login($enrollee);

        $enrollee->sendEmailVerificationNotification();

        return $this->submitPendingApplication($pendingEnrollment, $enrollee)
            ?? redirect()->route('portal.verification.notice');
    }

    public function showLogin(PendingEnrollment $pendingEnrollment): Response
    {
        return Inertia::render('Portal/Login', [
            'hasPendingApplication' => $pendingEnrollment->exists(),
        ]);
    }

    public function login(Request $request, PendingEnrollment $pendingEnrollment): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (! Auth::guard('enrollee')->attempt($credentials, $request->boolean('remember'))) {
            throw ValidationException::withMessages([
                'email' => __('These credentials do not match our records.'),
            ]);
        }

        $request->session()->regenerate();

        return $this->submitPendingApplication($pendingEnrollment, Auth::guard('enrollee')->user())
            ?? redirect()->intended(route('portal.dashboard'));
    }

    /**
     * A guest who filled in the admission form before having an account was
     * sent here to register or log in (see EnrollmentController::store) —
     * submit that held application now that they're authenticated.
     */
    private function submitPendingApplication(PendingEnrollment $pendingEnrollment, EnrolleeUser $enrollee): ?RedirectResponse
    {
        $enrollment = $pendingEnrollment->submitFor($enrollee);

        if (! $enrollment) {
            return null;
        }

        return redirect()
            ->route('admission.success', $enrollment->id)
            ->with('success', 'Your account is ready and your application has been submitted.');
    }

    public function logout(Request $request): RedirectResponse
    {
        Auth::guard('enrollee')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('portal.login');
    }
}
