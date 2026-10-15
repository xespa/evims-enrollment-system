<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreGradeSheetStudentsRequest;
use App\Models\GradeSheet;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

/**
 * Adding several students to a grade sheet at once, up to the whole class.
 * They start with no grades; the teacher enters them on the next page.
 */
class GradeSheetStudentController extends Controller
{
    public function store(StoreGradeSheetStudentsRequest $request, GradeSheet $gradeSheet): RedirectResponse
    {
        /** @var list<int|string> $enrollmentIds */
        $enrollmentIds = $request->validated('enrollment_ids');

        DB::transaction(fn () => $gradeSheet->studentGrades()->createMany(
            array_map(fn (int|string $enrollmentId): array => ['enrollment_id' => (int) $enrollmentId], $enrollmentIds),
        ));

        $count = count($enrollmentIds);

        return redirect()
            ->route('admin.grade-sheets.grades.edit', $gradeSheet)
            ->with('success', ($count === 1 ? '1 student' : "{$count} students").' added. Enter their grades below.');
    }
}
