<?php

namespace App\Http\Controllers\Admin;

use App\Actions\StudentAccounts\CreateStudentAccount;
use App\Enums\StudentAccountStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexStudentAccountRequest;
use App\Http\Requests\Admin\StoreStudentAccountRequest;
use App\Models\Student;
use App\Models\StudentAccount;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Students' sign-in accounts, bound to their LRN, which they use to see
 * their grades. A parent consents first (see StudentAccountConsentController),
 * then staff create the account here.
 */
class StudentAccountController extends Controller
{
    /**
     * Every student with an approved application and where their account
     * stands, so staff can ask for consent and create accounts in one place.
     */
    public function index(IndexStudentAccountRequest $request): Response
    {
        $status = $request->status();
        $search = (string) $request->validated('search', '');

        $students = Student::query()
            ->withApprovedEnrollment()
            ->with([
                'account',
                'approvedEnrollment.gradeLevel:id,name',
            ])
            ->when($status === IndexStudentAccountRequest::NONE, fn (Builder $query) => $query->whereDoesntHave('account'))
            ->when(
                ! in_array($status, [IndexStudentAccountRequest::ALL, IndexStudentAccountRequest::NONE], true),
                fn (Builder $query) => $query->whereHas('account', fn (Builder $account) => $account->where('status', $status)),
            )
            ->when($search !== '', fn (Builder $query) => $query->where(function (Builder $query) use ($search): void {
                $query->where('last_name', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('lrn', 'like', "%{$search}%");
            }))
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (Student $student): array => [
                'id' => $student->id,
                'name' => trim("{$student->first_name} {$student->last_name}"),
                'lrn' => $student->lrn,
                'grade_level' => $student->approvedEnrollment?->gradeLevel?->name,
                'school_year' => $student->approvedEnrollment?->school_year,
                'enrollment_id' => $student->approvedEnrollment?->id,
                'account' => $student->accountSummary($student->approvedEnrollment),
            ]);

        return Inertia::render('Admin/StudentAccounts/Index', [
            'students' => $students,
            'statuses' => $this->statusOptions(),
            'filters' => [
                'status' => $status,
                'search' => $search,
            ],
        ]);
    }

    /**
     * Creates the account once the parent has consented, with the
     * student's LRN as the first password.
     */
    public function store(StoreStudentAccountRequest $request, Student $student, CreateStudentAccount $createStudentAccount): RedirectResponse
    {
        $createStudentAccount->handle($student);

        return back()->with('success', "{$student->first_name}'s account was created. They sign in with their LRN, which is also their first password. We emailed the parent.");
    }

    /**
     * The status tabs, each with how many students it holds.
     *
     * @return list<array{value: string, label: string, count: int}>
     */
    private function statusOptions(): array
    {
        $eligible = fn (): Builder => Student::query()->withApprovedEnrollment();

        $counts = StudentAccount::query()
            ->whereIn('student_id', $eligible()->select('id'))
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        return [
            ['value' => IndexStudentAccountRequest::ALL, 'label' => 'All', 'count' => $eligible()->count()],
            ['value' => IndexStudentAccountRequest::NONE, 'label' => 'No account yet', 'count' => $eligible()->whereDoesntHave('account')->count()],
            ...array_map(fn (StudentAccountStatus $accountStatus): array => [
                'value' => $accountStatus->value,
                'label' => $accountStatus->label(),
                'count' => (int) ($counts[$accountStatus->value] ?? 0),
            ], StudentAccountStatus::cases()),
        ];
    }
}
