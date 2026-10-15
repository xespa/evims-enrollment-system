<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\GradeSheet;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/**
 * Archiving takes a grade sheet out of use instead of deleting it: its
 * students and grades stay intact and come back when it's restored.
 */
class GradeSheetArchiveController extends Controller
{
    public function store(Request $request, GradeSheet $gradeSheet): RedirectResponse
    {
        Gate::authorize('archive', $gradeSheet);

        /** @var User $user */
        $user = $request->user();

        $gradeSheet->archive($user);

        return redirect()
            ->route('admin.grade-sheets.index')
            ->with('success', "Grade sheet {$gradeSheet->number} archived. Find it under Archive to restore it.");
    }

    public function destroy(GradeSheet $gradeSheet): RedirectResponse
    {
        Gate::authorize('archive', $gradeSheet);

        $gradeSheet->restoreFromArchive();

        return redirect()
            ->route('admin.grade-sheets.show', $gradeSheet)
            ->with('success', "Grade sheet {$gradeSheet->number} restored from the archive.");
    }
}
