<?php

namespace App\Http\Controllers\Admin;

use App\Enums\AccountRejectionReason;
use App\Enums\AccountStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateEnrolleeAccountRequest;
use App\Models\EnrolleeUser;
use App\Models\User;
use App\Notifications\EnrolleeAccountReviewed;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class EnrolleeAccountController extends Controller
{
    /**
     * Portal accounts for admins to review, pending ones first by default.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', EnrolleeUser::class);

        $validated = $request->validate([
            'status' => ['nullable', Rule::enum(AccountStatus::class)],
            'search' => ['nullable', 'string', 'max:255'],
        ]);

        $status = $validated['status'] ?? AccountStatus::Pending->value;
        $search = $validated['search'] ?? '';

        $accounts = EnrolleeUser::query()
            ->select(['id', 'name', 'email', 'account_type', 'email_verified_at', 'account_status', 'reviewed_at', 'reviewed_by', 'rejection_reasons', 'rejection_reason', 'valid_id_path', 'created_at'])
            ->with([
                'reviewer:id,name',
                'enrollments:id,enrollee_user_id,student_id,grade_level_id,school_year,enrollment_status',
                'enrollments.student:id,first_name,last_name',
                'enrollments.gradeLevel:id,name',
            ])
            ->where('account_status', $status)
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->oldest()
            ->paginate(15)
            ->withQueryString()
            // The path itself stays hidden; the page only needs to know
            // whether there's an ID to link to, and whether to preview it
            // as a PDF or an image.
            ->through(fn (EnrolleeUser $account) => $account
                ->setAttribute('has_valid_id', $account->valid_id_path !== null)
                ->setAttribute('valid_id_is_pdf', str_ends_with(strtolower((string) $account->valid_id_path), '.pdf')));

        return Inertia::render('Admin/EnrolleeAccounts/Index', [
            'accounts' => $accounts,
            'counts' => EnrolleeUser::query()
                ->selectRaw('account_status, count(*) as total')
                ->groupBy('account_status')
                ->pluck('total', 'account_status'),
            // Pending accounts that can't be approved until their owner
            // confirms their email.
            'awaitingEmailCount' => EnrolleeUser::query()
                ->where('account_status', AccountStatus::Pending)
                ->whereNull('email_verified_at')
                ->count(),
            'filters' => [
                'status' => $status,
                'search' => $search,
            ],
            'rejectionReasons' => array_map(
                fn (AccountRejectionReason $reason) => ['value' => $reason->value, 'label' => $reason->label()],
                AccountRejectionReason::cases(),
            ),
        ]);
    }

    /**
     * Approves or rejects a portal account, then tells the parent.
     */
    public function update(UpdateEnrolleeAccountRequest $request, EnrolleeUser $enrolleeUser): RedirectResponse
    {
        /** @var User $admin Admin routes use the staff (web) guard. */
        $admin = $request->user();

        $status = $request->enum('account_status', AccountStatus::class);

        $reasons = array_map(
            fn (string $reason) => AccountRejectionReason::from($reason),
            $request->validated('rejection_reasons', []),
        );
        $note = $request->filled('rejection_reason') ? $request->string('rejection_reason')->toString() : null;

        if ($status === AccountStatus::Approved) {
            $enrolleeUser->approve($admin);
        } else {
            $enrolleeUser->reject($admin, $reasons, $note);
        }

        $enrolleeUser->notify(new EnrolleeAccountReviewed($status, $reasons, $note));

        $message = $status === AccountStatus::Approved
            ? "{$enrolleeUser->name}'s account was approved."
            : "{$enrolleeUser->name}'s account was rejected.";

        return back()->with('success', $message);
    }
}
