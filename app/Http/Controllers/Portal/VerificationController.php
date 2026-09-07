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

        return Inertia::render('Portal/VerifyEmail');
    }

    public function verify(Request $request, int $id, string $hash): RedirectResponse
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

        return redirect()->route('portal.dashboard')->with('success', 'Email verified! Your applications have been linked to your account.');
    }

    public function resend(): RedirectResponse
    {
        $enrollee = Auth::guard('enrollee')->user();

        if ($enrollee->hasVerifiedEmail()) {
            return redirect()->route('portal.dashboard');
        }

        $enrollee->sendEmailVerificationNotification();

        return back()->with('success', 'Verification link sent.');
    }
}
