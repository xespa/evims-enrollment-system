<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateTeachingSubjectsRequest;
use App\Models\Curriculum;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

/**
 * A teacher's list of the subjects they teach, kept in their settings.
 * Their grade sheets are made from these.
 */
class TeachingSubjectController extends Controller
{
    public function edit(Request $request): Response
    {
        Gate::authorize('teach-subjects');

        /** @var User $user */
        $user = $request->user();

        // Every published school year's subjects, newest year first, each
        // grade level's in order.
        $schoolYears = Curriculum::query()
            ->published()
            ->with(['gradeLevel:id,name,level_order', 'subjects' => fn ($subjects) => $subjects->orderBy('name')])
            ->get()
            ->sortBy(fn (Curriculum $curriculum) => $curriculum->gradeLevel->level_order)
            ->groupBy('school_year')
            ->sortKeysDesc()
            ->map(fn (Collection $curricula, string $schoolYear): array => [
                'school_year' => $schoolYear,
                'grade_levels' => array_values($curricula
                    ->filter(fn (Curriculum $curriculum): bool => $curriculum->subjects->isNotEmpty())
                    ->map(fn (Curriculum $curriculum): array => [
                        'name' => $curriculum->gradeLevel->name,
                        'subjects' => array_values($curriculum->subjects
                            ->map(fn (Subject $subject): array => [
                                'id' => $subject->id,
                                'name' => $subject->name,
                                'code' => $subject->code,
                            ])
                            ->all()),
                    ])
                    ->all()),
            ])
            ->values();

        return Inertia::render('Admin/Settings/Subjects', [
            'schoolYears' => $schoolYears,
            'selectedSubjectIds' => $user->taughtSubjects()->pluck('subjects.id'),
        ]);
    }

    public function update(UpdateTeachingSubjectsRequest $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        $user->taughtSubjects()->sync($request->validated('subject_ids'));

        return back()->with('success', 'Your subjects were saved. They now show on your grade sheets.');
    }
}
