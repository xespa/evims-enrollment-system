<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateGradeSheetGradesRequest;
use App\Models\GradeSheet;
use App\Models\StudentGrade;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The whole class's Term 1–3 grades in one table, saved together, instead
 * of one student at a time.
 */
class GradeSheetGradeController extends Controller
{
    public function edit(GradeSheet $gradeSheet): Response
    {
        Gate::authorize('update', $gradeSheet);

        $gradeSheet->load(GradeSheet::summaryRelations());

        return Inertia::render('Admin/GradeSheetGrades/Edit', [
            'gradeSheet' => $gradeSheet->summary(),
            'studentGrades' => $gradeSheet->studentGradeRows(),
        ]);
    }

    public function update(UpdateGradeSheetGradesRequest $request, GradeSheet $gradeSheet): RedirectResponse
    {
        /** @var list<array{id: int|string, term_1?: string|null, term_2?: string|null, term_3?: string|null}> $rows */
        $rows = $request->validated('grades');
        $studentGrades = $gradeSheet->studentGrades()->get()->keyBy('id');

        DB::transaction(function () use ($rows, $studentGrades): void {
            foreach ($rows as $row) {
                /** @var StudentGrade $studentGrade */
                $studentGrade = $studentGrades->get((int) $row['id']);

                $studentGrade->update(collect(StudentGrade::TERMS)
                    ->mapWithKeys(fn (string $term) => [$term => $row[$term] ?? null])
                    ->all());
            }
        });

        return redirect()
            ->route('admin.grade-sheets.show', $gradeSheet)
            ->with('success', 'Grades saved for '.(count($rows) === 1 ? '1 student' : count($rows).' students').'.');
    }
}
