<?php

use App\Actions\GradeSheets\GenerateGradeReport;
use App\Models\Enrollment;
use App\Models\GradeSheet;
use App\Models\StudentGrade;
use App\Models\Subject;
use App\Models\User;

/**
 * A grade sheet with students on it, each with grades in its subject.
 *
 * @return array{0: GradeSheet, 1: list<StudentGrade>}
 */
function gradeSheetWithStudents(int $count = 2): array
{
    $gradeSheet = GradeSheet::factory()->create();
    $curriculum = $gradeSheet->subject->curriculum;

    $studentGrades = collect(range(1, $count))->map(function () use ($gradeSheet, $curriculum) {
        $enrollment = Enrollment::factory()->create([
            'grade_level_id' => $curriculum->grade_level_id,
            'school_year' => $curriculum->school_year,
            'enrollment_status' => 'APPROVED',
        ]);
        $enrollment->subjects()->attach($gradeSheet->subject_id);

        return StudentGrade::factory()->for($gradeSheet)->create(['enrollment_id' => $enrollment->id, 'term_1' => 90, 'term_2' => 91, 'term_3' => 92]);
    })->all();

    return [$gradeSheet, $studentGrades];
}

test('teachers open a student\'s report card from their grade sheet', function () {
    [$gradeSheet, [$studentGrade]] = gradeSheetWithStudents(1);
    $student = $studentGrade->enrollment->student;
    $schoolYear = $gradeSheet->subject->curriculum->school_year;

    $this->actingAs($gradeSheet->teacher)
        ->get(route('admin.student-grades.report-card.show', $studentGrade))
        ->assertOk()
        ->assertHeader('Content-Type', 'application/pdf')
        ->assertHeader('Content-Disposition', 'inline; filename=report-card-'.($student->lrn ?? $student->id)."-{$schoolYear}.pdf");
});

test('the report card covers only the sheet\'s school year, with every subject', function () {
    [$gradeSheet, [$studentGrade]] = gradeSheetWithStudents(1);
    $enrollment = $studentGrade->enrollment;
    // Another subject the student takes, graded by someone else.
    $otherSheet = GradeSheet::factory()->create(['subject_id' => Subject::factory()->for($gradeSheet->subject->curriculum)->create(['name' => 'Science'])->id]);
    StudentGrade::factory()->for($otherSheet)->create(['enrollment_id' => $enrollment->id, 'term_1' => 85]);
    // An earlier school year's application.
    Enrollment::factory()->create(['student_id' => $enrollment->student_id, 'school_year' => '2020-2021', 'enrollment_status' => 'APPROVED']);

    $data = app(GenerateGradeReport::class)->viewData($enrollment->student, $enrollment->school_year);

    expect(array_column($data['schoolYears'], 'school_year'))->toBe([$enrollment->school_year])
        ->and(array_column($data['schoolYears'][0]['grades'], 'subject'))->toContain('Science', $gradeSheet->subject->name);
});

test('the whole sheet\'s report cards download as one PDF', function () {
    [$gradeSheet] = gradeSheetWithStudents(3);

    $response = $this->actingAs($gradeSheet->teacher)
        ->get(route('admin.grade-sheets.report-cards.show', $gradeSheet))
        ->assertOk()
        ->assertHeader('Content-Type', 'application/pdf')
        ->assertHeader('Content-Disposition', "attachment; filename=report-cards-{$gradeSheet->number}.pdf");

    expect($response->getContent())->toStartWith('%PDF');
});

test('archived sheets\' report cards can still be opened', function () {
    [$gradeSheet, [$studentGrade]] = gradeSheetWithStudents(1);
    $gradeSheet->archive($gradeSheet->teacher);
    $this->actingAs($gradeSheet->teacher);

    $this->get(route('admin.student-grades.report-card.show', $studentGrade))->assertOk();
    $this->get(route('admin.grade-sheets.report-cards.show', $gradeSheet))->assertOk();
});

test('teachers can\'t open report cards from another teacher\'s sheet', function () {
    [$gradeSheet, [$studentGrade]] = gradeSheetWithStudents(1);
    $this->actingAs(User::factory()->teacher()->create());

    $this->get(route('admin.student-grades.report-card.show', $studentGrade))->assertForbidden();
    $this->get(route('admin.grade-sheets.report-cards.show', $gradeSheet))->assertForbidden();
});

test('admins can open any sheet\'s report cards', function () {
    [$gradeSheet, [$studentGrade]] = gradeSheetWithStudents(1);
    $this->actingAs(User::factory()->admin()->create());

    $this->get(route('admin.student-grades.report-card.show', $studentGrade))->assertOk();
    $this->get(route('admin.grade-sheets.report-cards.show', $gradeSheet))->assertOk();
});
