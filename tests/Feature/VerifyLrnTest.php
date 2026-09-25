<?php

use App\Models\Address;
use App\Models\EnrolleeUser;
use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\Student;
use Inertia\Testing\AssertableInertia as Assert;

test('the admission page has no fast-track gate for guests', function () {
    $this->get(route('enrollment.create'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('hasExistingRecord', false)
        );
});

test('the admission page has no fast-track gate for a first-time enrollee account', function () {
    $enrollee = EnrolleeUser::factory()->create();

    $this->actingAs($enrollee, 'enrollee')
        ->get(route('enrollment.create'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('hasExistingRecord', false)
        );
});

test('the admission page offers the fast-track gate for a returning enrollee account', function () {
    $enrollee = EnrolleeUser::factory()->create();
    $student = Student::factory()->create();
    Enrollment::factory()->create([
        'student_id' => $student->id,
        'enrollee_user_id' => $enrollee->id,
    ]);

    $this->actingAs($enrollee, 'enrollee')
        ->get(route('enrollment.create'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('hasExistingRecord', true)
        );
});

test('guests cannot use the lrn verification endpoint', function () {
    $this->postJson(route('enrollment.verifyLrn'), ['lrn' => '45250112345678'])
        ->assertUnauthorized();
});

test('lrn must be 14 digits', function () {
    $enrollee = EnrolleeUser::factory()->create();

    $this->actingAs($enrollee, 'enrollee')
        ->postJson(route('enrollment.verifyLrn'), ['lrn' => '123'])
        ->assertJsonValidationErrors('lrn');
});

test('returns no match when the lrn does not belong to one of this account\'s own students', function () {
    $enrollee = EnrolleeUser::factory()->create();
    $student = Student::factory()->create(['lrn' => '45250112345678']);
    Enrollment::factory()->create([
        'student_id' => $student->id,
        'enrollee_user_id' => $enrollee->id,
    ]);

    // A completely unrelated LRN — not linked to this enrollee at all.
    $response = $this->actingAs($enrollee, 'enrollee')
        ->postJson(route('enrollment.verifyLrn'), ['lrn' => '45250199999999']);

    $response->assertOk();
    expect($response->json('matched'))->toBeFalse();
});

test('does not leak another family\'s student even if the lrn is correct', function () {
    $otherFamilyStudent = Student::factory()->create(['lrn' => '45250112345678']);
    $otherEnrollee = EnrolleeUser::factory()->create();
    Enrollment::factory()->create([
        'student_id' => $otherFamilyStudent->id,
        'enrollee_user_id' => $otherEnrollee->id,
    ]);

    // A different, unrelated enrollee tries the same LRN — must not match,
    // since it doesn't belong to any of their own linked students.
    $enrollee = EnrolleeUser::factory()->create();

    $response = $this->actingAs($enrollee, 'enrollee')
        ->postJson(route('enrollment.verifyLrn'), ['lrn' => '45250112345678']);

    $response->assertOk();
    expect($response->json('matched'))->toBeFalse();
});

test('returns the full prefill payload for a matching student under this account', function () {
    $enrollee = EnrolleeUser::factory()->create();
    $student = Student::factory()->create([
        'lrn' => '45250112345678',
        'first_name' => 'Juan',
        'last_name' => 'Dela Cruz',
    ]);
    Address::create([
        'student_id' => $student->id,
        'barangay' => 'Balud',
        'city_municipality' => 'Borongan City',
        'province' => 'Eastern Samar',
        'country' => 'Philippines',
        'zip_code' => '6800',
    ]);
    $enrollment = Enrollment::factory()->create([
        'student_id' => $student->id,
        'enrollee_user_id' => $enrollee->id,
        'school_year' => '2026-2027',
    ]);

    $response = $this->actingAs($enrollee, 'enrollee')
        ->postJson(route('enrollment.verifyLrn'), ['lrn' => '45250112345678']);

    $response->assertOk();
    expect($response->json('matched'))->toBeTrue();
    expect($response->json('student.first_name'))->toBe('Juan');
    expect($response->json('student.last_name'))->toBe('Dela Cruz');
    expect($response->json('student.barangay'))->toBe('Balud');
    expect($response->json('student.student_type'))->toBe('WITH_LRN');
    expect($response->json('previousSchoolYear'))->toBe('2026-2027');
});

test('defaults the grade level to the next one up from their last enrollment', function () {
    $kinder = GradeLevel::factory()->create(['name' => 'Kinder', 'level_order' => 0]);
    $gradeOne = GradeLevel::factory()->create(['name' => 'Grade 1', 'level_order' => 1]);

    $enrollee = EnrolleeUser::factory()->create();
    $student = Student::factory()->create(['lrn' => '45250112345678']);
    Enrollment::factory()->create([
        'student_id' => $student->id,
        'enrollee_user_id' => $enrollee->id,
        'grade_level_id' => $kinder->id,
    ]);

    $response = $this->actingAs($enrollee, 'enrollee')
        ->postJson(route('enrollment.verifyLrn'), ['lrn' => '45250112345678']);

    $response->assertOk();
    expect($response->json('student.grade_level_id'))->toBe($gradeOne->id);
});

test('prefills academic history as having last attended evims itself, not whatever school came before it', function () {
    $kinder = GradeLevel::factory()->create(['name' => 'Kinder', 'level_order' => 0]);
    GradeLevel::factory()->create(['name' => 'Grade 1', 'level_order' => 1]);

    $enrollee = EnrolleeUser::factory()->create();
    $student = Student::factory()->create(['lrn' => '45250112345678']);
    Enrollment::factory()->create([
        'student_id' => $student->id,
        'enrollee_user_id' => $enrollee->id,
        'grade_level_id' => $kinder->id,
        'school_year' => '2026-2027',
    ]);

    $response = $this->actingAs($enrollee, 'enrollee')
        ->postJson(route('enrollment.verifyLrn'), ['lrn' => '45250112345678']);

    $response->assertOk();
    expect($response->json('student.last_grade_level_completed'))->toBe('Kinder');
    expect($response->json('student.last_school_year_completed'))->toBe('2026-2027');
    expect($response->json('student.previous_school_name'))->toBe('Eastern Visayas International Montessori School');
    expect($response->json('student.previous_school_address'))->toBe('Santiago St., Brgy. Balud');
});

test('keeps the same grade level when the student was already at the highest one', function () {
    $gradeTen = GradeLevel::factory()->create(['name' => 'Grade 10', 'level_order' => 10]);

    $enrollee = EnrolleeUser::factory()->create();
    $student = Student::factory()->create(['lrn' => '45250112345678']);
    Enrollment::factory()->create([
        'student_id' => $student->id,
        'enrollee_user_id' => $enrollee->id,
        'grade_level_id' => $gradeTen->id,
    ]);

    $response = $this->actingAs($enrollee, 'enrollee')
        ->postJson(route('enrollment.verifyLrn'), ['lrn' => '45250112345678']);

    $response->assertOk();
    expect($response->json('student.grade_level_id'))->toBe($gradeTen->id);
});
