<?php

use App\Models\AcademicHistory;
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
        'previous_school_id' => null,
        'previous_school_address' => 'Borongan City, Eastern Samar',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.enrollments.show', $enrollment))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Enrollments/Show')
            ->where('enrollment.academic_history.last_grade_level_completed', 'Kinder')
            ->where('enrollment.academic_history.last_school_year_completed', '2026-2027')
            ->where('enrollment.academic_history.previous_school_name', 'St. Mary Learning Center')
            ->where('enrollment.academic_history.previous_school_address', 'Borongan City, Eastern Samar')
        );
});
