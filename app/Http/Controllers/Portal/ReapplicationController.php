<?php

namespace App\Http\Controllers\Portal;

use App\Enums\AccountRejectionReason;
use App\Enums\AccountStatus;
use App\Enums\AccountType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Portal\ReapplyEnrolleeUserRequest;
use App\Models\EnrolleeUser;
use App\Models\User;
use App\Notifications\EnrolleeAccountAwaitingReview;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Lets a rejected account create its account again from the signed link in
 * the rejection email, showing what went wrong the first time.
 */
class ReapplicationController extends Controller
{
    public function create(EnrolleeUser $enrolleeUser): Response|RedirectResponse
    {
        if ($enrolleeUser->account_status !== AccountStatus::Rejected) {
            return redirect()
                ->route('portal.login')
                ->with('success', 'This account is no longer waiting to be redone — please log in.');
        }

        return Inertia::render('Portal/Register', [
            'accountTypes' => array_map(
                fn (AccountType $type) => ['value' => $type->value, 'label' => $type->label()],
                AccountType::cases(),
            ),
            'reapplication' => [
                'action' => URL::temporarySignedRoute('portal.reapplication.store', now()->addHours(2), ['enrolleeUser' => $enrolleeUser->id]),
                'email' => $enrolleeUser->email,
                'name' => $enrolleeUser->name,
                'accountType' => $enrolleeUser->account_type?->value,
                'reasons' => $enrolleeUser->rejection_reasons?->map(fn (AccountRejectionReason $reason) => [
                    'label' => $reason->label(),
                    'guidance' => $reason->guidance(),
                ])->values() ?? [],
                'note' => $enrolleeUser->rejection_reason,
            ],
        ]);
    }

    public function store(ReapplyEnrolleeUserRequest $request, EnrolleeUser $enrolleeUser): RedirectResponse
    {
        $path = $request->file('valid_id')->store('valid-ids', 'local');

        if ($path === false) {
            return back()->withErrors(['valid_id' => 'Your ID could not be saved. Please try again.']);
        }

        $enrolleeUser->reapply(
            $request->safe()->only(['account_type', 'name', 'password']),
            $path,
        );

        Notification::send(User::query()->applicationReviewers()->get(), new EnrolleeAccountAwaitingReview($enrolleeUser, isResubmission: true));

        Auth::guard('enrollee')->login($enrolleeUser);
        $request->session()->regenerate();

        return redirect()
            ->route('portal.account-status')
            ->with('success', 'Thanks for trying again! The school will review your account and email you.');
    }
}
