import { router, useForm } from '@inertiajs/react';
import { CalendarCheck, CalendarPlus } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import type { ConfirmOptions } from '@/hooks/use-confirm';
import { formatAppointment } from '@/lib/document-appointment';
import type { DocumentAppointmentData } from '@/lib/document-appointment';

interface DocumentOption {
    type: string;
    label: string;
}

interface DocumentAppointmentProps {
    enrollmentId: number;
    appointment: DocumentAppointmentData | null;
    documents: DocumentOption[];
    /** Types still missing a file, ticked by default for a new appointment. */
    missingTypes: string[];
    /** Today's date at the school (Y-m-d), the earliest date allowed. */
    today: string;
    hasEnrollee: boolean;
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const INPUT_CLASS =
    'w-full rounded-lg border border-[#1F2A24]/15 bg-white px-2 py-1.5 text-xs text-[#1F2A24] focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none';

/**
 * Lets the registrar set a date for the parent to bring documents to the
 * office in person, when they can't upload them yet.
 */
export default function DocumentAppointment({
    enrollmentId,
    appointment,
    documents,
    missingTypes,
    today,
    hasEnrollee,
    confirm,
}: DocumentAppointmentProps) {
    const [open, setOpen] = useState(false);
    const { data, setData, put, processing, errors, reset, clearErrors } =
        useForm({
            scheduled_on: appointment?.scheduled_on ?? '',
            scheduled_time: appointment?.scheduled_time?.slice(0, 5) ?? '',
            documents: appointment?.documents ?? missingTypes,
            note: appointment?.note ?? '',
        });

    const toggleOpen = () => {
        setOpen((o) => !o);
        reset();
        clearErrors();
    };

    const toggleDocument = (type: string) => {
        setData(
            'documents',
            data.documents.includes(type)
                ? data.documents.filter((t) => t !== type)
                : [...data.documents, type],
        );
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        put(
            route(
                'admin.enrollments.document-appointment.update',
                enrollmentId,
            ),
            {
                preserveScroll: true,
                onSuccess: () => setOpen(false),
            },
        );
    };

    const cancelAppointment = async () => {
        if (!appointment) return;

        const confirmed = await confirm({
            title: 'Cancel this appointment?',
            description: hasEnrollee
                ? `The parent will be told they don't need to come in on ${formatAppointment(appointment)}.`
                : `There's no portal account on this application, so let the parent know they don't need to come in on ${formatAppointment(appointment)}.`,
            confirmLabel: 'Cancel appointment',
            destructive: true,
        });

        if (!confirmed) return;

        router.delete(
            route(
                'admin.enrollments.document-appointment.destroy',
                enrollmentId,
            ),
            { preserveScroll: true },
        );
    };

    const labelFor = (type: string) =>
        documents.find((doc) => doc.type === type)?.label ?? type;

    return (
        <div className="mb-3 rounded-xl border border-[#1F2A24]/10 p-3">
            {appointment && !open ? (
                <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex gap-2 text-xs text-[#1F2A24]">
                        <CalendarCheck
                            className="mt-0.5 h-4 w-4 shrink-0 text-[#2F6F4E]"
                            aria-hidden="true"
                        />
                        <div>
                            <p className="font-semibold">
                                In-person appointment ·{' '}
                                {formatAppointment(appointment)}
                            </p>
                            <p className="text-[#1F2A24]/70">
                                To bring:{' '}
                                {appointment.documents.map(labelFor).join(', ')}
                            </p>
                            {appointment.note && (
                                <p className="mt-0.5 text-[#1F2A24]/70 italic">
                                    “{appointment.note}”
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-1">
                        <button
                            type="button"
                            onClick={toggleOpen}
                            className="min-h-8 rounded-full px-2 text-xs font-semibold text-[#2F6F4E] hover:bg-[#2F6F4E]/5 hover:underline"
                        >
                            Reschedule
                        </button>
                        <button
                            type="button"
                            onClick={cancelAppointment}
                            className="min-h-8 rounded-full px-2 text-xs font-medium text-[#1F2A24]/70 hover:bg-[#1F2A24]/5 hover:text-[#1F2A24]"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : !open ? (
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-[#1F2A24]/70">
                        Can't upload yet? Set a date for the parent to bring
                        documents to the office.
                    </p>
                    <button
                        type="button"
                        onClick={toggleOpen}
                        className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-[#2F6F4E]/30 px-3 text-xs font-semibold text-[#2F6F4E] hover:bg-[#2F6F4E]/5"
                    >
                        <CalendarPlus
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                        />
                        Set date
                    </button>
                </div>
            ) : (
                <form onSubmit={submit} className="space-y-2">
                    <p className="text-xs font-semibold text-[#1F2A24]">
                        {appointment
                            ? 'Reschedule appointment'
                            : 'In-person document appointment'}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label
                                htmlFor={`appointment-date-${enrollmentId}`}
                                className="mb-1 block text-xs font-medium text-[#1F2A24]/80"
                            >
                                Date
                            </label>
                            <input
                                id={`appointment-date-${enrollmentId}`}
                                type="date"
                                required
                                min={today}
                                value={data.scheduled_on}
                                onChange={(e) =>
                                    setData('scheduled_on', e.target.value)
                                }
                                aria-invalid={!!errors.scheduled_on}
                                className={INPUT_CLASS}
                            />
                        </div>
                        <div>
                            <label
                                htmlFor={`appointment-time-${enrollmentId}`}
                                className="mb-1 block text-xs font-medium text-[#1F2A24]/80"
                            >
                                Time (optional)
                            </label>
                            <input
                                id={`appointment-time-${enrollmentId}`}
                                type="time"
                                value={data.scheduled_time}
                                onChange={(e) =>
                                    setData('scheduled_time', e.target.value)
                                }
                                aria-invalid={!!errors.scheduled_time}
                                className={INPUT_CLASS}
                            />
                        </div>
                    </div>

                    <fieldset>
                        <legend className="mb-1 text-xs font-medium text-[#1F2A24]/80">
                            Documents to bring
                        </legend>
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                            {documents.map((doc) => (
                                <label
                                    key={doc.type}
                                    className="flex min-h-8 items-center gap-1.5 text-xs text-[#1F2A24]"
                                >
                                    <input
                                        type="checkbox"
                                        checked={data.documents.includes(
                                            doc.type,
                                        )}
                                        onChange={() =>
                                            toggleDocument(doc.type)
                                        }
                                        className="h-4 w-4 accent-[#2F6F4E]"
                                    />
                                    {doc.label}
                                </label>
                            ))}
                        </div>
                    </fieldset>

                    <textarea
                        aria-label="Note to parent"
                        value={data.note}
                        onChange={(e) => setData('note', e.target.value)}
                        placeholder="Optional note, e.g. bring the original and one photocopy"
                        rows={2}
                        maxLength={500}
                        className={INPUT_CLASS}
                    />

                    {(errors.scheduled_on ||
                        errors.scheduled_time ||
                        errors.documents ||
                        errors.note) && (
                        <p role="alert" className="text-xs text-[#C6473B]">
                            {errors.scheduled_on ||
                                errors.scheduled_time ||
                                errors.documents ||
                                errors.note}
                        </p>
                    )}

                    <p className="text-xs text-[#1F2A24]/65">
                        {hasEnrollee
                            ? 'The parent is notified in their portal.'
                            : 'No portal account on this application — let the parent know directly.'}
                    </p>

                    <div className="flex items-center gap-2">
                        <button
                            type="submit"
                            disabled={processing}
                            className="min-h-8 rounded-full bg-[#2F6F4E] px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-[#25573E] disabled:cursor-wait disabled:opacity-50"
                        >
                            {processing ? 'Saving…' : 'Save appointment'}
                        </button>
                        <button
                            type="button"
                            onClick={toggleOpen}
                            className="min-h-8 rounded-full px-1.5 text-xs text-[#1F2A24]/70 hover:text-[#1F2A24]"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
