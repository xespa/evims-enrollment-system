<?php

use App\Actions\GradeSheets\GenerateGradeReport;
use App\Models\Enrollment;
use App\Models\GradeSheet;
use App\Models\StudentAccount;
use App\Models\StudentGrade;
use App\Models\Subject;
use App\Models\User;

/**
 * An active student account and an approved application for the given year.
 *
 * @return array{0: StudentAccount, 1: Enrollment}
 */
function studentDownloadingGrades(string $schoolYear = '2026-2027'): array
{
    $account = StudentAccount::factory()->active('Secret-Pass-123')->create();

    return [$account, studentsApprovedEnrollment($account, $schoolYear)];
}

function studentsApprovedEnrollment(StudentAccount $account, string $schoolYear, string $status = 'APPROVED'): Enrollment
{
    return Enrollment::factory()->create([
        'student_id' => $account->student_id,
        'school_year' => $schoolYear,
        'enrollment_status' => $status,
    ]);
}

/**
 * @param  array<string, mixed>  $grades
 */
function reportGradeInSubject(Enrollment $enrollment, string $subject, array $grades): StudentGrade
{
    $gradeSheet = GradeSheet::factory()->create(['subject_id' => Subject::factory()->create(['name' => $subject])->id]);

    return StudentGrade::factory()->for($gradeSheet)->create(['enrollment_id' => $enrollment->id, ...$grades]);
}

test('students can view their grades pdf in the browser', function () {
    [$account, $enrollment] = studentDownloadingGrades();
    reportGradeInSubject($enrollment, 'Mathematics', ['term_1' => 80, 'term_2' => 85, 'term_3' => 90]);

    $this->actingAs($account, 'student')
        ->get(route('student.grade-report.show'))
        ->assertOk()
        ->assertHeader('Content-Type', 'application/pdf')
        ->assertHeader('Content-Disposition', "inline; filename=grades-{$account->student->lrn}.pdf");
});

test('students can download their grades as a pdf', function () {
    [$account, $enrollment] = studentDownloadingGrades();
    reportGradeInSubject($enrollment, 'Mathematics', ['term_1' => 80, 'term_2' => 85, 'term_3' => 90]);

    $this->actingAs($account, 'student')
        ->get(route('student.grade-report.download'))
        ->assertOk()
        ->assertHeader('Content-Type', 'application/pdf')
        ->assertHeader('Content-Disposition', "attachment; filename=grades-{$account->student->lrn}.pdf");
});

test('the pdf has every approved school year\'s grades in each subject, newest first', function () {
    [$account, $thisYear] = studentDownloadingGrades();
    $lastYear = studentsApprovedEnrollment($account, '2025-2026');
    studentsApprovedEnrollment($account, '2024-2025', 'REJECTED');
    reportGradeInSubject($thisYear, 'Mathematics', ['term_1' => 80, 'term_2' => 85, 'term_3' => 90]);
    reportGradeInSubject($thisYear, 'English', ['term_1' => 70, 'term_2' => 72, 'term_3' => 74]);
    reportGradeInSubject($lastYear, 'Science', ['term_1' => 88, 'term_2' => null, 'term_3' => null]);

    $data = app(GenerateGradeReport::class)->viewData($account->student);

    expect($data['student']['lrn'])->toBe($account->student->lrn)
        ->and($data['student']['sex'])->toBe(ucfirst(strtolower($account->student->sex)))
        ->and(array_column($data['schoolYears'], 'school_year'))->toBe(['2026-2027', '2025-2026'])
        // Each year's age is the one on that year's application.
        ->and($data['schoolYears'][0]['age'])->toBe($thisYear->age)
        ->and($data['schoolYears'][0]['general_remarks'])->toBe('Passed')
        // Mathematics 80/85/90 and English 70/72/74, term by term.
        ->and($data['schoolYears'][0]['term_averages'])->toBe(['term_1' => 75.0, 'term_2' => 78.5, 'term_3' => 82.0])
        ->and($data['schoolYears'][1]['term_averages'])->toBe(['term_1' => 88.0, 'term_2' => null, 'term_3' => null])
        ->and($data['schoolYears'][1]['general_remarks'])->toBeNull()
        ->and(array_column($data['schoolYears'][0]['grades'], 'subject'))->toBe(['English', 'Mathematics'])
        ->and($data['schoolYears'][0]['grades'][1]['final_grade'])->toEqual(85)
        ->and($data['schoolYears'][0]['general_average'])->toBe(78.5)
        ->and(array_column($data['schoolYears'][1]['grades'], 'subject'))->toBe(['Science'])
        // Not every subject has a final grade yet.
        ->and($data['schoolYears'][1]['general_average'])->toBeNull();
});

test('the pdf only has the signed-in student\'s grades', function () {
    [$account] = studentDownloadingGrades();
    [, $otherEnrollment] = studentDownloadingGrades();
    reportGradeInSubject($otherEnrollment, 'Mathematics', ['term_1' => 99]);

    $data = app(GenerateGradeReport::class)->viewData($account->student);

    expect($data['schoolYears'][0]['grades'])->toBe([]);
});

test('students without grades yet can still download the pdf', function () {
    $account = StudentAccount::factory()->active()->create();

    $this->actingAs($account, 'student')
        ->get(route('student.grade-report.show'))
        ->assertOk()
        ->assertHeader('Content-Type', 'application/pdf');
});

test('students whose password was reset must change it before viewing or downloading', function (string $routeName) {
    [$account] = studentDownloadingGrades();
    $account->forceFill(['must_change_password' => true])->save();

    $this->actingAs($account, 'student')
        ->get(route($routeName))
        ->assertRedirect(route('student.dashboard'));
})->with(['student.grade-report.show', 'student.grade-report.download']);

test('guests cannot view or download grades', function (string $routeName) {
    $this->get(route($routeName))->assertRedirect();
})->with(['student.grade-report.show', 'student.grade-report.download']);

test('staff cannot view or download a student\'s grades from the student portal', function (string $routeName) {
    $this->actingAs(User::factory()->admin()->create())
        ->get(route($routeName))
        ->assertRedirect();
})->with(['student.grade-report.show', 'student.grade-report.download']);
