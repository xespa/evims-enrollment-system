<?php

namespace App\Http\Controllers;

use App\Actions\StudentAccounts\RecordParentConsent;
use App\Http\Requests\UpdateStudentAccountConsentRequest;
use App\Models\StudentAccount;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The page a parent opens from the consent email, to agree to or decline
 * their child's student account. The one-time link is the authorization.
 */
class StudentAccountConsentController extends Controller
{
    public function show(string $token): Response
    {
        // Just answered: show the outcome rather than the now-used link.
        if ($result = session('consent_result')) {
            return Inertia::render('StudentConsent/Show', ['request' => null, 'result' => $result]);
        }

        $account = StudentAccount::query()
            ->withUsableConsentToken($token)
            ->with('student:id,first_name,last_name,lrn')
            ->first();

        $enrollment = $account?->student->latestApprovedEnrollment()?->load('gradeLevel:id,name');

        return Inertia::render('StudentConsent/Show', [
            'token' => $token,
            'result' => null,
            // Null when the link is wrong, already used, or expired.
            'request' => $account ? [
                'student_name' => trim("{$account->student->first_name} {$account->student->last_name}"),
                'lrn' => $account->student->lrn,
                'grade_level' => $enrollment?->gradeLevel?->name,
                'school_year' => $enrollment?->school_year,
                'expires_at' => $account->consent_expires_at?->toIso8601String(),
            ] : null,
        ]);
    }

    public function update(UpdateStudentAccountConsentRequest $request, string $token, RecordParentConsent $recordParentConsent): RedirectResponse
    {
        $account = StudentAccount::query()
            ->withUsableConsentToken($token)
            ->with('student:id,first_name,last_name,lrn')
            ->firstOrFail();

        $agreed = $request->agreed();

        $recordParentConsent->handle(
            $account,
            $agreed,
            $request->string('parent_name')->trim()->toString(),
            $agreed ? $request->validated('password') : null,
        );

        return redirect()->route('student-consent.show', $token)->with('consent_result', [
            'agreed' => $agreed,
            'student_first_name' => $account->student->first_name,
            'lrn' => $agreed ? $account->student->lrn : null,
        ]);
    }
}
