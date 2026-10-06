<?php

use App\Models\DocumentAppointment;
use App\Models\EnrolleeUser;
use App\Models\Enrollment;
use App\Models\User;
use App\Notifications\DocumentAppointmentCancelled;
use App\Notifications\DocumentAppointmentScheduled;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->travelTo(Carbon::parse('2026-10-04 09:00', 'Asia/Manila'));
    Notification::fake();

    $this->admin = User::factory()->create(['role' => 'ADMIN']);
    $this->enrollee = EnrolleeUser::factory()->create();
    $this->enrollment = Enrollment::factory()->create(['enrollee_user_id' => $this->enrollee->id]);
});

/**
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function appointmentPayload(array $overrides = []): array
{
    return [
        'scheduled_on' => '2026-10-10',
        'scheduled_time' => '09:30',
        'documents' => ['birth_certificate', 'good_moral'],
        'note' => 'Bring the original and one photocopy.',
        ...$overrides,
    ];
}

test('an admin can set an in-person date for the parent to bring documents', function () {
    $this->actingAs($this->admin)
        ->put(route('admin.enrollments.document-appointment.update', $this->enrollment), appointmentPayload())
        ->assertRedirect()
        ->assertSessionHasNoErrors()
        ->assertSessionHas('success', 'Appointment set for Oct 10, 2026 at 9:30 AM. The parent was notified in their portal.');

    $appointment = $this->enrollment->documentAppointment()->sole();

    expect($appointment->scheduled_on->toDateString())->toBe('2026-10-10')
        ->and($appointment->documents)->toBe(['birth_certificate', 'good_moral'])
        ->and($appointment->note)->toBe('Bring the original and one photocopy.')
        ->and($appointment->scheduled_by)->toBe($this->admin->id);

    Notification::assertSentTo($this->enrollee, DocumentAppointmentScheduled::class, function (DocumentAppointmentScheduled $notification) {
        $data = $notification->toArray($this->enrollee);

        return $data['type'] === 'document_appointment'
            && str_contains($data['message'], 'PSA Birth Certificate, Good Moral Certificate')
            && str_contains($data['message'], 'Oct 10, 2026 at 9:30 AM')
            && str_contains($data['message'], 'Bring the original and one photocopy.');
    });
});

test('the time is optional', function () {
    $this->actingAs($this->admin)
        ->put(route('admin.enrollments.document-appointment.update', $this->enrollment), appointmentPayload(['scheduled_time' => null]))
        ->assertSessionHasNoErrors()
        ->assertSessionHas('success', 'Appointment set for Oct 10, 2026. The parent was notified in their portal.');

    expect($this->enrollment->documentAppointment->scheduled_time)->toBeNull();
});

test('setting a date again reschedules the same appointment', function () {
    DocumentAppointment::factory()->for($this->enrollment)->create(['scheduled_on' => '2026-10-08']);

    $this->actingAs($this->admin)
        ->put(route('admin.enrollments.document-appointment.update', $this->enrollment), appointmentPayload(['scheduled_on' => '2026-10-15']))
        ->assertSessionHasNoErrors();

    expect(DocumentAppointment::count())->toBe(1)
        ->and($this->enrollment->documentAppointment->scheduled_on->toDateString())->toBe('2026-10-15');
});

test('an application without a portal account can still get an appointment', function () {
    $enrollment = Enrollment::factory()->create(['enrollee_user_id' => null]);

    $this->actingAs($this->admin)
        ->put(route('admin.enrollments.document-appointment.update', $enrollment), appointmentPayload())
        ->assertSessionHasNoErrors()
        ->assertSessionHas('success', 'Appointment set for Oct 10, 2026 at 9:30 AM. This application has no portal account, so let the parent know directly.');

    Notification::assertNothingSent();
});

test('the appointment is validated', function (array $overrides, array $errors) {
    $this->actingAs($this->admin)
        ->put(route('admin.enrollments.document-appointment.update', $this->enrollment), appointmentPayload($overrides))
        ->assertSessionHasErrors($errors);

    expect(DocumentAppointment::count())->toBe(0);
})->with([
    'no date' => [['scheduled_on' => ''], ['scheduled_on']],
    'in the past' => [['scheduled_on' => '2026-10-03'], ['scheduled_on' => 'The appointment can\'t be in the past.']],
    'bad time' => [['scheduled_time' => '25:00'], ['scheduled_time']],
    'no documents' => [['documents' => []], ['documents' => 'Choose at least one document to bring.']],
    'unknown document' => [['documents' => ['passport']], ['documents.0']],
    'note too long' => [['note' => str_repeat('a', 501)], ['note']],
]);

test('today is allowed', function () {
    $this->actingAs($this->admin)
        ->put(route('admin.enrollments.document-appointment.update', $this->enrollment), appointmentPayload(['scheduled_on' => '2026-10-04']))
        ->assertSessionHasNoErrors();
});

test('an admin can cancel the appointment, and the parent is told', function () {
    DocumentAppointment::factory()->for($this->enrollment)->create();

    $this->actingAs($this->admin)
        ->delete(route('admin.enrollments.document-appointment.destroy', $this->enrollment))
        ->assertRedirect()
        ->assertSessionHas('success', 'Appointment cancelled.');

    expect(DocumentAppointment::count())->toBe(0);
    Notification::assertSentTo($this->enrollee, DocumentAppointmentCancelled::class);
});

test('cancelling when there is no appointment is not found', function () {
    $this->actingAs($this->admin)
        ->delete(route('admin.enrollments.document-appointment.destroy', $this->enrollment))
        ->assertNotFound();
});

test('only admins can set or cancel appointments', function () {
    $staff = User::factory()->create(['role' => 'CASHIER']);
    DocumentAppointment::factory()->for($this->enrollment)->create();

    $this->actingAs($staff)
        ->put(route('admin.enrollments.document-appointment.update', $this->enrollment), appointmentPayload())
        ->assertForbidden();
    $this->actingAs($staff)
        ->delete(route('admin.enrollments.document-appointment.destroy', $this->enrollment))
        ->assertForbidden();

    expect(DocumentAppointment::count())->toBe(1);
});

test('guests are sent to log in', function () {
    $this->put(route('admin.enrollments.document-appointment.update', $this->enrollment), appointmentPayload())
        ->assertRedirect(route('login'));
});

test('the appointment shows on the admin application page and in the parent portal', function () {
    DocumentAppointment::factory()->for($this->enrollment)->create(['scheduled_on' => '2026-10-10']);

    $this->actingAs($this->admin)
        ->get(route('admin.enrollments.show', $this->enrollment))
        ->assertInertia(fn (Assert $page) => $page
            ->where('enrollment.document_appointment.scheduled_on', '2026-10-10')
            ->where('today', '2026-10-04'));

    $this->actingAs($this->enrollee, 'enrollee')
        ->get(route('portal.dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('enrollments.0.document_appointment.scheduled_on', '2026-10-10')
            ->where('enrollments.0.document_appointment.documents', ['birth_certificate']));
});

test('deleting the application deletes its appointment', function () {
    DocumentAppointment::factory()->for($this->enrollment)->create();

    $this->enrollment->delete();

    expect(DocumentAppointment::count())->toBe(0);
});
