<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\GradeLevel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class GradeLevelController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/GradeLevels/Index', [
            'gradeLevels' => GradeLevel::withCount('subjects')->orderBy('level_order')->get(),
        ]);
    }

    public function show(GradeLevel $gradeLevel)
    {
        return Inertia::render('Admin/GradeLevels/Show', [
            'gradeLevel' => $gradeLevel->only(['id', 'name', 'tuition_fee']),
            'subjects' => $gradeLevel->subjects()
                ->withCount('enrollments')
                ->orderBy('name')
                ->get(['id', 'grade_level_id', 'name', 'code']),
        ]);
    }

    public function update(Request $request, GradeLevel $gradeLevel)
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
