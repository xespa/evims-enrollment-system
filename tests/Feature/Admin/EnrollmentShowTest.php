<?php

use App\Models\AcademicHistory;
use App\Models\EnrolleeUser;
use App\Models\Enrollment;
use App\Models\Student;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('the enrollment show page includes the academic history', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $student = Student::factory()->create();
    $enrollment = Enrollment::factory()->create(['student_id' => $student->id]);
    AcademicHistory::create([
        'enrollment_id' => $enrollment->id,
        'last_grade_level_completed' => 'Kinder',
        'last_school_year_completed' => '2026-2027',
        'previous_school_name' => 'St. Mary Learning Center',
        'previous_school_id' => '123456',
        'previous_school_address' => 'Borongan City, Eastern Samar',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.enrollments.show', $enrollment))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Enrollments/Show')
            ->where('enrollment.academic_history.last_grade_level_completed', 'Kinder')
            ->where('enrollment.academic_history.last_school_year_completed', '2026-2027')
            ->where('enrollment.academic_history.previous_school_name', 'St. Mary Learning Center')
            ->where('enrollment.academic_history.previous_school_id', '123456')
            ->where('enrollment.academic_history.previous_school_address', 'Borongan City, Eastern Samar')
        );
});

test('the enrollment show page flags a parent who has not verified their email', function (bool $isVerified) {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $enrollee = $isVerified ? EnrolleeUser::factory()->create() : EnrolleeUser::factory()->unverified()->create();
    $enrollment = Enrollment::factory()->create(['enrollee_user_id' => $enrollee->id]);

    $this->actingAs($admin)
        ->get(route('admin.enrollments.show', $enrollment))
        ->assertInertia(fn (Assert $page) => $page
            ->where('enrollment.parent_email_verified', $isVerified)
            ->missing('enrollment.enrollee_user')
        );
})->with([
    'verified parent' => true,
    'unverified parent' => false,
]);
