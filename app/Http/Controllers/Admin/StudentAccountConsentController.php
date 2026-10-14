<?php

namespace App\Http\Controllers\Admin;

use App\Actions\StudentAccounts\RequestParentConsent;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreStudentAccountConsentRequest;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\RedirectResponse;

class StudentAccountConsentController extends Controller
{
    /**
     * Emails the parent a link to consent to the student's account, or
     * resends it with a fresh link.
     */
    public function store(StoreStudentAccountConsentRequest $request, Student $student, RequestParentConsent $requestParentConsent): RedirectResponse
    {
        /** @var User $admin Admin routes use the staff (web) guard. */
        $admin = $request->user();

        $account = $requestParentConsent->handle($student, $admin);

        return back()->with('success', "Consent email sent to {$account->consent_email}. The account stays inactive until the parent agrees.");
    }
}
