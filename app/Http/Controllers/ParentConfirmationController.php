<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateParentConfirmationRequest;
use App\Models\EnrolleeUser;
use App\Models\User;
use App\Notifications\EnrolleeAccountAwaitingReview;
use App\Notifications\ParentConfirmationAnswered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The page a parent opens from the email sent when their child created a
 * student portal account, to confirm or decline it. Opening the link
 * changes nothing — the parent has to press a button — so mail scanners
 * that follow links can't answer for them. The one-time link is the
 * authorization.
 */
class ParentConfirmationController extends Controller
{
    public function show(string $token): Response
    {
        // Just answered: show the outcome rather than the now-used link.
        if ($result = session('parent_confirmation_result')) {
            return Inertia::render('ParentConfirmation/Show', ['request' => null, 'result' => $result]);
        }

        $student = EnrolleeUser::query()->withUsableParentConfirmationToken($token)->first();

        return Inertia::render('ParentConfirmation/Show', [
            'token' => $token,
            'result' => null,
            // Null when the link is wrong, already used, or expired.
            'request' => $student ? [
                'student_name' => $student->name,
                'student_email' => $student->email,
                'expires_at' => $student->parent_confirmation_expires_at?->toIso8601String(),
            ] : null,
        ]);
    }

    public function update(UpdateParentConfirmationRequest $request, string $token): RedirectResponse
    {
        $student = EnrolleeUser::query()->withUsableParentConfirmationToken($token)->firstOrFail();

        $confirmed = $request->confirmed();

        $student->recordParentAnswer($confirmed);
        $student->notify(new ParentConfirmationAnswered($confirmed));

        // The parent was the last thing the review was waiting on.
        if ($student->isReadyForReview()) {
            Notification::send(User::query()->applicationReviewers()->get(), new EnrolleeAccountAwaitingReview($student));
        }

        return redirect()->route('parent-confirmation.show', $token)->with('parent_confirmation_result', [
            'confirmed' => $confirmed,
            'student_name' => $student->name,
        ]);
    }
}
