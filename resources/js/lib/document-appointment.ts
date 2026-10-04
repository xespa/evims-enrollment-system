/** A date for the parent to bring documents to the registrar in person. */
export interface DocumentAppointmentData {
    id: number;
    /** Y-m-d, in the school's time. */
    scheduled_on: string;
    /** H:i:s, or null when no time was set. */
    scheduled_time: string | null;
    /** Document types, e.g. "birth_certificate". */
    documents: string[];
    note: string | null;
}

/** "Sat, Oct 10, 2026 at 9:00 AM", or just the date when no time was set. */
export function formatAppointment(
    appointment: DocumentAppointmentData,
): string {
    const date = new Date(
        `${appointment.scheduled_on}T${appointment.scheduled_time ?? '00:00:00'}`,
    );
    const day = date.toLocaleDateString('en-PH', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    if (!appointment.scheduled_time) {
        return day;
    }

    return `${day} at ${date.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })}`;
}
