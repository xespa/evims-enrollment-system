<?php

use App\Models\Enrollment;
use App\Models\GradeSheet;
use App\Models\Section;
use App\Models\StudentAccount;
use App\Models\StudentGrade;
use App\Models\Subject;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * A signed-in student's account and their approved 2026-2027 application.
 *
 * @return array{0: StudentAccount, 1: Enrollment}
 */
function studentWithApprovedEnrollment(): array
{
    $account = StudentAccount::factory()->active('Secret-Pass-123')->create();
    $enrollment = Enrollment::factory()->create([
        'student_id' => $account->student_id,
        'school_year' => '2026-2027',
        'enrollment_status' => 'APPROVED',
    ]);

    return [$account, $enrollment];
}

/**
 * The student's row on a grade sheet for a subject with the given name.
 *
 * @param  array<string, mixed>  $grades
 */
function gradeInSubject(Enrollment $enrollment, string $subject, array $grades): StudentGrade
{
    $gradeSheet = GradeSheet::factory()->create(['subject_id' => Subject::factory()->create(['name' => $subject])->id]);

    return StudentGrade::factory()->for($gradeSheet)->create(['enrollment_id' => $enrollment->id, ...$grades]);
}

test('students see the grades their teachers entered, by subject', function () {
    [$account, $enrollment] = studentWithApprovedEnrollment();
    $math = gradeInSubject($enrollment, 'Mathematics', ['term_1' => 80, 'term_2' => 85, 'term_3' => 90]);
    gradeInSubject($enrollment, 'English', ['term_1' => 88, 'term_2' => null, 'term_3' => null]);

    $this->actingAs($account, 'student')
        ->get(route('student.dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Student/Dashboard')
            ->has('grades', 2)
            ->where('grades.0.subject', 'English')
            ->where('grades.0.final_grade', null)
            ->where('grades.0.remarks', null)
            ->where('grades.1.subject', 'Mathematics')
            ->where('grades.1.teacher', $math->gradeSheet->teacher->name)
            ->where('grades.1.term_2', '85.00')
            ->where('grades.1.final_grade', 85)
            ->where('grades.1.remarks', 'Passed')
            // Not every subject has a final grade yet.
            ->where('generalAverage', null));
});

test('the general average shows once every subject has a final grade', function () {
    [$account, $enrollment] = studentWithApprovedEnrollment();
    gradeInSubject($enrollment, 'Mathematics', ['term_1' => 80, 'term_2' => 85, 'term_3' => 90]);
    gradeInSubject($enrollment, 'English', ['term_1' => 70, 'term_2' => 72, 'term_3' => 74]);

    $this->actingAs($account, 'student')
        ->get(route('student.dashboard'))
        ->assertInertia(fn (Assert $page) => $page->where('generalAverage', 78.5));
});

test('each term\'s general average shows once every subject has that term\'s grade', function () {
    [$account, $enrollment] = studentWithApprovedEnrollment();
    gradeInSubject($enrollment, 'Mathematics', ['term_1' => 80, 'term_2' => 85, 'term_3' => 90]);
    gradeInSubject($enrollment, 'English', ['term_1' => 91, 'term_2' => 88, 'term_3' => null]);

    $this->actingAs($account, 'student')
        ->get(route('student.dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('termAverages.term_1', 85.5)
            ->where('termAverages.term_2', 86.5)
            // English has no Term 3 grade yet.
            ->where('termAverages.term_3', null));
});

test('students see the section they were placed in', function () {
    [$account, $enrollment] = studentWithApprovedEnrollment();

    $this->actingAs($account, 'student')
        ->get(route('student.dashboard'))
        ->assertInertia(fn (Assert $page) => $page->where('student.section', null));

    $enrollment->section()->associate(Section::factory()->create(['name' => 'B']))->save();

    $this->actingAs($account, 'student')
        ->get(route('student.dashboard'))
        ->assertInertia(fn (Assert $page) => $page->where('student.section', 'B'));
});

test('students only see their own grades', function () {
    [$account] = studentWithApprovedEnrollment();
    [, $otherEnrollment] = studentWithApprovedEnrollment();
    gradeInSubject($otherEnrollment, 'Mathematics', ['term_1' => 99]);

    $this->actingAs($account, 'student')
        ->get(route('student.dashboard'))
        ->assertInertia(fn (Assert $page) => $page->where('grades', [])->where('generalAverage', null));
});

test('only the latest school year\'s grades are shown', function () {
    [$account, $enrollment] = studentWithApprovedEnrollment();
    $lastYear = Enrollment::factory()->create([
        'student_id' => $account->student_id,
        'school_year' => '2025-2026',
        'enrollment_status' => 'APPROVED',
    ]);
    gradeInSubject($lastYear, 'Last Year Math', ['term_1' => 90]);
    gradeInSubject($enrollment, 'This Year Math', ['term_1' => 80]);

    $this->actingAs($account, 'student')
        ->get(route('student.dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('grades', 1)
            ->where('grades.0.subject', 'This Year Math'));
});

test('guests cannot see the grades page', function () {
    $this->get(route('student.dashboard'))->assertRedirect();
});
