<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateDocumentAppointmentRequest;
use App\Models\Enrollment;
use App\Models\User;
use App\Notifications\DocumentAppointmentCancelled;
use App\Notifications\DocumentAppointmentScheduled;
use Illuminate\Http\RedirectResponse;

/**
 * Sets (or reschedules) the day a parent brings documents to the
 * registrar's office in person, when they can't upload them yet.
 */
class DocumentAppointmentController extends Controller
{
    public function update(UpdateDocumentAppointmentRequest $request, Enrollment $enrollment): RedirectResponse
    {
        /** @var User $admin Admin routes use the staff (web) guard. */
        $admin = $request->user();

        $appointment = $enrollment->documentAppointment()->updateOrCreate([], [
            ...$request->validated(),
            'scheduled_by' => $admin->id,
        ]);

        $enrollment->loadMissing('student', 'enrolleeUser');
        $enrollment->enrolleeUser?->notify(new DocumentAppointmentScheduled($enrollment, $appointment));

        $message = "Appointment set for {$appointment->formattedSchedule()}.";
        $message .= $enrollment->enrolleeUser
            ? ' The parent was notified in their portal.'
            : ' This application has no portal account, so let the parent know directly.';

        return back()->with('success', $message);
    }

    public function destroy(Enrollment $enrollment): RedirectResponse
    {
        $appointment = $enrollment->documentAppointment()->firstOrFail();
        $appointment->delete();

        $enrollment->loadMissing('student', 'enrolleeUser');
        $enrollment->enrolleeUser?->notify(new DocumentAppointmentCancelled($enrollment, $appointment));

        return back()->with('success', 'Appointment cancelled.');
    }
}
