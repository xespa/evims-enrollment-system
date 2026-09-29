<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\GradeLevel;
use App\Models\Subject;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SubjectController extends Controller
{
    public function store(Request $request, GradeLevel $gradeLevel): RedirectResponse
    {
        $validated = $request->validate($this->rules($gradeLevel));

        $gradeLevel->subjects()->create($validated);

        return back()->with('success', "{$validated['name']} added to {$gradeLevel->name}.");
    }

    public function update(Request $request, Subject $subject): RedirectResponse
    {
        $validated = $request->validate($this->rules($subject->gradeLevel, $subject));

        $subject->update($validated);

        return back()->with('success', "{$subject->name} updated.");
    }

    /**
     * Subjects already picked by an enrollment are kept so the student's
     * enrollment record doesn't silently lose them (the pivot cascades).
     */
    public function destroy(Subject $subject): RedirectResponse
    {
        if ($subject->enrollments()->exists()) {
            return back()->withErrors([
                'subject' => "{$subject->name} can't be removed because it is part of existing enrollments.",
            ]);
        }

        $subject->delete();

        return back()->with('success', "{$subject->name} removed.");
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    private function rules(GradeLevel $gradeLevel, ?Subject $subject = null): array
    {
        return [
            'name' => [
                'required', 'string', 'max:255',
                Rule::unique('subjects', 'name')
                    ->where('grade_level_id', $gradeLevel->id)
                    ->ignore($subject?->id),
            ],
            'code' => ['nullable', 'string', 'max:50'],
        ];
    }
}
