<?php

namespace App\Providers;

use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureStaffAbilities();
    }

    /**
     * What each staff role may do in the admin panel; see UserRole.
     */
    protected function configureStaffAbilities(): void
    {
        Gate::define('view-dashboard', fn (User $user): bool => $user->role->canViewDashboard());
        Gate::define('review-applications', fn (User $user): bool => $user->role->canReviewApplications());
        Gate::define('handle-payments', fn (User $user): bool => $user->role->canHandlePayments());
        Gate::define('manage-school', fn (User $user): bool => $user->role->canManageSchool());
        Gate::define('manage-staff', fn (User $user): bool => $user->role->canManageStaff());
        Gate::define('upload-document', fn (User $user, string $type): bool => $user->role->canUploadDocument($type));
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
