<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\Student;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The student lookup behind "Record counter payment" on Transactions: finds
 * approved applications that still owe money, so the cashier can pick who
 * is paying before entering the amount. With no search it lists them by
 * the student's name, for picking straight from the list.
 */
class PayableEnrollmentController extends Controller
{
    private const MAX_SEARCH_RESULTS = 8;

    private const MAX_LISTED = 20;

    public function __invoke(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'min:2', 'max:100'],
        ]);

        $search = trim($validated['search'] ?? '');

        $payable = Enrollment::query()
            ->where('enrollment_status', 'APPROVED')
            ->whereNull('cancelled_at')
            ->whereHas('billingContract.installments', fn (Builder $installments) => $installments->where('status', '!=', 'PAID'))
            ->when($search !== '', fn (Builder $query) => $this->matching($query, $search));

        $total = $search === '' ? (clone $payable)->count() : null;

        $matches = $payable
            ->with(['student:id,first_name,last_name,lrn', 'gradeLevel:id,name', ...Enrollment::paymentSummaryRelations()])
            ->when(
                $search === '',
                fn (Builder $query) => $query
                    ->orderBy(Student::select('last_name')->whereColumn('students.id', 'enrollments.student_id'))
                    ->orderBy(Student::select('first_name')->whereColumn('students.id', 'enrollments.student_id')),
                fn (Builder $query) => $query->latest('id'),
            )
            ->limit($search === '' ? self::MAX_LISTED : self::MAX_SEARCH_RESULTS)
            ->get();

        $results = $matches
            ->map(fn (Enrollment $enrollment) => [
                'id' => $enrollment->id,
                'student_name' => trim("{$enrollment->student->first_name} {$enrollment->student->last_name}"),
                'lrn' => $enrollment->student->lrn,
                'grade_level' => $enrollment->gradeLevel?->name,
                'school_year' => $enrollment->school_year,
                'payment' => $enrollment->paymentSummary(),
            ])
            ->filter(fn (array $result) => ($result['payment']['balance'] ?? 0) > 0)
            ->values();

        return response()->json(['results' => $results, 'total' => $total]);
    }

    /**
     * Matches the email, LRN, reference no. or student name. For a name
     * like "Juan Dela Cruz", every word must match the first or last name.
     *
     * @param  Builder<Enrollment>  $query
     */
    private function matching(Builder $query, string $search): void
    {
        $reference = ltrim($search, '#');
        $terms = preg_split('/\s+/', $search) ?: [$search];

        $query->where(function (Builder $query) use ($search, $reference, $terms) {
            $query->where('email', 'like', "%{$search}%")
                ->orWhereHas('student', fn (Builder $student) => $student
                    ->where('lrn', 'like', "%{$search}%")
                    ->orWhere(function (Builder $name) use ($terms) {
                        foreach ($terms as $term) {
                            $name->where(fn (Builder $word) => $word
                                ->where('first_name', 'like', "%{$term}%")
                                ->orWhere('last_name', 'like', "%{$term}%"));
                        }
                    }));

            if (ctype_digit($reference)) {
                $query->orWhere('id', (int) $reference);
            }
        });
    }
}
