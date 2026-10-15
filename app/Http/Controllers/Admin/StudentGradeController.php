<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreStudentGradeRequest;
use App\Http\Requests\Admin\UpdateStudentGradeRequest;
use App\Models\GradeSheet;
use App\Models\StudentGrade;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

/**
 * A student's row on a grade sheet: picked from the students enrolled in
 * the subject, with their Term 1, 2 and 3 grades.
 */
class StudentGradeController extends Controller
{
    public function create(GradeSheet $gradeSheet): Response
    {
        Gate::authorize('update', $gradeSheet);

        $gradeSheet->load(GradeSheet::summaryRelations());

        return Inertia::render('Admin/StudentGrades/Create', [
            'gradeSheet' => $gradeSheet->summary(),
            'students' => $gradeSheet->ungradedStudents(),
        ]);
    }

    public function store(StoreStudentGradeRequest $request, GradeSheet $gradeSheet): RedirectResponse
    {
        $studentGrade = $gradeSheet->studentGrades()->create($request->safe()->except('add_another'));
        $studentName = $studentGrade->enrollment->student->full_name;

        return redirect()
            ->route($request->boolean('add_another') ? 'admin.grade-sheets.student-grades.create' : 'admin.grade-sheets.show', $gradeSheet)
            ->with('success', "Grades saved for {$studentName}.");
    }

    public function edit(StudentGrade $studentGrade): Response
    {
        Gate::authorize('update', $studentGrade->gradeSheet);

        $studentGrade->gradeSheet->load(GradeSheet::summaryRelations());
        $studentGrade->load('enrollment.student');

        return Inertia::render('Admin/StudentGrades/Edit', [
            'gradeSheet' => $studentGrade->gradeSheet->summary(),
            'studentGrade' => $studentGrade->row(),
        ]);
    }

    public function update(UpdateStudentGradeRequest $request, StudentGrade $studentGrade): RedirectResponse
    {
        $studentGrade->update($request->validated());

        return redirect()
            ->route('admin.grade-sheets.show', $studentGrade->grade_sheet_id)
            ->with('success', "Grades updated for {$studentGrade->enrollment->student->full_name}.");
    }

    /**
     * Takes the student off the grade sheet, with their grades.
     */
    public function destroy(StudentGrade $studentGrade): RedirectResponse
    {
        Gate::authorize('update', $studentGrade->gradeSheet);

        $studentGrade->delete();

        return redirect()
            ->route('admin.grade-sheets.show', $studentGrade->grade_sheet_id)
            ->with('success', "{$studentGrade->enrollment->student->full_name} removed from the grade sheet.");
    }
}
