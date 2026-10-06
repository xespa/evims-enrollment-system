<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\PasswordUpdateRequest;
use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Http\Requests\Settings\TwoFactorAuthenticationRequest;
use App\Models\User;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Fortify\Fortify;

class SettingsController extends Controller
{
    /**
     * Show the admin's profile settings page.
     */
    public function editProfile(Request $request): Response
    {
        return Inertia::render('Admin/Settings/Profile', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Show the admin's security settings page.
     */
    public function editSecurity(TwoFactorAuthenticationRequest $request): Response
    {
        // Clears a two-factor setup that was started but never confirmed.
        $request->ensureStateIsValid();

        /** @var User $user */
        $user = $request->user();
        $isPending = $user->two_factor_secret !== null && $user->two_factor_confirmed_at === null;
        $status = $request->session()->get('status');
        // Shown once, right after they're made; otherwise only on request.
        $justMadeRecoveryCodes = in_array($status, [
            Fortify::TWO_FACTOR_AUTHENTICATION_CONFIRMED,
            Fortify::RECOVERY_CODES_GENERATED,
        ], true);

        return Inertia::render('Admin/Settings/Security', [
            'passwordRules' => Password::defaults()->toPasswordRulesString(),
            'twoFactor' => [
                'isEnabled' => $user->hasEnabledTwoFactorAuthentication(),
                'isPending' => $isPending,
                'isRequired' => $user->role->requiresTwoFactor(),
                'qrCodeSvg' => $isPending ? $user->twoFactorQrCodeSvg() : null,
                'setupKey' => $isPending ? decrypt($user->two_factor_secret) : null,
            ],
            'status' => $status,
            'recoveryCodes' => $justMadeRecoveryCodes
                ? $user->recoveryCodes()
                : Inertia::optional(fn (): array => $user->hasEnabledTwoFactorAuthentication() ? $user->recoveryCodes() : []),
        ]);
    }

    /**
     * Update the admin's profile information.
     */
    public function updateProfile(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return to_route('admin.settings.profile.edit')->with('success', 'Profile updated.');
    }

    /**
     * Update the admin's password.
     */
    public function updatePassword(PasswordUpdateRequest $request): RedirectResponse
    {
        $request->user()->update([
            'password' => $request->password,
        ]);

        return back()->with('success', 'Password updated.');
    }

    /**
     * Delete the admin's account.
     */
    public function destroy(ProfileDeleteRequest $request): RedirectResponse
    {
        $user = $request->user();

        if ($user instanceof User && $user->isAdmin() && User::query()->admins()->count() === 1) {
            throw ValidationException::withMessages([
                'password' => "You're the only administrator. Make someone else an administrator before deleting your account.",
            ]);
        }

        Auth::logout();

        $user->delete();

        if ($user->profile_photo_path) {
            Storage::disk('public')->delete($user->profile_photo_path);
        }

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
