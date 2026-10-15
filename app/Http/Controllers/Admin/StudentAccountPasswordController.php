<?php

namespace App\Http\Controllers\Admin;

use App\Actions\StudentAccounts\ResetStudentPassword;
use App\Enums\StudentPasswordResetMethod;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateStudentAccountPasswordRequest;
use App\Models\StudentAccount;
use Illuminate\Http\RedirectResponse;

/**
 * Resetting a student's forgotten password from their account page.
 */
class StudentAccountPasswordController extends Controller
{
    /**
     * A temporary password is flashed once so the account page can show it;
     * it is never stored anywhere readable.
     */
    public function update(UpdateStudentAccountPasswordRequest $request, StudentAccount $studentAccount, ResetStudentPassword $resetStudentPassword): RedirectResponse
    {
        $method = $request->resetMethod();
        $temporaryPassword = $resetStudentPassword->handle($studentAccount, $method);
        $firstName = $studentAccount->student->first_name;

        return redirect()
            ->route('admin.student-accounts.show', $studentAccount)
            ->with('temporaryPassword', $temporaryPassword)
            ->with('success', $method === StudentPasswordResetMethod::Lrn
                ? "{$firstName}'s password was reset to their LRN. They'll be asked to choose a new one when they sign in."
                : "{$firstName}'s password was reset. Give them the temporary password below; they'll be asked to choose a new one when they sign in.");
    }
}
