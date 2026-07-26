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

    public function update(Request $request, GradeLevel $gradeLevel)
    {
        $validated = $request->validate([
            'tuition_fee' => ['required', 'numeric', 'min:0'],
        ]);

        $gradeLevel->update($validated);

        return back()->with('success', "{$gradeLevel->name}'s tuition fee updated.");
    }
}
