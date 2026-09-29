<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\GradeLevel;
use Illuminate\Http\Request;
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

        $gradeLevel->update($validated);

        return back()->with('success', "{$gradeLevel->name}'s fees updated.");
    }
}
