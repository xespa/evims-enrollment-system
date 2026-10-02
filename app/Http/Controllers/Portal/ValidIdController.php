<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Http\Requests\Portal\UpdateValidIdRequest;
use App\Models\EnrolleeUser;
use Illuminate\Http\RedirectResponse;

class ValidIdController extends Controller
{
    /**
     * Replaces the account's valid ID after a rejection and sends the
     * account back to the school for review.
     */
    public function update(UpdateValidIdRequest $request): RedirectResponse
    {
        /** @var EnrolleeUser $enrollee */
        $enrollee = $request->user('enrollee');

        $path = $request->file('valid_id')->store('valid-ids', 'local');

        if ($path === false) {
            return back()->withErrors(['valid_id' => 'Your ID could not be saved. Please try again.']);
        }

        $enrollee->resubmitValidId($path);

        return redirect()
            ->route('portal.account-status')
            ->with('success', 'Thanks! Your new ID was sent. The school will review your account again.');
    }
}
