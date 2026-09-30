<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Curriculum;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CurriculumController extends Controller
{
    /**
     * Updates one grade level's fees for one school year. Bills are locked
     * once someone applies: only applications made after this use the new
     * fees, so existing applications keep the price they applied with.
     */
    public function update(Request $request, Curriculum $curriculum): RedirectResponse
    {
        $validated = $request->validate(
            collect(Curriculum::FEE_FIELDS)
                ->mapWithKeys(fn (string $field) => [$field => ['required', 'numeric', 'min:0', 'max:9999999']])
                ->all(),
        );

        $curriculum->update($validated);

        $gradeLevel = $curriculum->gradeLevel;
        $existingCount = $curriculum->enrollmentsQuery()->count();

        $message = "{$gradeLevel->name}'s {$curriculum->school_year} fees updated.";

        if ($existingCount > 0) {
            $message .= ' '.trans_choice(
                'The :count application already made keeps its original price.|The :count applications already made keep their original price.',
                $existingCount,
            );
        }

        return back()->with('success', $message);
    }
}
