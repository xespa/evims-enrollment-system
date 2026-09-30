<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class TransactionController extends Controller
{
    private const STATUSES = ['COMPLETED', 'PENDING', 'FAILED', 'VOIDED'];

    private const METHODS = ['GCASH', 'CASH'];

    /**
     * Every GCash and cash payment across all applications, newest first —
     * modelled on PayMongo's Payments dashboard.
     */
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'status' => ['nullable', Rule::in(self::STATUSES)],
            'method' => ['nullable', Rule::in(self::METHODS)],
            'search' => ['nullable', 'string', 'max:100'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
        ]);

        $filtered = $this->filteredQuery($filters);

        $transactions = (clone $filtered)
            ->when($filters['status'] ?? null, fn (Builder $query, string $status) => $query->where('status', $status))
            ->with(['enrollment.student:id,first_name,last_name', 'installment:id,installment_number'])
            ->latest('id')
            ->paginate(20)
            ->withQueryString();

        // Tab counts and totals ignore the status filter, so switching tabs
        // doesn't make the other tabs' numbers disappear.
        $byStatus = (clone $filtered)
            ->toBase()
            ->selectRaw('status, count(*) as count, coalesce(sum(amount), 0) as total')
            ->groupBy('status')
            ->get()
            ->keyBy('status');

        return Inertia::render('Admin/Transactions/Index', [
            'transactions' => $transactions,
            'summary' => [
                'collected' => (float) ($byStatus['COMPLETED']->total ?? 0),
                'counts' => collect(self::STATUSES)
                    ->mapWithKeys(fn (string $status) => [$status => (int) ($byStatus[$status]->count ?? 0)])
                    ->put('ALL', (int) $byStatus->sum('count')),
            ],
            'filters' => [
                'status' => $filters['status'] ?? '',
                'method' => $filters['method'] ?? '',
                'search' => $filters['search'] ?? '',
                'from' => $filters['from'] ?? '',
                'to' => $filters['to'] ?? '',
            ],
        ]);
    }

    public function show(Payment $payment): Response
    {
        $payment->load([
            'enrollment.student:id,first_name,last_name,lrn',
            'enrollment.gradeLevel:id,name',
            'installment:id,installment_number,amount_due,due_date,status',
            'recordedBy:id,name',
            'voidedBy:id,name',
        ]);

        return Inertia::render('Admin/Transactions/Show', [
            'payment' => $payment,
        ]);
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return Builder<Payment>
     */
    private function filteredQuery(array $filters): Builder
    {
        return Payment::query()
            ->when($filters['method'] ?? null, fn (Builder $query, string $method) => $query->where('method', $method))
            ->when($filters['from'] ?? null, fn (Builder $query, string $from) => $query->whereDate('created_at', '>=', $from))
            ->when($filters['to'] ?? null, fn (Builder $query, string $to) => $query->whereDate('created_at', '<=', $to))
            ->when($filters['search'] ?? null, function (Builder $query, string $search) {
                $query->where(function (Builder $query) use ($search) {
                    $query->where('paymongo_source_id', 'like', "%{$search}%")
                        ->orWhere('receipt_number', 'like', "%{$search}%")
                        ->orWhere('paymongo_payment_intent_id', 'like', "%{$search}%")
                        ->orWhereHas('enrollment', fn (Builder $enrollment) => $enrollment
                            ->where('email', 'like', "%{$search}%")
                            ->orWhereHas('student', fn (Builder $student) => $student
                                ->where('first_name', 'like', "%{$search}%")
                                ->orWhere('last_name', 'like', "%{$search}%")
                                ->orWhere('lrn', 'like', "%{$search}%")));

                    if (ctype_digit(ltrim($search, '#'))) {
                        $query->orWhere('id', (int) ltrim($search, '#'))
                            ->orWhere('enrollment_id', (int) ltrim($search, '#'));
                    }
                });
            });
    }
}
