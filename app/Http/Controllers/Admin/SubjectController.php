<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Curriculum;
use App\Models\Subject;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SubjectController extends Controller
{
    public function store(Request $request, Curriculum $curriculum): RedirectResponse
    {
        $validated = $request->validate($this->rules($curriculum));

        $curriculum->subjects()->create($validated);

        return back()->with('success', "{$validated['name']} added to {$curriculum->gradeLevel->name} ({$curriculum->school_year}).");
    }

    public function update(Request $request, Subject $subject): RedirectResponse
    {
        $validated = $request->validate($this->rules($subject->curriculum, $subject));

        $subject->update($validated);

        return back()->with('success', "{$subject->name} updated.");
    }

    /**
     * Subjects already picked by an enrollment are kept so the student's
     * enrollment record doesn't silently lose them (the pivot cascades).
     * A new school year has its own copies, so they can still be dropped
     * from the curriculum going forward.
     */
    public function destroy(Subject $subject): RedirectResponse
    {
        if ($subject->enrollments()->exists()) {
            return back()->withErrors([
                'subject' => "{$subject->name} can't be removed because it is part of existing enrollments. To drop it, set up the next school year and remove it there.",
            ]);
        }

        $subject->delete();

        return back()->with('success', "{$subject->name} removed.");
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    private function rules(Curriculum $curriculum, ?Subject $subject = null): array
    {
        return [
            'name' => [
                'required', 'string', 'max:255',
                Rule::unique('subjects', 'name')
                    ->where('curriculum_id', $curriculum->id)
                    ->ignore($subject?->id),
            ],
            'code' => ['nullable', 'string', 'max:50'],
        ];
    }
}
