<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class LoginResponse implements LoginResponseContract
{
    /**
     * Create an HTTP response that represents the object.
     */
    public function toResponse($request): RedirectResponse|JsonResponse
    {
        if ($request->wantsJson()) {
            return response()->json(['two_factor' => false]);
        }

        $user = Auth::user();

        $redirectTo = $user?->isAdmin()
            ? route('admin.dashboard')
            : route('dashboard');

        return redirect()->intended($redirectTo);
    }
}
