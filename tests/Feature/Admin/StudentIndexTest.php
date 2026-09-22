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

test('admins can view the students list with their latest enrollment', function () {
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
            ->has('students.data', 1)
            ->where('students.data.0.id', $student->id)
            ->where('students.data.0.latest_enrollment.id', $enrollment->id)
            ->where('students.data.0.latest_enrollment.grade_level.id', $enrollment->grade_level_id)
            ->where('students.data.0.latest_enrollment.enrollment_status', 'APPROVED')
            ->where('students.data.0.latest_enrollment.office_verification.id', $verification->id)
            ->where('students.data.0.latest_enrollment.office_verification.form_138_path', 'documents/form-138.pdf')
        );
});

test('admins can search students by name or lrn', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);

    Student::factory()->create(['last_name' => 'Cruz', 'first_name' => 'Juan']);
    Student::factory()->create(['last_name' => 'Reyes', 'first_name' => 'Ana']);

    $this->actingAs($admin)
        ->get(route('admin.students.index', ['search' => 'Cruz']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('students.data', 1)
            ->where('students.data.0.last_name', 'Cruz')
        );
});

test('the default view only shows students with the latest school year', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);

    $oldStudent = Student::factory()->create(['last_name' => 'Cruz', 'first_name' => 'Juan']);
    Enrollment::factory()->create([
        'student_id' => $oldStudent->id,
        'school_year' => '2025-2026',
    ]);

    $newStudent = Student::factory()->create(['last_name' => 'Reyes', 'first_name' => 'Ana']);
    Enrollment::factory()->create([
        'student_id' => $newStudent->id,
        'school_year' => '2026-2027',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.students.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('filters.school_year', '2026-2027')
            ->has('students.data', 1)
            ->where('students.data.0.id', $newStudent->id)
        );
});

test('admins can filter students by school year and grade level', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);

    $gradeOne = GradeLevel::factory()->create();
    $gradeTwo = GradeLevel::factory()->create();

    $matching = Student::factory()->create(['last_name' => 'Cruz', 'first_name' => 'Juan']);
    Enrollment::factory()->create([
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
            ->has('students.data', 1)
            ->where('students.data.0.id', $matching->id)
        );
});
