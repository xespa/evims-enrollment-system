<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexTransactionHistoryRequest;
use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\Payment;
use Illuminate\Database\Eloquent\Builder;
use Inertia\Inertia;
use Inertia\Response;

class TransactionHistoryController extends Controller
{
    /**
     * Every payment ever taken, one row each, newest first — including
     * voided ones, so the record is complete.
     */
    public function __invoke(IndexTransactionHistoryRequest $request): Response
    {
        $filters = [
            ...$request->validated(),
            // Starts on the current school year; an empty value means every year.
            'school_year' => Enrollment::filteredSchoolYear($request->has('school_year'), $request->string('school_year')->toString()),
        ];

        $payments = Payment::query()
            ->whereIn('status', isset($filters['status']) ? [$filters['status']] : IndexTransactionHistoryRequest::STATUSES)
            ->whereIn('enrollment_id', Enrollment::query()->inSchoolYearAndGrade($filters)->select('enrollments.id'))
            ->when($filters['method'] ?? null, fn (Builder $query, string $method) => $query->where('method', $method))
            ->when($filters['from'] ?? null, fn (Builder $query, string $from) => $query->whereDate('created_at', '>=', $from))
            ->when($filters['to'] ?? null, fn (Builder $query, string $to) => $query->whereDate('created_at', '<=', $to))
            ->when($filters['search'] ?? null, function (Builder $query, string $search) {
                $query->where(function (Builder $query) use ($search) {
                    $query->where('paymongo_source_id', 'like', "%{$search}%")
                        ->orWhere('receipt_number', 'like', "%{$search}%")
                        ->orWhere('paymongo_payment_intent_id', 'like', "%{$search}%")
                        ->orWhereIn('enrollment_id', Enrollment::query()->matchingSearch($search)->select('enrollments.id'));

                    if (ctype_digit(ltrim($search, '#'))) {
                        $query->orWhere('id', (int) ltrim($search, '#'));
                    }
                });
            })
            ->with(['enrollment.student:id,first_name,last_name', 'installment:id,installment_number'])
            ->latest('id')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/Transactions/History', [
            'payments' => $payments,
            'schoolYears' => Enrollment::schoolYearOptions(),
            'gradeLevels' => GradeLevel::orderBy('level_order')->get(['id', 'name']),
            'filters' => [
                'status' => $filters['status'] ?? '',
                'method' => $filters['method'] ?? '',
                'school_year' => $filters['school_year'] ?? '',
                'grade_level_id' => isset($filters['grade_level_id']) ? (string) $filters['grade_level_id'] : '',
                'search' => $filters['search'] ?? '',
                'from' => $filters['from'] ?? '',
                'to' => $filters['to'] ?? '',
            ],
        ]);
    }
}
