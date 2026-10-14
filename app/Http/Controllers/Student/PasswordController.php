<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\Student\UpdatePasswordRequest;
use App\Models\StudentAccount;
use Illuminate\Http\RedirectResponse;

class PasswordController extends Controller
{
    /**
     * Lets the student replace the first password their parent set.
     */
    public function update(UpdatePasswordRequest $request): RedirectResponse
    {
        /** @var StudentAccount $account */
        $account = $request->user('student');

        $account->update(['password' => $request->validated('password')]);

        return back()->with('success', 'Your password was changed.');
    }
}
