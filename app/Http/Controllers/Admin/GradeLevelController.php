<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\GradeLevel;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class GradeLevelController extends Controller
{
    /**
     * Fees and subjects are both edited in modals on this one page, so each
     * grade level ships with its subjects (a handful each).
     */
    public function index(Request $request): Response
    {
        return Inertia::render('Admin/GradeLevels/Index', [
            'gradeLevels' => GradeLevel::query()
                ->with(['subjects' => fn ($query) => $query
                    ->select(['id', 'grade_level_id', 'name', 'code'])
                    ->withCount('enrollments')
                    ->orderBy('name')])
                ->orderBy('level_order')
                ->get(),
            // Lets a link (or the old per-grade page URL) open a grade
            // level's Manage Subjects modal directly.
            'manageGradeLevelId' => $request->integer('manage') ?: null,
        ]);
    }

    /**
     * Subjects used to live on their own page; keep old links working by
     * opening that grade level's subjects modal instead.
     */
    public function show(GradeLevel $gradeLevel): RedirectResponse
    {
        return to_route('admin.grade-levels.index', ['manage' => $gradeLevel->id]);
    }

    public function update(Request $request, GradeLevel $gradeLevel): RedirectResponse
    {
        $validated = $request->validate([
            'registration_fee' => ['required', 'numeric', 'min:0'],
            'miscellaneous_fee' => ['required', 'numeric', 'min:0'],
            'monthly_tuition' => ['required', 'numeric', 'min:0'],
            'monthly_laboratory_fee' => ['required', 'numeric', 'min:0'],
            'books_fee' => ['required', 'numeric', 'min:0'],
        ]);

        $repricedCount = DB::transaction(function () use ($gradeLevel, $validated) {
            $gradeLevel->update($validated);

            return $gradeLevel->repriceOpenBillingContracts();
        });

        $message = "{$gradeLevel->name}'s fees updated.";

        if ($repricedCount > 0) {
            $message .= ' '.trans_choice(
                ':count unpaid bill now uses the new fees.|:count unpaid bills now use the new fees.',
                $repricedCount,
            );
        }

        return back()->with('success', $message);
    }
}
