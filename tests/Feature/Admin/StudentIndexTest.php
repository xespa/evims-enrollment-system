<?php

use App\Models\EnrolleeUser;
use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\OfficeVerification;
use App\Models\Payment;
use App\Models\Student;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests cannot view the admin students list', function () {
    $this->get(route('admin.students.index'))->assertRedirect(route('login'));
});

test('every staff role can view the students list', function (string $role) {
    $this->actingAs(User::factory()->create(['role' => $role]))
        ->get(route('admin.students.index'))
        ->assertOk();
})->with(['REGISTRAR', 'TEACHER', 'CASHIER']);

test('deactivated staff are signed out instead of seeing the students list', function () {
    $staff = User::factory()->deactivated()->create();

    $this->actingAs($staff)
        ->get(route('admin.students.index'))
        ->assertRedirect(route('login'));

    $this->assertGuest();
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

test('the applications list flags parents who have not verified their email', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);

    Enrollment::factory()->create([
        'student_id' => Student::factory()->create(['last_name' => 'Aquino']),
        'enrollee_user_id' => EnrolleeUser::factory()->create(),
    ]);
    Enrollment::factory()->create([
        'student_id' => Student::factory()->create(['last_name' => 'Bautista']),
        'enrollee_user_id' => EnrolleeUser::factory()->unverified()->create(),
    ]);

    $this->actingAs($admin)
        ->get(route('admin.students.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('applications.data', 2)
            ->where('applications.data.0.student.last_name', 'Aquino')
            ->where('applications.data.0.parent_email_verified', true)
            ->where('applications.data.1.student.last_name', 'Bautista')
            ->where('applications.data.1.parent_email_verified', false)
        );
});

test('the applications list shows where each application stands on payment', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);

    $partlyPaid = Enrollment::factory()->create([
        'student_id' => Student::factory()->create(['last_name' => 'Aquino']),
        'enrollment_status' => 'APPROVED',
    ]);
    $partlyPaid->billingContract()->create([
        'payment_option' => 'MONTHLY',
        'payment_channel' => 'COUNTER',
        'total_fee' => 10000,
    ])->generateInstallments();
    $firstInstallment = $partlyPaid->billingContract->installments()->orderBy('installment_number')->first();
    Payment::create([
        'installment_id' => $firstInstallment->id,
        'enrollment_id' => $partlyPaid->id,
        'amount' => 500,
        'method' => 'CASH',
        'receipt_number' => 'OR-1',
        'status' => 'COMPLETED',
        'paid_at' => now(),
    ]);
    // Voided money never counts as paid.
    Payment::create([
        'installment_id' => $firstInstallment->id,
        'enrollment_id' => $partlyPaid->id,
        'amount' => 999,
        'method' => 'CASH',
        'receipt_number' => 'OR-2',
        'status' => 'VOIDED',
        'paid_at' => now(),
    ]);

    Enrollment::factory()->create([
        'student_id' => Student::factory()->create(['last_name' => 'Bautista']),
    ]);

    $this->actingAs($admin)
        ->get(route('admin.students.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('applications.data.0.student.last_name', 'Aquino')
            ->where('applications.data.0.payment.status', 'PARTIALLY_PAID')
            ->where('applications.data.0.payment.channel', 'COUNTER')
            ->where('applications.data.0.payment.total', 10000)
            ->where('applications.data.0.payment.paid', 500)
            ->where('applications.data.0.payment.balance', 9500)
            ->has('applications.data.0.payment.unpaid_installments', 10)
            ->where('applications.data.0.payment.unpaid_installments.0.installment_number', 1)
            ->where('applications.data.0.payment.unpaid_installments.0.owed', 500)
            ->where('applications.data.0.payment.unpaid_installments.1.owed', 1000)
            ->missing('applications.data.0.billing_contract')
            ->where('applications.data.1.student.last_name', 'Bautista')
            ->where('applications.data.1.payment', null)
        );
});

test('a fully paid application shows as paid with nothing left to record', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $enrollment = Enrollment::factory()->create(['enrollment_status' => 'APPROVED']);
    $enrollment->billingContract()->create([
        'payment_option' => 'MONTHLY',
        'payment_channel' => 'COUNTER',
        'total_fee' => 10000,
    ])->generateInstallments();

    foreach ($enrollment->billingContract->installments as $installment) {
        Payment::create([
            'installment_id' => $installment->id,
            'enrollment_id' => $enrollment->id,
            'amount' => $installment->amount_due,
            'method' => 'CASH',
            'receipt_number' => 'OR-9',
            'status' => 'COMPLETED',
            'paid_at' => now(),
        ]);
    }

    $this->actingAs($admin)
        ->get(route('admin.students.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('applications.data.0.payment.status', 'PAID')
            ->where('applications.data.0.payment.balance', 0)
            ->has('applications.data.0.payment.unpaid_installments', 0)
        );
});

