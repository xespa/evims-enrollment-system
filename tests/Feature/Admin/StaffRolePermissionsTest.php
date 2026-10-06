<?php

use App\Models\Enrollment;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

test('each role only reaches the admin pages it is allowed to', function (string $routeName, array $allowedRoles) {
    foreach (['ADMIN', 'REGISTRAR', 'TEACHER', 'CASHIER'] as $role) {
        $response = $this->actingAs(User::factory()->create(['role' => $role]))
            ->withSession(['auth.password_confirmed_at' => time()])
            ->get(route($routeName));

        in_array($role, $allowedRoles, true)
            ? $response->assertOk()
            : $response->assertForbidden();
    }
})->with([
    'dashboard' => ['admin.dashboard', ['ADMIN', 'REGISTRAR']],
    'students' => ['admin.students.index', ['ADMIN', 'REGISTRAR', 'TEACHER', 'CASHIER']],
    'portal accounts' => ['admin.enrollee-accounts.index', ['ADMIN', 'REGISTRAR']],
    'transactions' => ['admin.transactions.index', ['ADMIN', 'REGISTRAR', 'CASHIER']],
    'school year setup' => ['admin.grade-levels.index', ['ADMIN']],
    'events' => ['admin.events.index', ['ADMIN']],
    'staff accounts' => ['admin.staff-accounts.index', ['ADMIN']],
]);

test('every role can open an application', function (string $role) {
    $enrollment = Enrollment::factory()->create();

    $this->actingAs(User::factory()->create(['role' => $role]))
        ->get(route('admin.enrollments.show', $enrollment))
        ->assertOk();
})->with(['ADMIN', 'REGISTRAR', 'TEACHER', 'CASHIER']);

test('teachers can upload a Form 138', function () {
    Storage::fake('public');
    $teacher = User::factory()->teacher()->create();
    $enrollment = Enrollment::factory()->create(['student_type' => 'RETURNEE']);

    $this->actingAs($teacher)
        ->post(route('admin.enrollments.documents.store', [$enrollment, 'form_138']), [
            'file' => UploadedFile::fake()->create('report-card.pdf', 200, 'application/pdf'),
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    expect($enrollment->officeVerification()->first()->form_138_path)->not->toBeNull();
});

test('teachers cannot upload identity documents', function (string $type) {
    Storage::fake('public');
    $enrollment = Enrollment::factory()->create();

    $this->actingAs(User::factory()->teacher()->create())
        ->post(route('admin.enrollments.documents.store', [$enrollment, $type]), [
            'file' => UploadedFile::fake()->create('document.pdf', 200, 'application/pdf'),
        ])
        ->assertForbidden();
})->with(['birth_certificate', 'good_moral']);

test('registrars can upload every document', function (string $type) {
    Storage::fake('public');
    $enrollment = Enrollment::factory()->create(['student_type' => 'RETURNEE']);

    $this->actingAs(User::factory()->registrar()->create())
        ->post(route('admin.enrollments.documents.store', [$enrollment, $type]), [
            'file' => UploadedFile::fake()->create('document.pdf', 200, 'application/pdf'),
        ])
        ->assertSessionHasNoErrors();
})->with(['form_138', 'birth_certificate', 'good_moral']);

test('cashiers cannot upload documents', function () {
    $enrollment = Enrollment::factory()->create();

    $this->actingAs(User::factory()->cashier()->create())
        ->post(route('admin.enrollments.documents.store', [$enrollment, 'form_138']), [
            'file' => UploadedFile::fake()->create('report-card.pdf', 200, 'application/pdf'),
        ])
        ->assertForbidden();
});

test('registrars can approve applications', function () {
    $student = Student::factory()->create(['lrn' => '45250112345678']);
    $enrollment = Enrollment::factory()->withDocuments()->create([
        'student_id' => $student->id,
        'enrollment_status' => 'PENDING',
    ]);

    $this->actingAs(User::factory()->registrar()->create())
        ->patch(route('admin.enrollments.status.update', $enrollment), ['enrollment_status' => 'APPROVED'])
        ->assertSessionHasNoErrors();

    expect($enrollment->fresh()->enrollment_status)->toBe('APPROVED');
});

test('teachers and cashiers cannot approve applications', function (string $role) {
    $enrollment = Enrollment::factory()->create(['enrollment_status' => 'PENDING']);

    $this->actingAs(User::factory()->create(['role' => $role]))
        ->patch(route('admin.enrollments.status.update', $enrollment), ['enrollment_status' => 'APPROVED'])
        ->assertForbidden();

    expect($enrollment->fresh()->enrollment_status)->toBe('PENDING');
})->with(['TEACHER', 'CASHIER']);

test('the abilities of the signed-in staff member are shared with the pages', function () {
    $this->actingAs(User::factory()->teacher()->create())
        ->get(route('admin.students.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('auth.roleLabel', 'Teacher')
            ->where('auth.can', [
                'viewDashboard' => false,
                'reviewApplications' => false,
                'handlePayments' => false,
                'manageSchool' => false,
                'manageStaff' => false,
                'uploadDocumentTypes' => ['form_138'],
            ])
        );
});

test('notifications go to the active staff who handle them', function () {
    $admin = User::factory()->admin()->create();
    $registrar = User::factory()->registrar()->create();
    $teacher = User::factory()->teacher()->create();
    $cashier = User::factory()->cashier()->create();
    User::factory()->registrar()->deactivated()->create();

    expect(User::query()->applicationReviewers()->pluck('id')->all())
        ->toEqualCanonicalizing([$admin->id, $registrar->id]);
    expect(User::query()->paymentHandlers()->pluck('id')->all())
        ->toEqualCanonicalizing([$admin->id, $registrar->id, $cashier->id]);
    expect(User::query()->admins()->pluck('id')->all())->toBe([$admin->id]);
    expect($teacher->id)->not->toBeIn(User::query()->applicationReviewers()->pluck('id')->all());
});
