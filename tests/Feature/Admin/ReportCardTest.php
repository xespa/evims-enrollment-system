<?php

use App\Enums\AuditAction;
use App\Models\AuditLog;
use App\Models\Curriculum;
use App\Models\Enrollment;
use App\Models\GradeSheet;
use App\Models\StudentGrade;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    Storage::fake('public');
    $this->teacher = User::factory()->teacher()->create();
    // One grade level's 2025-2026 subjects, shared by every student.
    $curriculum = Curriculum::factory()->create(['school_year' => '2025-2026']);
    $this->subjects = collect(['English', 'Mathematics'])
        ->mapWithKeys(fn (string $name) => [$name => Subject::factory()->for($curriculum)->create(['name' => $name])]);
});

/**
 * An approved 2025-2026 student graded by the teacher in English (90) and
 * Mathematics (85, without a Term 3 grade unless $complete), who has
 * applied for 2026-2027.
 *
 * @return array{0: Enrollment, 1: Enrollment} This year's and next year's applications.
 */
function studentApplyingAgain(User $teacher, bool $complete = true, string $nextStatus = 'PENDING'): array
{
    $subjects = test()->subjects;
    $gradeLevelId = $subjects->first()->curriculum->grade_level_id;
    $enrollment = Enrollment::factory()->create(['school_year' => '2025-2026', 'grade_level_id' => $gradeLevelId, 'enrollment_status' => 'APPROVED']);

    foreach (['English' => 90, 'Mathematics' => 85] as $subjectName => $grade) {
        $subject = $subjects[$subjectName];
        $enrollment->subjects()->attach($subject);
        $gradeSheet = GradeSheet::query()->firstOrCreate(['subject_id' => $subject->id, 'teacher_id' => $teacher->id]);
        StudentGrade::factory()->for($gradeSheet)->create([
            'enrollment_id' => $enrollment->id,
            'term_1' => $grade,
            'term_2' => $grade,
            'term_3' => $complete || $subjectName === 'English' ? $grade : null,
        ]);
    }

    $nextApplication = Enrollment::factory()->create([
        'student_id' => $enrollment->student_id,
        'grade_level_id' => $gradeLevelId,
        'school_year' => '2026-2027',
        'enrollment_status' => $nextStatus,
    ]);

    return [$enrollment, $nextApplication];
}

test('a grade sheet lists its students who applied for the next school year', function () {
    [$enrollment] = studentApplyingAgain($this->teacher);
    [$incomplete] = studentApplyingAgain($this->teacher, complete: false);
    $mathematicsSheet = GradeSheet::where('subject_id', $this->subjects['Mathematics']->id)->where('teacher_id', $this->teacher->id)->sole();
    // On the sheet but hasn't applied again.
    $notApplied = Enrollment::factory()->create(['school_year' => '2025-2026', 'grade_level_id' => $enrollment->grade_level_id, 'enrollment_status' => 'APPROVED']);
    StudentGrade::factory()->for($mathematicsSheet)->create(['enrollment_id' => $notApplied->id]);
    // Applied again, but only on another of the teacher's sheets.
    $otherSubject = Subject::factory()->for($this->subjects['English']->curriculum)->create(['name' => 'Science']);
    $otherStudent = Enrollment::factory()->create(['school_year' => '2025-2026', 'grade_level_id' => $enrollment->grade_level_id, 'enrollment_status' => 'APPROVED']);
    StudentGrade::factory()->for(GradeSheet::factory()->create(['subject_id' => $otherSubject->id, 'teacher_id' => $this->teacher->id]))->create(['enrollment_id' => $otherStudent->id]);
    Enrollment::factory()->create(['student_id' => $otherStudent->student_id, 'grade_level_id' => $enrollment->grade_level_id, 'school_year' => '2026-2027', 'enrollment_status' => 'PENDING']);

    $this->actingAs($this->teacher)
        ->get(route('admin.grade-sheets.show', $mathematicsSheet))
        ->assertInertia(fn (Assert $page) => $page
            ->where('sendGrades.school_year', '2025-2026')
            ->where('sendGrades.next_school_year', '2026-2027')
            ->where('sendGrades.not_yet_applied_count', 1)
            ->has('sendGrades.students', 2)
            ->where('sendGrades.students', fn ($students) => collect($students)->firstWhere('id', $enrollment->id)['general_average'] === 87.5
                && collect($students)->firstWhere('id', $enrollment->id)['missing_final_grades'] === []
                && collect($students)->firstWhere('id', $enrollment->id)['next_application']['status'] === 'PENDING'
                && collect($students)->firstWhere('id', $enrollment->id)['next_application']['has_form_138'] === false
                && collect($students)->firstWhere('id', $incomplete->id)['missing_final_grades'] === ['Mathematics']));
});

