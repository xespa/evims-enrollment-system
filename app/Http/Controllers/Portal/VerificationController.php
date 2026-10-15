<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\EnrolleeUser;
use App\Models\Enrollment;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class VerificationController extends Controller
{
    public function notice(): Response|RedirectResponse
    {
        $enrollee = Auth::guard('enrollee')->user();

        if ($enrollee->hasVerifiedEmail()) {
            return redirect()->route('portal.dashboard');
        }

        return Inertia::render('Portal/VerifyEmail', [
            'email' => $enrollee->email,
        ]);
    }

    /**
     * Confirms the email from the signed link. Whoever owns the inbox can
     * open it in any browser, so it doesn't need a portal login.
     */
    public function verify(Request $request, int $id, string $hash): Response|RedirectResponse
    {
        $enrollee = EnrolleeUser::findOrFail($id);

        if (! hash_equals((string) $hash, sha1($enrollee->getEmailForVerification()))) {
            abort(403);
        }

        if (! $enrollee->hasVerifiedEmail()) {
            $enrollee->markEmailAsVerified();
            event(new Verified($enrollee));

            Enrollment::where('email', $enrollee->email)
                ->whereNull('enrollee_user_id')
                ->update(['enrollee_user_id' => $enrollee->id]);
        }

        // Opened somewhere this account isn't signed in, so there's no
        // portal page to send them to; they log in from here.
        if (Auth::guard('enrollee')->id() !== $enrollee->id) {
            return Inertia::render('Portal/EmailVerified', [
                'email' => $enrollee->email,
            ]);
        }

        // Back to where they were headed — usually the admission form.
        return redirect($this->portalIntendedUrl($request))
            ->with('success', 'Email verified! Your applications have been linked to your account.');
    }

    /**
     * The page the enrollee was headed to before confirming their email.
     * The intended URL is shared by every guard in the session, so one left
     * behind by a staff login (an admin page) is ignored.
     */
    private function portalIntendedUrl(Request $request): string
    {
        $intended = $request->session()->pull('url.intended');
        $path = is_string($intended) ? '/'.ltrim((string) parse_url($intended, PHP_URL_PATH), '/') : null;

        $isPortalPage = $path !== null && collect(['/portal', '/admission'])
            ->contains(fn (string $prefix): bool => $path === $prefix || str_starts_with($path, "{$prefix}/"));

        return $isPortalPage ? $intended : route('portal.dashboard');
    }

    public function resend(): RedirectResponse
    {
        $enrollee = Auth::guard('enrollee')->user();

        if ($enrollee->hasVerifiedEmail()) {
            return redirect()->route('portal.dashboard');
        }

        $enrollee->sendEmailVerificationNotification();

        return back()->with('success', "We sent a new link to {$enrollee->email}.");
    }
}
