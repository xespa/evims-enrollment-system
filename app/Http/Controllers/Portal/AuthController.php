<?php

namespace App\Http\Controllers\Portal;

use App\Enums\AccountType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Portal\StoreEnrolleeUserRequest;
use App\Models\EnrolleeUser;
use App\Notifications\ConfirmEmailReminder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
    public function create(Request $request): Response
    {
        return Inertia::render('Portal/Register', [
            'isApplying' => $this->isApplying($request),
            'accountTypes' => array_map(
                fn (AccountType $type) => ['value' => $type->value, 'label' => $type->label()],
                AccountType::cases(),
            ),
        ]);
    }

    public function store(StoreEnrolleeUserRequest $request): RedirectResponse
    {
        $enrollee = EnrolleeUser::create([
            ...$request->safe()->only(['account_type', 'name', 'email', 'password']),
            // A government ID is personal data, so it stays on the private
            // disk and is only ever served to admins.
            'valid_id_path' => $request->file('valid_id')->store('valid-ids', 'local'),
            'terms_accepted_at' => now(),
        ]);

        Auth::guard('enrollee')->login($enrollee);

        $enrollee->sendEmailVerificationNotification();
        $enrollee->notify(new ConfirmEmailReminder);

        return redirect()->route('portal.verification.notice');
    }

    public function showLogin(Request $request): Response
    {
        return Inertia::render('Portal/Login', [
            'isApplying' => $this->isApplying($request),
        ]);
    }

    public function login(Request $request): RedirectResponse
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

        return redirect()->intended(route('portal.dashboard'));
    }

    public function logout(Request $request): RedirectResponse
    {
        Auth::guard('enrollee')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('portal.login');
    }

    /**
     * Whether the visitor was sent here on their way to the admission form,
     * which needs an account first.
     */
    private function isApplying(Request $request): bool
    {
        return str_starts_with((string) $request->session()->get('url.intended', ''), route('admission.create'));
    }
}
