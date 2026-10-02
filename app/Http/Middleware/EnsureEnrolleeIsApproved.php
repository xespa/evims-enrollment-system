<?php

namespace App\Http\Middleware;

use App\Models\EnrolleeUser;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Keeps portal accounts an admin hasn't approved out of the portal, sending
 * them to a page that explains where their review stands.
 */
class EnsureEnrolleeIsApproved
{
    public function handle(Request $request, Closure $next): Response
    {
        /** @var EnrolleeUser|null $enrollee */
        $enrollee = Auth::guard('enrollee')->user();

        if (! $enrollee?->isApproved()) {
            abort_if($request->expectsJson(), 403, 'Your account must be approved by the school first.');

            return redirect()
                ->route('portal.account-status')
                ->with('error', 'Your account must be approved by the school before you can do that.');
        }

        return $next($request);
    }
}
