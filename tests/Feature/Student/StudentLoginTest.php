<?php

use App\Models\Enrollment;
use App\Models\Student;
use App\Models\StudentAccount;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;

function studentWithAccount(string $state = 'active'): StudentAccount
{
    $student = Student::factory()->create(['lrn' => '123456789012', 'first_name' => 'Juan']);
    Enrollment::factory()->create(['student_id' => $student->id, 'enrollment_status' => 'APPROVED']);

    $factory = match ($state) {
        'active' => StudentAccount::factory()->active('Secret-Pass-123'),
        'declined' => StudentAccount::factory()->declined(),
        default => StudentAccount::factory(),
    };

    return $factory->create(['student_id' => $student->id]);
}

test('a student signs in with their LRN and password', function () {
    $account = studentWithAccount();

    $this->get(route('student.login'))->assertOk();

    $this->post(route('student.login.store'), ['lrn' => '1234-5678-9012', 'password' => 'Secret-Pass-123'])
        ->assertRedirect(route('student.dashboard'));

    $this->assertAuthenticatedAs($account, 'student');

    $this->get(route('student.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Student/Dashboard')
            ->where('student.first_name', 'Juan')
            ->where('student.lrn', '123456789012')
        );
});

test('a wrong password does not sign in', function () {
    studentWithAccount();

    $this->post(route('student.login.store'), ['lrn' => '123456789012', 'password' => 'wrong-password'])
        ->assertSessionHasErrors('lrn');

    $this->assertGuest('student');
});

test('accounts without consent cannot sign in', function (string $state) {
    $account = studentWithAccount($state);
    $account->forceFill(['password' => 'Secret-Pass-123'])->save();

    $this->post(route('student.login.store'), ['lrn' => '123456789012', 'password' => 'Secret-Pass-123'])
        ->assertSessionHasErrors('lrn');

    $this->assertGuest('student');
})->with(['awaiting consent' => 'awaiting', 'declined' => 'declined']);

test('repeated failures are throttled', function () {
    studentWithAccount();

    foreach (range(1, 5) as $attempt) {
        $this->post(route('student.login.store'), ['lrn' => '123456789012', 'password' => 'wrong-password']);
    }

    // Locked out even with the right password.
    $this->post(route('student.login.store'), ['lrn' => '123456789012', 'password' => 'Secret-Pass-123'])
        ->assertSessionHasErrors('lrn');

    expect(session('errors')->first('lrn'))->toContain('Too many sign-in attempts');
    $this->assertGuest('student');
});

test('guests are sent to the student sign in', function () {
    $this->get(route('student.dashboard'))->assertRedirect(route('student.login'));
});

test('a signed-in student is sent from the sign in page to their dashboard', function () {
    $this->actingAs(studentWithAccount(), 'student')
        ->get(route('student.login'))
        ->assertRedirect(route('student.dashboard'));
});

test('a student can change their password', function () {
    $account = studentWithAccount();

    $this->actingAs($account, 'student')
        ->put(route('student.password.update'), [
            'current_password' => 'Secret-Pass-123',
            'password' => 'New-Secret-456',
            'password_confirmation' => 'New-Secret-456',
        ])
        ->assertSessionHasNoErrors();

    expect(Hash::check('New-Secret-456', $account->refresh()->password))->toBeTrue();
});

test('changing the password needs the current one', function () {
    $account = studentWithAccount();

    $this->actingAs($account, 'student')
        ->put(route('student.password.update'), [
            'current_password' => 'wrong-password',
            'password' => 'New-Secret-456',
            'password_confirmation' => 'New-Secret-456',
        ])
        ->assertSessionHasErrors('current_password');

    expect(Hash::check('Secret-Pass-123', $account->refresh()->password))->toBeTrue();
});

test('a student can sign out', function () {
    $this->actingAs(studentWithAccount(), 'student')
        ->post(route('student.logout'))
        ->assertRedirect(route('student.login'));

    $this->assertGuest('student');
});
