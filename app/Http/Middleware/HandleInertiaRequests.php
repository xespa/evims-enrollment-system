<?php

namespace App\Http\Middleware;

use App\Models\Curriculum;
use App\Models\OfficeVerification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $enrollee = Auth::guard('enrollee')->user();

        return [
            ...parent::share($request),
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'name' => config('app.name'),
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            // The school year applications are open for (null when closed),
            // for the navbar's enroll button.
            'enrollment' => [
                'openSchoolYear' => fn () => Curriculum::applicationSchoolYear(),
            ],
            'auth' => [
                'user' => $request->user(),
                'enrollee' => $enrollee,
                'unreadNotificationsCount' => $enrollee ? fn () => $enrollee->unreadNotifications()->count() : 0,
                // Kept apart from the enrollee's, since both can be signed in at once.
                'userUnreadNotificationsCount' => fn () => $request->user()?->unreadNotifications()->count() ?? 0,
                // The staff account is read from the web guard explicitly, as
                // portal pages make the enrollee guard the default.
                'roleLabel' => fn () => $this->staffUser($request)?->role->label(),
                // What the signed-in staff member may do, so pages can hide
                // what they can't use. The routes enforce it regardless.
                'can' => fn () => $this->staffAbilities($this->staffUser($request)),
            ],
        ];
    }

    private function staffUser(Request $request): ?User
    {
        $user = $request->user('web');

        return $user instanceof User ? $user : null;
    }

    /**
     * @return array{viewDashboard: bool, reviewApplications: bool, handlePayments: bool, manageSchool: bool, manageStaff: bool, uploadDocumentTypes: list<string>}|null
     */
    private function staffAbilities(?User $user): ?array
    {
        if ($user === null) {
            return null;
        }

        return [
            'viewDashboard' => $user->can('view-dashboard'),
            'reviewApplications' => $user->can('review-applications'),
            'handlePayments' => $user->can('handle-payments'),
            'manageSchool' => $user->can('manage-school'),
            'manageStaff' => $user->can('manage-staff'),
            'uploadDocumentTypes' => array_values(array_filter(
                array_keys(OfficeVerification::DOCUMENT_COLUMNS),
                fn (string $type): bool => $user->can('upload-document', $type),
            )),
        ];
    }
}
