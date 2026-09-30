<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The student lookup behind "Record counter payment" on Transactions: finds
 * approved applications that still owe money, so the cashier can pick who
 * is paying before entering the amount.
 */
class PayableEnrollmentController extends Controller
{
    private const MAX_RESULTS = 8;

    public function __invoke(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['required', 'string', 'min:2', 'max:100'],
        ]);

        $search = trim($validated['search']);
        $reference = ltrim($search, '#');
        // "Juan Dela Cruz": every word must match the first or last name.
        $terms = preg_split('/\s+/', $search) ?: [$search];

        $matches = Enrollment::query()
            ->where('enrollment_status', 'APPROVED')
            ->whereNull('cancelled_at')
            ->whereHas('billingContract')
            ->where(function (Builder $query) use ($search, $reference, $terms) {
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
            })
            ->with(['student:id,first_name,last_name,lrn', 'gradeLevel:id,name', ...Enrollment::paymentSummaryRelations()])
            ->latest('id')
            // A few extra, since fully paid ones are dropped below.
            ->limit(self::MAX_RESULTS * 3)
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
            ->take(self::MAX_RESULTS)
            ->values();

        return response()->json(['results' => $results]);
    }
}
