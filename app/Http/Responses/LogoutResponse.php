<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Laravel\Fortify\Contracts\LogoutResponse as LogoutResponseContract;
use Laravel\Fortify\Fortify;

/**
 * Where to go after logging out. "Switch account" (any guard) sends the
 * person straight to the shared login page to log in as someone else;
 * a plain staff log out goes to the website as before.
 */
class LogoutResponse implements LogoutResponseContract
{
    /**
     * Create an HTTP response that represents the object.
     */
    public function toResponse($request): RedirectResponse|JsonResponse
    {
        if ($request->wantsJson()) {
            return new JsonResponse('', 204);
        }

        return self::isSwitchingAccount($request)
            ? self::toLoginForAnotherAccount()
            : redirect(Fortify::redirects('logout', '/'));
    }

    /**
     * The log out came from a "Switch account" button.
     */
    public static function isSwitchingAccount(Request $request): bool
    {
        return $request->boolean('switch_account');
    }

    public static function toLoginForAnotherAccount(): RedirectResponse
    {
        return redirect()
            ->route('login')
            ->with('status', 'You\'ve been logged out. Log in with the account you want to use.');
    }
}
