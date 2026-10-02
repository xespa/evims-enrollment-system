<?php

namespace App\Http\Controllers\Portal;

use App\Enums\AccountRejectionReason;
use App\Enums\AccountStatus;
use App\Http\Controllers\Controller;
use App\Models\EnrolleeUser;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class AccountStatusController extends Controller
{
    /**
     * Shows an account that is waiting for (or was refused) admin approval
     * where its review stands.
     */
    public function __invoke(): Response|RedirectResponse
    {
        /** @var EnrolleeUser $enrollee */
        $enrollee = Auth::guard('enrollee')->user();

        if ($enrollee->isApproved()) {
            return redirect()->route('portal.dashboard');
        }

        // e.g. a name mismatch: they need to redo the whole sign-up, not
        // just upload a new ID.
        if ($enrollee->needsFullSignup()) {
            return redirect()->to($enrollee->reapplicationUrl());
        }

        return Inertia::render('Portal/AccountStatus', [
            'status' => $enrollee->account_status,
            'rejectionReasons' => $enrollee->rejection_reasons?->map(fn (AccountRejectionReason $reason) => [
                'label' => $reason->label(),
                'guidance' => $reason->guidance(),
            ])->values() ?? [],
            'rejectionNote' => $enrollee->rejection_reason,
            // Pending again after a rejection: they've already sent a new ID.
            'hasResubmittedId' => $enrollee->account_status === AccountStatus::Pending && $enrollee->reviewed_at !== null,
        ]);
    }
}
