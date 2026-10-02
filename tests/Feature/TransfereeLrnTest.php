<?php

use App\Http\Requests\StoreEnrollmentRequest;
use App\Models\EnrolleeUser;
use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\Student;
use App\Models\Subject;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->actingAs(EnrolleeUser::factory()->create(), 'enrollee');

    $this->gradeLevel = GradeLevel::factory()->totalFee(30000)->create(['name' => 'Grade 4']);
    Subject::create(['curriculum_id' => $this->gradeLevel->curricula()->first()->id, 'name' => 'Math', 'code' => 'MATH4']);
});

test('a transferee\'s 12-digit DepEd LRN is accepted and saved as the student\'s LRN', function () {
    $this->post(route('admission.store'), validEnrollmentPayload($this->gradeLevel, [
        'student_type' => 'WITH_LRN',
        'lrn' => '123456789012',
    ]))->assertSessionHasNoErrors();

    $student = Enrollment::sole()->student;

    expect($student->lrn)->toBe('123456789012');
});

test('spaces and dashes in the LRN are ignored', function (string $typed) {
    $this->post(route('admission.store'), validEnrollmentPayload($this->gradeLevel, [
        'student_type' => 'WITH_LRN',
        'lrn' => $typed,
    ]))->assertSessionHasNoErrors();

    expect(Student::sole()->lrn)->toBe('123456789012');
})->with(['1234 5678 9012', '1234-5678-9012', ' 123456789012 ']);

test('a 14-digit LRN issued by EVIMS is still accepted', function () {
    $this->post(route('admission.store'), validEnrollmentPayload($this->gradeLevel, [
        'student_type' => 'RETURNEE',
        'lrn' => '45250112345678',
    ]))->assertSessionHasNoErrors();

    expect(Student::sole()->lrn)->toBe('45250112345678');
});

test('a transferee must give their LRN', function () {
    $this->post(route('admission.store'), validEnrollmentPayload($this->gradeLevel, [
        'student_type' => 'WITH_LRN',
        'lrn' => null,
    ]))->assertSessionHasErrors(['lrn' => 'Transferees need their LRN — enter the 12-digit LRN from their previous school (on their Form 138 / report card).']);

    expect(Enrollment::count())->toBe(0);
});

test('a returnee may leave the LRN blank', function () {
    $this->post(route('admission.store'), validEnrollmentPayload($this->gradeLevel, [
        'student_type' => 'RETURNEE',
        'lrn' => null,
    ]))->assertSessionHasNoErrors();

    expect(Student::sole()->lrn)->toBeNull();
});

test('an LRN must be 12 or 14 digits', function (string $lrn) {
    $this->post(route('admission.store'), validEnrollmentPayload($this->gradeLevel, [
        'student_type' => 'WITH_LRN',
        'lrn' => $lrn,
    ]))->assertSessionHasErrors(['lrn' => StoreEnrollmentRequest::LRN_MESSAGE]);

    expect(Enrollment::count())->toBe(0);
})->with([
    'too short' => ['12345678901'],
    '13 digits' => ['1234567890123'],
    'too long' => ['123456789012345'],
    'letters' => ['12345678901A'],
]);

test('admins see the transferee\'s LRN on the students list without assigning one', function () {
    $this->post(route('admission.store'), validEnrollmentPayload($this->gradeLevel, [
        'student_type' => 'WITH_LRN',
        'lrn' => '123456789012',
    ]));

    $this->actingAs(User::factory()->create(['role' => 'ADMIN']))
        ->get(route('admin.students.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('applications.data.0.student.lrn', '123456789012'));
});
