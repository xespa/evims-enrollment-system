<?php

namespace App\Http\Controllers\Portal;

use App\Actions\EnrolleeAccounts\RequestParentConfirmation;
use App\Http\Controllers\Controller;
use App\Http\Requests\Portal\UpdateParentEmailRequest;
use App\Models\EnrolleeUser;
use Illuminate\Http\RedirectResponse;

/**
 * A student re-sending the confirmation to their parent or guardian — after
 * the link expired, the parent declined, or the email was mistyped.
 */
class ParentEmailController extends Controller
{
    public function update(UpdateParentEmailRequest $request, RequestParentConfirmation $requestParentConfirmation): RedirectResponse
    {
        /** @var EnrolleeUser $student */
        $student = $request->user('enrollee');

        $parentEmail = $request->string('parent_email')->toString();

        $requestParentConfirmation->handle($student, $parentEmail);

        return back()->with('success', "We emailed {$parentEmail} a new confirmation link.");
    }
}
