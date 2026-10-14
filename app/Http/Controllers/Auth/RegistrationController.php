<?php

namespace App\Http\Controllers\Auth;

use App\Concerns\DetectsAdmissionIntent;
use App\Enums\AccountRole;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The one sign-up page for everyone. Parents/guardians and students get a
 * portal account; staff roles send a request an admin has to approve.
 */
class RegistrationController extends Controller
{
    use DetectsAdmissionIntent;

    public function create(Request $request): Response
    {
        return Inertia::render('auth/register', [
            'isApplying' => $this->isApplyingForAdmission($request),
            'roles' => AccountRole::options(AccountRole::signUpRoles()),
            'selectedRole' => AccountRole::tryFrom((string) $request->query('role'))?->value,
        ]);
    }
}
