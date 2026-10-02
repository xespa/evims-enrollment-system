<?php

use App\Models\EnrolleeUser;
use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\Student;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Support\Facades\URL;
use Inertia\Testing\AssertableInertia as Assert;

test('guests opening the admission form are sent to the portal login', function () {
    $this->get(route('admission.create'))
        ->assertRedirect(route('portal.login'));

    $this->get(route('portal.login'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Portal/Login')
            ->where('isApplying', true));

    $this->get(route('portal.register'))
        ->assertInertia(fn (Assert $page) => $page->where('isApplying', true));
});

test('the login page only mentions enrolling when the visitor came from the admission form', function () {
    $this->get(route('portal.login'))
        ->assertInertia(fn (Assert $page) => $page->where('isApplying', false));
});

test('guests are sent to the portal login, not the staff login, for portal pages', function () {
    $this->get(route('portal.dashboard'))->assertRedirect(route('portal.login'));
});

test('staff pages still send guests to the staff login', function () {
    $this->get(route('admin.dashboard'))->assertRedirect(route('login'));
});

test('logging in returns the parent to the admission form', function () {
    $enrollee = EnrolleeUser::factory()->create();

    $this->get(route('admission.create'));

    $this->post(route('portal.login.store'), [
        'email' => $enrollee->email,
        'password' => 'password',
    ])->assertRedirect(route('admission.create'));
});

test('accounts must confirm their email before enrolling', function () {
    $enrollee = EnrolleeUser::factory()->unverified()->create();

    $this->actingAs($enrollee, 'enrollee')
        ->get(route('admission.create'))
        ->assertRedirect(route('portal.verification.notice'));
});

test('confirming the email returns the parent to the admission form', function () {
    $enrollee = EnrolleeUser::factory()->unverified()->create();

    $this->actingAs($enrollee, 'enrollee')
        ->withSession(['url.intended' => route('admission.create')])
        ->get(URL::signedRoute('portal.verification.verify', [
            'id' => $enrollee->id,
            'hash' => sha1($enrollee->email),
        ]))
        ->assertRedirect(route('admission.create'));
});

test('accounts the school has not verified see a notice instead of the form', function (string $state, string $status) {
    $this->actingAs(EnrolleeUser::factory()->{$state}()->create(), 'enrollee')
        ->get(route('admission.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Enrollment/Create')
            ->where('accountStatus', $status));
})->with([
    'awaiting approval' => ['pending', 'PENDING'],
    'rejected' => ['rejected', 'REJECTED'],
]);

test('approved accounts get the admission form', function () {
    $this->actingAs(EnrolleeUser::factory()->create(), 'enrollee')
        ->get(route('admission.create'))
        ->assertInertia(fn (Assert $page) => $page->where('accountStatus', 'APPROVED'));
});

test('accounts the school has not verified cannot submit an application', function (string $state) {
    $gradeLevel = GradeLevel::factory()->totalFee(30000)->create();
    Subject::create(['curriculum_id' => $gradeLevel->curricula()->first()->id, 'name' => 'Math', 'code' => 'MATH1']);

    $this->actingAs(EnrolleeUser::factory()->{$state}()->create(), 'enrollee')
        ->post(route('admission.store'), validEnrollmentPayload($gradeLevel))
        ->assertRedirect(route('portal.account-status'))
        ->assertSessionHas('error');

    expect(Enrollment::count())->toBe(0)
        ->and(Student::count())->toBe(0);
})->with(['pending', 'rejected']);

test('accounts the school has not verified cannot use the returning-student lookup', function () {
    $this->actingAs(EnrolleeUser::factory()->pending()->create(), 'enrollee')
        ->postJson(route('admission.verify-lrn'), ['lrn' => '45250112345678'])
        ->assertForbidden();
});

test('applications from unverified accounts never reach the admin', function () {
    $gradeLevel = GradeLevel::factory()->totalFee(30000)->create();
    Subject::create(['curriculum_id' => $gradeLevel->curricula()->first()->id, 'name' => 'Math', 'code' => 'MATH1']);

    $this->actingAs(EnrolleeUser::factory()->pending()->create(), 'enrollee')
        ->post(route('admission.store'), validEnrollmentPayload($gradeLevel));

    $this->actingAs(User::factory()->create(['role' => 'ADMIN']))
        ->get(route('admin.students.index'))
        ->assertInertia(fn (Assert $page) => $page->has('applications.data', 0));
});

test('an application confirmation is only shown to the account that applied', function () {
    $enrollee = EnrolleeUser::factory()->create();
    $enrollment = Enrollment::factory()->create(['enrollee_user_id' => $enrollee->id]);

    $this->actingAs($enrollee, 'enrollee')
        ->get(route('admission.success', $enrollment))
        ->assertOk();

    $this->actingAs(EnrolleeUser::factory()->create(), 'enrollee')
        ->get(route('admission.success', $enrollment))
        ->assertForbidden();
});
