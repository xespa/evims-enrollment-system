<?php

use App\Models\EnrolleeUser;
use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\Student;
use App\Models\Subject;

beforeEach(function () {
    $this->enrollee = EnrolleeUser::factory()->create();
    $this->actingAs($this->enrollee, 'enrollee');

    $this->gradeLevel = GradeLevel::factory()->totalFee(30000)->create();
    Subject::create(['curriculum_id' => $this->gradeLevel->curricula()->first()->id, 'name' => 'Math', 'code' => 'MATH1']);
});

test('one account can enroll several children for the same school year', function () {
    $children = [
        ['first_name' => 'Juan', 'date_of_birth' => '2015-05-10'],
        ['first_name' => 'Ana', 'date_of_birth' => '2017-02-14'],
        ['first_name' => 'Pedro', 'date_of_birth' => '2019-11-03'],
    ];

    foreach ($children as $child) {
        $this->post(route('admission.store'), validEnrollmentPayload($this->gradeLevel, $child))
            ->assertSessionHasNoErrors()
            ->assertRedirect();
    }

    expect(Student::count())->toBe(3)
        ->and($this->enrollee->enrollments()->count())->toBe(3)
        ->and(Student::pluck('first_name')->sort()->values()->all())->toBe(['Ana', 'Juan', 'Pedro']);
});

test('a sibling does not overwrite the first child\'s record', function () {
    $this->post(route('admission.store'), validEnrollmentPayload($this->gradeLevel));
    $firstChild = Student::sole();

    $this->post(route('admission.store'), validEnrollmentPayload($this->gradeLevel, [
        'first_name' => 'Ana',
        'date_of_birth' => '2017-02-14',
        'sex' => 'FEMALE',
    ]))->assertSessionHasNoErrors();

    expect($firstChild->fresh()->first_name)->toBe('Juan')
        ->and($firstChild->fresh()->sex)->toBe('MALE')
        ->and(Enrollment::where('student_id', $firstChild->id)->count())->toBe(1);
});

test('twins with the same birthday are separate children', function () {
    $this->post(route('admission.store'), validEnrollmentPayload($this->gradeLevel, ['first_name' => 'Juan']))
        ->assertSessionHasNoErrors();
    $this->post(route('admission.store'), validEnrollmentPayload($this->gradeLevel, ['first_name' => 'Jose']))
        ->assertSessionHasNoErrors();

    expect(Student::count())->toBe(2);
});

test('the same child without an LRN cannot be enrolled twice for one school year', function () {
    $this->post(route('admission.store'), validEnrollmentPayload($this->gradeLevel))
        ->assertSessionHasNoErrors();

    $this->post(route('admission.store'), validEnrollmentPayload($this->gradeLevel))
        ->assertSessionHasErrors('school_year');

    expect(Enrollment::count())->toBe(1)
        ->and(Student::count())->toBe(1);
});

test('another family\'s child with the same name and birthday is not matched', function () {
    $otherFamily = EnrolleeUser::factory()->create();
    $otherStudent = Student::factory()->create([
        'first_name' => 'Juan',
        'last_name' => 'Dela Cruz',
        'date_of_birth' => '2015-05-10',
    ]);
    Enrollment::factory()->create([
        'student_id' => $otherStudent->id,
        'enrollee_user_id' => $otherFamily->id,
        'school_year' => validEnrollmentPayload($this->gradeLevel)['school_year'],
    ]);

    $this->post(route('admission.store'), validEnrollmentPayload($this->gradeLevel))
        ->assertSessionHasNoErrors();

    expect(Student::count())->toBe(2)
        ->and($this->enrollee->enrollments()->sole()->student_id)->not->toBe($otherStudent->id);
});
