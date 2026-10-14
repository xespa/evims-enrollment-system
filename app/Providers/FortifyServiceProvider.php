<?php

namespace App\Providers;

use App\Actions\Fortify\ResetUserPassword;
use App\Concerns\DetectsAdmissionIntent;
use App\Enums\AccountRole;
use App\Enums\UserRole;
use App\Http\Responses\LoginResponse as StaffLoginResponse;
use App\Models\User;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Laravel\Fortify\Contracts\LoginResponse;
use Laravel\Fortify\Contracts\TwoFactorLoginResponse;
use Laravel\Fortify\Features;
use Laravel\Fortify\Fortify;

class FortifyServiceProvider extends ServiceProvider
{
    use DetectsAdmissionIntent;

    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Both a password-only sign-in and one finished with a two-factor
        // code land each role on its own home page.
        $this->app->singleton(LoginResponse::class, StaffLoginResponse::class);
        $this->app->singleton(TwoFactorLoginResponse::class, StaffLoginResponse::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureActions();
        $this->configureViews();
        $this->configureRateLimiting();
    }

    /**
     * Configure Fortify actions.
     */
    private function configureActions(): void
    {
        Fortify::resetUserPasswordsUsing(ResetUserPassword::class);
        // The shared login page posts here when one of the staff roles is
        // picked. The account must hold the role that was picked, so a
        // mismatch fails like a wrong password and gives nothing away.
        Fortify::authenticateUsing(function (Request $request) {
            $request->validate([
                'role' => ['required', Rule::enum(UserRole::class)],
            ], [
                'role.required' => 'Choose who you are signing in as.',
            ]);

            $user = User::where('email', $request->email)->first();

            if (! $user || ! Hash::check((string) $request->password, $user->password) || $user->role !== $request->enum('role', UserRole::class)) {
                return null;
            }

            if ($user->isAwaitingApproval()) {
                throw ValidationException::withMessages([
                    Fortify::username() => 'Your account is waiting for an administrator to approve it. We\'ll email you once it\'s approved.',
                ]);
            }

            if ($user->isRejected()) {
                throw ValidationException::withMessages([
                    Fortify::username() => 'Your account request was not approved. Contact the school administrator if you think this is a mistake.',
                ]);
            }

            if (! $user->isActive()) {
                throw ValidationException::withMessages([
                    Fortify::username() => 'This account has been deactivated.',
                ]);
            }

            return $user;
        });
    }

    /**
     * Configure Fortify views.
     */
    private function configureViews(): void
    {
        // One login page for everyone: the role picked decides which guard
        // the form signs in to.
        Fortify::loginView(function (Request $request) {
            if (Auth::guard('enrollee')->check()) {
                return redirect()->route('portal.dashboard');
            }

            if (Auth::guard('student')->check()) {
                return redirect()->route('student.dashboard');
            }

            return Inertia::render('auth/login', [
                'canResetPassword' => Features::enabled(Features::resetPasswords()),
                'status' => $request->session()->get('status'),
                'isApplying' => $this->isApplyingForAdmission($request),
                'roles' => AccountRole::options(),
                'selectedRole' => AccountRole::tryFrom((string) $request->query('role'))?->value,
            ]);
        });

        Fortify::resetPasswordView(fn (Request $request) => Inertia::render('auth/reset-password', [
            'email' => $request->email,
            'token' => $request->route('token'),
            'passwordRules' => Password::defaults()->toPasswordRulesString(),
        ]));

        Fortify::requestPasswordResetLinkView(fn (Request $request) => Inertia::render('auth/forgot-password', [
            'status' => $request->session()->get('status'),
        ]));

        Fortify::confirmPasswordView(fn () => Inertia::render('auth/confirm-password'));

        Fortify::twoFactorChallengeView(fn () => Inertia::render('auth/two-factor-challenge'));
    }

    /**
     * Configure rate limiting.
     */
    private function configureRateLimiting(): void
    {

        RateLimiter::for('login', function (Request $request) {
            $throttleKey = Str::transliterate(Str::lower($request->input(Fortify::username())).'|'.$request->ip());

            return Limit::perMinute(5)->by($throttleKey);
        });

        // Limits guessing at the six-digit code after a correct password.
        RateLimiter::for('two-factor', function (Request $request) {
            return Limit::perMinute(5)->by($request->session()->get('login.id'));
        });
    }
}
