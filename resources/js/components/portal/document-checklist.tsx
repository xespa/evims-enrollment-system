import {
    CalendarCheck,
    CheckCircle2,
    Circle,
    Clock,
    Eye,
    Loader2,
    School,
    Upload,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ChangeEvent } from 'react';
import EnrollmentStatusBadge from '@/components/portal/enrollment-status-badge';
import { formatAppointment } from '@/lib/document-appointment';
import {
    DOCUMENTS,
    canUploadDocuments,
    documentState,
    studentName,
} from '@/lib/portal-enrollment';
import type { DocumentState } from '@/lib/portal-enrollment';
import { cn } from '@/lib/utils';
import type { PortalDocumentType, PortalEnrollment } from '@/types/portal';

const STATE_DISPLAY: Record<
    DocumentState,
    { label: string; icon: LucideIcon; className: string }
> = {
    verified: {
        label: 'Verified',
        icon: CheckCircle2,
        className: 'text-[#2F6F4E]',
    },
    pending: {
        label: 'Pending review',
        icon: Clock,
        className: 'text-[#a4670f]',
    },
    missing: {
        label: 'Not uploaded yet',
        icon: Circle,
        className: 'text-[#1F2A24]/50',
    },
    'school-provided': {
        label: 'The registrar will attach this',
        icon: School,
        className: 'text-[#1F2A24]/65',
    },
};

export default function DocumentChecklist({
    enrollment,
    uploadingKey,
    onUpload,
    onView,
}: {
    enrollment: PortalEnrollment;
    uploadingKey: string | null;
    onUpload: (
        enrollment: PortalEnrollment,
        type: PortalDocumentType,
        file: File,
    ) => void;
    onView: (title: string, path: string) => void;
}) {
    const isCancelled = Boolean(enrollment.cancelled_at);
    const isEditable = canUploadDocuments(enrollment);
    const states = DOCUMENTS.map((doc) => ({
        doc,
        ...documentState(enrollment, doc.type),
    }));
    const completedCount = states.filter(
        ({ state }) => state !== 'missing',
    ).length;
    const appointment = enrollment.document_appointment;

    const handleFileChange =
        (type: PortalDocumentType) =>
        (event: ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            // Lets the same file be picked again after a failed upload.
            event.target.value = '';

            if (file) {
                onUpload(enrollment, type, file);
            }
        };

    return (
        <article
            aria-labelledby={`documents-${enrollment.id}-title`}
            className="rounded-xl border border-[#1F2A24]/10 bg-white p-5 shadow-sm"
        >
            <header className="mb-4 flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h3
                        id={`documents-${enrollment.id}-title`}
                        className="font-semibold text-[#1F2A24]"
                    >
                        {studentName(enrollment)}
                    </h3>
                    <p className="text-xs text-[#1F2A24]/65">
                        {enrollment.grade_level.name} · SY{' '}
                        {enrollment.school_year} ·{' '}
                        <span className="font-medium tabular-nums">
                            {completedCount} of {DOCUMENTS.length}
                        </span>{' '}
                        submitted
                    </p>
                </div>
                <EnrollmentStatusBadge enrollment={enrollment} />
            </header>

            {appointment && isEditable && (
                <div
                    role="note"
                    className="mb-4 flex gap-2 rounded-lg border border-[#2F6F4E]/20 bg-[#2F6F4E]/5 p-3 text-sm text-[#1F2A24]"
                >
                    <CalendarCheck
                        className="mt-0.5 h-4 w-4 shrink-0 text-[#2F6F4E]"
                        aria-hidden="true"
                    />
                    <div>
                        <p className="font-semibold">
                            Bring documents to the registrar's office on{' '}
                            {formatAppointment(appointment)}
                        </p>
                        <p className="text-xs text-[#1F2A24]/70">
                            Please bring:{' '}
                            {appointment.documents
                                .map(
                                    (type) =>
                                        DOCUMENTS.find(
                                            (doc) => doc.type === type,
                                        )?.label ?? type,
                                )
                                .join(', ')}
                        </p>
                        {appointment.note && (
                            <p className="mt-1 text-xs text-[#1F2A24]/70">
                                Note from the registrar: “{appointment.note}”
                            </p>
                        )}
                    </div>
                </div>
            )}

            <ul className="divide-y divide-[#1F2A24]/5">
                {states.map(({ doc, state, path }) => {
                    const display = STATE_DISPLAY[state];
                    const StateIcon = display.icon;
                    const key = `${enrollment.id}:${doc.type}`;
                    const isUploading = uploadingKey === key;

                    return (
                        <li
                            key={doc.type}
                            className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
                        >
                            <div className="flex min-w-0 items-start gap-2.5">
                                <StateIcon
                                    className={cn(
                                        'mt-0.5 h-4 w-4 shrink-0',
                                        display.className,
                                    )}
                                    aria-hidden="true"
                                />
                                <div>
                                    <p className="text-sm text-[#1F2A24]">
                                        {doc.label}
                                    </p>
                                    <p
                                        className={cn(
                                            'text-xs font-medium',
                                            display.className,
                                        )}
                                    >
                                        {display.label}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {path && (
                                    <button
                                        type="button"
                                        onClick={() => onView(doc.label, path)}
                                        className="inline-flex min-h-9 items-center gap-1 rounded-full px-3 text-xs font-semibold text-[#2F6F4E] hover:bg-[#2F6F4E]/5"
                                    >
                                        <Eye
                                            className="h-3.5 w-3.5"
                                            aria-hidden="true"
                                        />
                                        View
                                        <span className="sr-only">
                                            {' '}
                                            {doc.label}
                                        </span>
                                    </button>
                                )}
                                {state ===
                                'school-provided' ? null : !isEditable ? (
                                    <span className="text-xs text-[#1F2A24]/65">
                                        {isCancelled ? 'Cancelled' : 'Locked'}
                                    </span>
                                ) : (
                                    <label
                                        className={cn(
                                            'relative inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full px-4 text-xs font-semibold transition-colors focus-within:ring-2 focus-within:ring-[#2F6F4E] focus-within:ring-offset-1',
                                            state === 'missing'
                                                ? 'bg-[#2F6F4E] text-[#FBF8F2] hover:bg-[#25573E]'
                                                : 'border border-[#1F2A24]/15 text-[#1F2A24]/80 hover:bg-[#1F2A24]/5',
                                            isUploading &&
                                                'pointer-events-none opacity-70',
                                        )}
                                    >
                                        {isUploading ? (
                                            <Loader2
                                                className="h-3.5 w-3.5 animate-spin"
                                                aria-hidden="true"
                                            />
                                        ) : (
                                            <Upload
                                                className="h-3.5 w-3.5"
                                                aria-hidden="true"
                                            />
                                        )}
                                        {isUploading
                                            ? 'Uploading…'
                                            : path
                                              ? 'Replace'
                                              : 'Upload'}
                                        <span className="sr-only">
                                            {' '}
                                            {doc.label}
                                        </span>
                                        <input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            className="sr-only"
                                            disabled={isUploading}
                                            onChange={handleFileChange(
                                                doc.type,
                                            )}
                                        />
                                    </label>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>

            {isEditable && (
                <p className="mt-4 text-xs text-[#1F2A24]/60">
                    PDF, JPG or PNG, up to 10 MB each.
                </p>
            )}
        </article>
    );
}
