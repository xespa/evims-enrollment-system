<?php

use App\Enums\AuditAction;
use App\Models\AuditLog;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create(['name' => 'Ada Admin']);
});

function confirmedAs(User $user): mixed
{
    return test()->actingAs($user)->withSession(['auth.password_confirmed_at' => time()]);
}

test('admins can read the audit log, newest first', function () {
    $older = AuditLog::factory()->create(['user_id' => $this->admin->id, 'created_at' => now()->subDay()]);
    $newer = AuditLog::factory()->create([
        'user_id' => $this->admin->id,
        'action' => AuditAction::SignInFailed,
        'properties' => ['email' => 'someone@example.com'],
    ]);

    confirmedAs($this->admin)
        ->get(route('admin.audit-logs.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/AuditLogs/Index')
            ->has('entries.data', 2)
            ->where('entries.data.0.id', $newer->id)
            ->where('entries.data.0.action_label', 'Failed sign-in')
            ->where('entries.data.0.is_warning', true)
            ->where('entries.data.0.details', 'as someone@example.com')
            ->where('entries.data.0.actor.name', 'Ada Admin')
            ->where('entries.data.1.id', $older->id)
        );
});

test('the audit log can be narrowed to one action or one staff member', function () {
    $teacher = User::factory()->teacher()->create();
    AuditLog::factory()->create(['user_id' => $teacher->id, 'action' => AuditAction::DocumentUploaded]);
    AuditLog::factory()->create(['user_id' => $this->admin->id, 'action' => AuditAction::SignedIn]);

    confirmedAs($this->admin)
        ->get(route('admin.audit-logs.index', ['action' => 'document_uploaded']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('entries.data', 1)
            ->where('entries.data.0.action', 'document_uploaded')
        );

    confirmedAs($this->admin)
        ->get(route('admin.audit-logs.index', ['user_id' => $this->admin->id]))
        ->assertInertia(fn (Assert $page) => $page
            ->has('entries.data', 1)
            ->where('entries.data.0.actor.id', $this->admin->id)
        );
});

test('only admins can read the audit log', function (string $role) {
    confirmedAs(User::factory()->create(['role' => $role]))
        ->get(route('admin.audit-logs.index'))
        ->assertForbidden();
})->with(['REGISTRAR', 'TEACHER', 'CASHIER']);

test('staff changes are recorded with who made them', function () {
    Notification::fake();
    $staff = User::factory()->cashier()->create();

    confirmedAs($this->admin)->post(route('admin.staff-accounts.store'), [
        'name' => 'New Teacher',
        'email' => 'teacher@example.com',
        'role' => 'TEACHER',
    ]);
    confirmedAs($this->admin)->patch(route('admin.staff-accounts.update', $staff), ['role' => 'REGISTRAR']);
    confirmedAs($this->admin)->post(route('admin.staff-accounts.deactivation.store', $staff));
    confirmedAs($this->admin)->delete(route('admin.staff-accounts.deactivation.destroy', $staff));

    $entries = AuditLog::query()->where('user_id', $this->admin->id)->orderBy('id')->get();

    expect($entries->pluck('action')->all())->toBe([
        AuditAction::StaffInvited,
        AuditAction::RoleChanged,
        AuditAction::StaffDeactivated,
        AuditAction::StaffReactivated,
    ]);
    expect($entries[0]->properties)->toBe(['role' => 'TEACHER']);
    expect($entries[1]->subject_id)->toBe($staff->id);
    expect($entries[1]->details())->toBe('Cashier → Registrar');
});

test('document uploads are recorded against the application', function () {
    Storage::fake('public');
    $teacher = User::factory()->teacher()->create();
    $enrollment = Enrollment::factory()->create(['student_type' => 'RETURNEE']);

    $this->actingAs($teacher)->post(route('admin.enrollments.documents.store', [$enrollment, 'form_138']), [
        'file' => UploadedFile::fake()->create('report-card.pdf', 200, 'application/pdf'),
    ]);

    $entry = AuditLog::query()->sole();
    expect($entry->action)->toBe(AuditAction::DocumentUploaded);
    expect($entry->user_id)->toBe($teacher->id);
    expect($entry->subject_id)->toBe($enrollment->id);
    expect($entry->details())->toBe('Form 138 (Report Card)');
});

test('failed sign-ins are recorded without the password', function () {
    $this->post(route('login.store'), [
        'email' => $this->admin->email,
        'password' => 'wrong-password',
    ]);

    $entry = AuditLog::query()->where('action', AuditAction::SignInFailed)->sole();
    expect($entry->properties)->toBe(['email' => $this->admin->email]);
    expect(json_encode($entry->toArray()))->not->toContain('wrong-password');
});

test('turning two-factor off is recorded, but clearing an unfinished setup is not', function () {
    $teacher = User::factory()->teacher()->create();

    confirmedAs($teacher)->delete(route('two-factor.disable'));

    expect(AuditLog::query()->where('action', AuditAction::TwoFactorDisabled)->count())->toBe(1);

    // Started but never confirmed, then the security page is opened again later.
    confirmedAs($teacher)->post(route('two-factor.enable'));
    $this->travel(5)->seconds();
    confirmedAs($teacher)->get(route('admin.settings.security.edit'));
    $this->travel(5)->seconds();
    confirmedAs($teacher)->get(route('admin.settings.security.edit'));

    // Started again, then cancelled from the setup steps.
    confirmedAs($teacher)->post(route('two-factor.enable'));
    confirmedAs($teacher)->delete(route('two-factor.disable'));

    expect($teacher->refresh()->two_factor_secret)->toBeNull();
    expect(AuditLog::query()->where('action', AuditAction::TwoFactorDisabled)->count())->toBe(1);
});

test('audit log entries cannot be changed', function () {
    $entry = AuditLog::factory()->create();

    expect(fn () => $entry->update(['action' => AuditAction::SignedIn, 'ip_address' => '1.2.3.4']))
        ->toThrow(LogicException::class);
});