test('admins can filter applications by sex', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $girl = Enrollment::factory()->create(['student_id' => Student::factory()->create(['sex' => 'FEMALE'])]);
    Enrollment::factory()->create(['student_id' => Student::factory()->create(['sex' => 'MALE'])]);

    $this->actingAs($admin)
        ->get(route('admin.students.index', ['school_year' => '', 'sex' => 'FEMALE']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('applications.data', 1)
            ->where('applications.data.0.id', $girl->id)
            ->where('filters.sex', 'FEMALE')
        );
});

test('admins can filter applications by status, with cancelled ones apart', function (string $status, string $expected) {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $applications = [
        'pending' => Enrollment::factory()->create(['enrollment_status' => 'PENDING']),
        'approved' => Enrollment::factory()->create(['enrollment_status' => 'APPROVED']),
        'rejected' => Enrollment::factory()->create(['enrollment_status' => 'REJECTED']),
        // Still PENDING underneath, but the parent withdrew it.
        'cancelled' => Enrollment::factory()->create(['enrollment_status' => 'PENDING', 'cancelled_at' => now()]),
    ];

    $this->actingAs($admin)
        ->get(route('admin.students.index', ['school_year' => '', 'status' => $status]))
        ->assertInertia(fn (Assert $page) => $page
            ->has('applications.data', 1)
            ->where('applications.data.0.id', $applications[$expected]->id)
        );
})->with([
    'pending' => ['PENDING', 'pending'],
    'approved' => ['APPROVED', 'approved'],
    'rejected' => ['REJECTED', 'rejected'],
    'cancelled' => ['CANCELLED', 'cancelled'],
]);

test('admins can filter applications by student type', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $returnee = Enrollment::factory()->create(['student_type' => 'RETURNEE']);
    Enrollment::factory()->create(['student_type' => 'WITH_LRN']);
    Enrollment::factory()->create(['student_type' => 'NO_LRN']);

    $this->actingAs($admin)
        ->get(route('admin.students.index', ['school_year' => '', 'student_type' => 'RETURNEE']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('applications.data', 1)
            ->where('applications.data.0.id', $returnee->id)
        );
});

test('filters combine so only applications matching all of them are listed', function () {
    $admin = User::factory()->create(['role' => 'ADMIN']);
    $gradeOne = GradeLevel::factory()->create();
    $gradeTwo = GradeLevel::factory()->create();
    $match = [
        'school_year' => '2026-2027',
        'grade_level_id' => $gradeOne->id,
        'enrollment_status' => 'APPROVED',
        'student_type' => 'WITH_LRN',
    ];
    $female = fn () => Student::factory()->create(['sex' => 'FEMALE']);

    $matching = Enrollment::factory()->create([...$match, 'student_id' => $female()]);
    Enrollment::factory()->create([...$match, 'student_id' => Student::factory()->create(['sex' => 'MALE'])]);
    Enrollment::factory()->create([...$match, 'student_id' => $female(), 'school_year' => '2025-2026']);
    Enrollment::factory()->create([...$match, 'student_id' => $female(), 'grade_level_id' => $gradeTwo->id]);
    Enrollment::factory()->create([...$match, 'student_id' => $female(), 'enrollment_status' => 'PENDING']);
    Enrollment::factory()->create([...$match, 'student_id' => $female(), 'student_type' => 'RETURNEE']);

    $this->actingAs($admin)
        ->get(route('admin.students.index', [
            'school_year' => '2026-2027',
            'grade_level_id' => $gradeOne->id,
            'sex' => 'FEMALE',
            'status' => 'APPROVED',
            'student_type' => 'WITH_LRN',
        ]))
        ->assertInertia(fn (Assert $page) => $page
            ->has('applications.data', 1)
            ->where('applications.data.0.id', $matching->id)
            ->where('applications.total', 1)
            ->where('filters', [
                'search' => '',
                'school_year' => '2026-2027',
                'grade_level_id' => (string) $gradeOne->id,
                'sex' => 'FEMALE',
                'status' => 'APPROVED',
                'student_type' => 'WITH_LRN',
                'archived' => false,
            ])
        );
});

test('invalid filter values are rejected', function (array $filters, array $errors) {
    $admin = User::factory()->create(['role' => 'ADMIN']);

    $this->actingAs($admin)
        ->get(route('admin.students.index', $filters))
        ->assertSessionHasErrors($errors);
})->with([
    'unknown sex' => [['sex' => 'OTHER'], ['sex']],
    'unknown status' => [['status' => 'DELETED'], ['status']],
    'unknown student type' => [['student_type' => 'TRANSFEREE'], ['student_type']],
    'grade level that does not exist' => [['grade_level_id' => 999], ['grade_level_id']],
    'malformed school year' => [['school_year' => '2026'], ['school_year']],
]);