test('an archived grade sheet doesn\'t offer sending grades', function () {
    studentApplyingAgain($this->teacher);
    $gradeSheet = GradeSheet::where('teacher_id', $this->teacher->id)->first();
    $gradeSheet->archive($this->teacher);

    $this->actingAs($this->teacher)
        ->get(route('admin.grade-sheets.show', $gradeSheet))
        ->assertInertia(fn (Assert $page) => $page->where('sendGrades', null));
});

test('sending puts the report card on the next application as its verified Form 138', function () {
    [$enrollment, $nextApplication] = studentApplyingAgain($this->teacher);

    $this->actingAs($this->teacher)
        ->post(route('admin.report-cards.store'), ['school_year' => '2025-2026', 'enrollment_ids' => [$enrollment->id]])
        ->assertRedirect()
        ->assertSessionHas('success', '1 student\'s grades sent to their S.Y. 2026-2027 application as the Form 138.');

    $verification = $nextApplication->officeVerification()->first();

    expect($verification->has_form_138)->toBeTrue()
        ->and($verification->verified_by)->toBe($this->teacher->id)
        ->and($enrollment->officeVerification()->value('form_138_path'))->toBeNull();
    Storage::disk('public')->assertExists($verification->form_138_path);
    expect(Storage::disk('public')->get($verification->form_138_path))->toStartWith('%PDF')
        ->and(AuditLog::where('action', AuditAction::DocumentUploaded)->where('subject_id', $nextApplication->id)->value('properties'))
        ->toMatchArray(['document' => 'form_138', 'sent_from_school_year' => '2025-2026']);
});

test('sending again replaces the earlier Form 138', function () {
    [$enrollment, $nextApplication] = studentApplyingAgain($this->teacher, nextStatus: 'APPROVED');
    $this->actingAs($this->teacher);

    $this->post(route('admin.report-cards.store'), ['school_year' => '2025-2026', 'enrollment_ids' => [$enrollment->id]]);
    $firstPath = $nextApplication->officeVerification()->value('form_138_path');
    $this->post(route('admin.report-cards.store'), ['school_year' => '2025-2026', 'enrollment_ids' => [$enrollment->id]]);
    $secondPath = $nextApplication->officeVerification()->value('form_138_path');

    expect($secondPath)->not->toBe($firstPath);
    Storage::disk('public')->assertMissing($firstPath);
    Storage::disk('public')->assertExists($secondPath);
});

test('students missing a final grade can\'t be sent yet', function () {
    [$enrollment, $nextApplication] = studentApplyingAgain($this->teacher, complete: false);

    $this->actingAs($this->teacher)
        ->post(route('admin.report-cards.store'), ['school_year' => '2025-2026', 'enrollment_ids' => [$enrollment->id]])
        ->assertSessionHasErrors(['enrollment_ids' => "{$enrollment->student->full_name} has no final grade yet in Mathematics."]);

    expect($nextApplication->officeVerification()->exists())->toBeFalse();
});

test('teachers can\'t send grades for students they don\'t grade', function () {
    [$enrollment, $nextApplication] = studentApplyingAgain(User::factory()->teacher()->create());

    $this->actingAs($this->teacher)
        ->post(route('admin.report-cards.store'), ['school_year' => '2025-2026', 'enrollment_ids' => [$enrollment->id]])
        ->assertSessionHasErrors('enrollment_ids');

    expect($nextApplication->officeVerification()->exists())->toBeFalse();
});

test('admins can send any student\'s grades', function () {
    [$enrollment, $nextApplication] = studentApplyingAgain($this->teacher);

    $this->actingAs(User::factory()->admin()->create())
        ->post(route('admin.report-cards.store'), ['school_year' => '2025-2026', 'enrollment_ids' => [$enrollment->id]])
        ->assertSessionHasNoErrors();

    expect($nextApplication->officeVerification()->value('has_form_138'))->toBeTruthy();
});

test('registrars and cashiers can\'t send grades', function (string $role) {
    [$enrollment] = studentApplyingAgain($this->teacher);
    $this->actingAs(User::factory()->create(['role' => $role]));

    $this->post(route('admin.report-cards.store'), ['school_year' => '2025-2026', 'enrollment_ids' => [$enrollment->id]])->assertForbidden();
})->with(['REGISTRAR', 'CASHIER']);
