<?php

use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\OfficeVerification;
use App\Models\Student;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests cannot view the admin students list', function () {
    $this->get(route('admin.students.index'))->assertRedirect(route('login'));
});

test('non-admin users cannot view the admin students list', function () {
    $staff = User::factory()->create(['role' => 'STAFF']);

    $this->actingAs($staff)
        ->get(route('admin.students.index'))
        ->assertForbidden();
});

test('admins can view the applications list', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);

    $student = Student::factory()->create(['last_name' => 'Santos', 'first_name' => 'Maria']);
    $enrollment = Enrollment::factory()->create([
        'student_id' => $student->id,
        'school_year' => '2026-2027',
        'enrollment_status' => 'APPROVED',
    ]);
    $verification = OfficeVerification::create([
        'enrollment_id' => $enrollment->id,
        'form_138_path' => 'documents/form-138.pdf',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.students.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Students/Index')
            ->has('applications.data', 1)
            ->where('applications.data.0.id', $enrollment->id)
            ->where('applications.data.0.student.id', $student->id)
            ->where('applications.data.0.grade_level.id', $enrollment->grade_level_id)
            ->where('applications.data.0.enrollment_status', 'APPROVED')
            ->where('applications.data.0.office_verification.id', $verification->id)
            ->where('applications.data.0.office_verification.form_138_path', 'documents/form-138.pdf')
        );
});

test('admins can search applications by student name or lrn', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);

    $cruz = Student::factory()->create(['last_name' => 'Cruz', 'first_name' => 'Juan']);
    Enrollment::factory()->create(['student_id' => $cruz->id]);

    $reyes = Student::factory()->create(['last_name' => 'Reyes', 'first_name' => 'Ana']);
    Enrollment::factory()->create(['student_id' => $reyes->id]);

    $this->actingAs($admin)
        ->get(route('admin.students.index', ['search' => 'Cruz']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('applications.data', 1)
            ->where('applications.data.0.student.last_name', 'Cruz')
        );
});

test('the default view only shows applications for the latest school year', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);

    $oldStudent = Student::factory()->create(['last_name' => 'Cruz', 'first_name' => 'Juan']);
    $oldEnrollment = Enrollment::factory()->create([
        'student_id' => $oldStudent->id,
        'school_year' => '2025-2026',
    ]);

    $newStudent = Student::factory()->create(['last_name' => 'Reyes', 'first_name' => 'Ana']);
    $newEnrollment = Enrollment::factory()->create([
        'student_id' => $newStudent->id,
        'school_year' => '2026-2027',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.students.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('filters.school_year', '2026-2027')
            ->has('applications.data', 1)
            ->where('applications.data.0.id', $newEnrollment->id)
        );
});

test('admins can filter applications by school year and grade level', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);

    $gradeOne = GradeLevel::factory()->create();
    $gradeTwo = GradeLevel::factory()->create();

    $matching = Student::factory()->create(['last_name' => 'Cruz', 'first_name' => 'Juan']);
    $matchingEnrollment = Enrollment::factory()->create([
        'student_id' => $matching->id,
        'school_year' => '2025-2026',
        'grade_level_id' => $gradeOne->id,
    ]);

    $wrongYear = Student::factory()->create(['last_name' => 'Reyes', 'first_name' => 'Ana']);
    Enrollment::factory()->create([
        'student_id' => $wrongYear->id,
        'school_year' => '2026-2027',
        'grade_level_id' => $gradeOne->id,
    ]);

    $wrongGrade = Student::factory()->create(['last_name' => 'Santos', 'first_name' => 'Pedro']);
    Enrollment::factory()->create([
        'student_id' => $wrongGrade->id,
        'school_year' => '2025-2026',
        'grade_level_id' => $gradeTwo->id,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.students.index', [
            'school_year' => '2025-2026',
            'grade_level_id' => $gradeOne->id,
        ]))
        ->assertInertia(fn (Assert $page) => $page
            ->has('applications.data', 1)
            ->where('applications.data.0.id', $matchingEnrollment->id)
        );
});

test('a returning student\'s earlier application still shows up when filtering back to that school year', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);

    $student = Student::factory()->create(['last_name' => 'Dela Cruz', 'first_name' => 'Juan']);
    $kinderApplication = Enrollment::factory()->create([
        'student_id' => $student->id,
        'school_year' => '2026-2027',
    ]);
    $gradeOneApplication = Enrollment::factory()->create([
        'student_id' => $student->id,
        'school_year' => '2027-2028',
    ]);

    // Filtering by the OLD school year must still surface that student's
    // earlier application, even though their latest one is for a newer
    // year — this used to be impossible since the list only ever looked
    // at each student's single latest enrollment.
    $this->actingAs($admin)
        ->get(route('admin.students.index', ['school_year' => '2026-2027']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('applications.data', 1)
            ->where('applications.data.0.id', $kinderApplication->id)
        );

    $this->actingAs($admin)
        ->get(route('admin.students.index', ['school_year' => '2027-2028']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('applications.data', 1)
            ->where('applications.data.0.id', $gradeOneApplication->id)
        );
});
