<?php

namespace App\Http\Controllers\Portal;

use App\Enums\AccountRole;
use App\Enums\AccountType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Portal\StoreEnrolleeUserRequest;
use App\Models\EnrolleeUser;
use App\Notifications\ConfirmEmailReminder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Portal accounts for parents/guardians and students. The forms themselves
 * live on the shared login and sign-up pages.
 */
class AuthController extends Controller
{
    /**
     * The old portal sign-up address, kept so existing links still work.
     */
    public function create(): RedirectResponse
    {
        return redirect()->route('register', ['role' => AccountRole::ParentGuardian->value]);
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

    /**
     * The old portal login address, kept so existing links still work.
     */
    public function showLogin(): RedirectResponse
    {
        return redirect()->route('login', ['role' => AccountRole::ParentGuardian->value]);
    }

    /**
     * Signs in a parent/guardian or student portal account. The account must
     * be the type picked on the login page.
     */
    public function login(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'account_type' => ['required', Rule::enum(AccountType::class)],
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

        return redirect()->route('login');
    }
}
