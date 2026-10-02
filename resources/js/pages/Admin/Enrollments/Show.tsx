import { Head, Link, router, usePage, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AssignLrnForm from '@/components/assign-lrn-form';
import DocumentViewerDialog, {
    isPdfPath,
} from '@/components/document-viewer-dialog';
import RecordCounterPaymentDialog from '@/components/record-counter-payment-dialog';
import VoidPaymentDialog from '@/components/void-payment-dialog';
import { useConfirm } from '@/hooks/use-confirm';
import RejectApplicationDialog from '@/pages/Admin/Enrollments/Components/RejectApplicationDialog';
import UploadDocumentForm from '@/pages/Admin/Enrollments/Components/UploadDocumentForm';
import {
    formatMobileNumber,
    isValidMobileNumber,
} from '@/pages/Enrollment/Components/mobile-number';

/** "+63 917 123 4567"; anything saved before numbers were validated is shown as-is. */
function displayMobileNumber(value) {
    return value && isValidMobileNumber(value)
        ? formatMobileNumber(value)
        : value;
}

function InfoRow({ label, value }) {
    return (
        <div className="flex justify-between gap-4 border-b border-[#1F2A24]/10 py-2 text-sm">
            <span className="shrink-0 text-[#1F2A24]/70">{label}</span>
            <span className="min-w-0 text-right font-medium break-words text-[#1F2A24]">
                {value || '—'}
            </span>
        </div>
    );
}

function CheckboxField({ label, checked, onChange }) {
    return (
        <label className="flex cursor-pointer items-center gap-2 py-1.5">
            <input
                type="checkbox"
                checked={!!checked}
                onChange={onChange}
                className="h-4 w-4 rounded border-[#1F2A24]/20 text-[#2F6F4E] focus:ring-[#2F6F4E]"
            />
            <span className="text-sm text-[#1F2A24]/80">{label}</span>
        </label>
    );
}

const INSTALLMENT_STATUS_STYLES = {
    UNPAID: 'bg-gray-100 text-gray-700',
    PARTIALLY_PAID: 'bg-yellow-100 text-yellow-800',
    PAID: 'bg-green-100 text-green-800',
};

const INSTALLMENT_STATUS_LABELS = {
    UNPAID: 'Unpaid',
    PARTIALLY_PAID: 'Partially paid',
    PAID: 'Paid',
};

function formatCurrency(value) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
    }).format(value);
}

function formatShortDate(value) {
    return new Date(value).toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

const METHOD_LABELS = { CASH: 'Counter', GCASH: 'GCash' };

function PaymentsSection({ enrollment }) {
    const [isRecording, setIsRecording] = useState(false);
    // Remounts the dialog per opening so it starts from the latest balance.
    const [recordSession, setRecordSession] = useState(0);
    const [voidingPayment, setVoidingPayment] = useState(null);
    const [isVoiding, setIsVoiding] = useState(false);

    const billingContract = enrollment.billing_contract;
    const installments = billingContract?.installments ?? [];
    const paysAtCounter = billingContract?.payment_channel !== 'GCASH';

    const installmentPaid = (installment) =>
        installment.payments
            .filter((p) => p.status === 'COMPLETED')
            .reduce((s, p) => s + Number(p.amount), 0);

    const totalDue = installments.reduce(
        (sum, i) => sum + Number(i.amount_due),
        0,
    );
    const totalPaid = installments.reduce(
        (sum, i) => sum + installmentPaid(i),
        0,
    );
    const hasBalance = totalDue - totalPaid > 0.004;

    // Every active counter payment on one OR number is voided together.
    const activeCounterPayments = installments
        .flatMap((i) => i.payments)
        .filter((p) => p.method === 'CASH' && p.status === 'COMPLETED');
    const receiptParts = (payment) =>
        payment.receipt_number
            ? activeCounterPayments.filter(
                  (p) => p.receipt_number === payment.receipt_number,
              )
            : [payment];

    const openVoid = (payment) => {
        setVoidingPayment(payment);
        setIsVoiding(true);
    };

    return (
        <div className="mt-6 border-t border-[#1F2A24]/10 pt-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xs font-semibold tracking-[0.1em] text-[#2F6F4E] uppercase">
                        Payments
                    </h2>
                    {billingContract && (
                        <span className="rounded-full bg-[#1F2A24]/5 px-2.5 py-0.5 text-xs font-medium text-[#1F2A24]/70">
                            {paysAtCounter
                                ? 'Pays at the school counter'
                                : 'Pays online via GCash'}
                        </span>
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="text-sm text-[#1F2A24]/70">
                        Paid{' '}
                        <span className="font-semibold text-[#2F6F4E]">
                            {formatCurrency(totalPaid)}
                        </span>{' '}
                        of{' '}
                        <span className="font-semibold text-[#1F2A24]">
                            {formatCurrency(totalDue)}
                        </span>
                    </div>
                    {hasBalance && (
                        <button
                            type="button"
                            onClick={() => {
                                setRecordSession((n) => n + 1);
                                setIsRecording(true);
                            }}
                            className="min-h-9 rounded-full bg-[#2F6F4E] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#25573E]"
                        >
                            Record counter payment
                        </button>
                    )}
                </div>
            </div>

            <div className="divide-y divide-[#1F2A24]/10">
                {installments.map((installment) => {
                    const paid = installmentPaid(installment);
                    const remaining = Number(installment.amount_due) - paid;
                    // Voided payments stay listed (struck through) so the record is complete.
                    const shownPayments = installment.payments.filter((p) =>
                        ['COMPLETED', 'VOIDED'].includes(p.status),
                    );

                    return (
                        <div key={installment.id} className="py-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <span className="text-sm font-medium text-[#1F2A24]">
                                        Installment #
                                        {installment.installment_number}
                                    </span>
                                    <span className="ml-2 text-xs text-[#1F2A24]/70">
                                        Due{' '}
                                        {formatShortDate(installment.due_date)}
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="text-sm text-[#1F2A24]/70 tabular-nums">
                                        {formatCurrency(installment.amount_due)}
                                    </span>
                                    <span
                                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${INSTALLMENT_STATUS_STYLES[installment.status]}`}
                                    >
                                        {INSTALLMENT_STATUS_LABELS[
                                            installment.status
                                        ] ?? installment.status}
                                    </span>
                                </div>
                            </div>

                            {paid > 0 && installment.status !== 'PAID' && (
                                <p className="mt-1 text-xs text-[#1F2A24]/70">
                                    {formatCurrency(paid)} paid so far,{' '}
                                    {formatCurrency(remaining)} remaining
                                </p>
                            )}

                            {shownPayments.length > 0 && (
                                <ul className="mt-2 space-y-1.5 border-l-2 border-[#2F6F4E]/15 pl-3">
                                    {shownPayments.map((payment) => {
                                        const isVoided =
                                            payment.status === 'VOIDED';
                                        const canVoid =
                                            payment.method === 'CASH' &&
                                            !isVoided;

                                        return (
                                            <li
                                                key={payment.id}
                                                className="text-xs text-[#1F2A24]/65"
                                            >
                                                <div className="flex flex-wrap items-center justify-between gap-x-3">
                                                    <span
                                                        className={
                                                            isVoided
                                                                ? 'line-through'
                                                                : undefined
                                                        }
                                                    >
                                                        {METHOD_LABELS[
                                                            payment.method
                                                        ] ?? payment.method}
                                                        {payment.paid_at &&
                                                            ` · ${formatShortDate(payment.paid_at)}`}
                                                        {payment.receipt_number &&
                                                            ` · OR ${payment.receipt_number}`}
                                                    </span>
                                                    <span className="flex items-center gap-2">
                                                        {isVoided && (
                                                            <span className="rounded-full bg-[#1F2A24]/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[#1F2A24]/70 uppercase">
                                                                Voided
                                                            </span>
                                                        )}
                                                        <span
                                                            className={`tabular-nums ${isVoided ? 'line-through' : ''}`}
                                                        >
                                                            {formatCurrency(
                                                                payment.amount,
                                                            )}
                                                        </span>
                                                        {canVoid && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openVoid(
                                                                        payment,
                                                                    )
                                                                }
                                                                className="min-h-8 rounded-full px-2 font-medium text-[#A83A30] hover:bg-[#C6473B]/10"
                                                            >
                                                                Void
                                                            </button>
                                                        )}
                                                    </span>
                                                </div>
                                                {isVoided && (
                                                    <p className="mt-0.5 text-[#1F2A24]/55 italic">
                                                        Voided
                                                        {payment.voided_by
                                                            ?.name &&
                                                            ` by ${payment.voided_by.name}`}
                                                        {payment.voided_at &&
                                                            ` on ${formatShortDate(payment.voided_at)}`}
                                                        {payment.void_reason &&
                                                            `: ${payment.void_reason}`}
                                                    </p>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    );
                })}

                {installments.length === 0 && (
                    <p className="py-3 text-sm text-[#1F2A24]/65">
                        No installment schedule found.
                    </p>
                )}
            </div>

            {installments.length > 0 && (
                <RecordCounterPaymentDialog
                    key={recordSession}
                    enrollmentId={enrollment.id}
                    unpaidInstallments={installments
                        .map((installment) => ({
                            id: installment.id,
                            installment_number: installment.installment_number,
                            owed: Math.max(
                                0,
                                Number(installment.amount_due) -
                                    installmentPaid(installment),
                            ),
                        }))
                        .filter((installment) => installment.owed > 0.004)}
                    open={isRecording}
                    onOpenChange={setIsRecording}
                />
            )}

            {voidingPayment && (
                <VoidPaymentDialog
                    key={voidingPayment.id}
                    payment={voidingPayment}
                    receiptTotal={receiptParts(voidingPayment).reduce(
                        (s, p) => s + Number(p.amount),
                        0,
                    )}
                    receiptParts={receiptParts(voidingPayment).length}
                    open={isVoiding}
                    onOpenChange={setIsVoiding}
                />
            )}
        </div>
    );
}

const STATUS_STYLES = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
};

const DOCUMENTS = [
    {
        type: 'form_138',
        label: 'Form 138',
        verifiedKey: 'has_form_138',
        pathKey: 'form_138_path',
    },
    {
        type: 'birth_certificate',
        label: 'PSA Birth Certificate',
        verifiedKey: 'has_birth_certificate',
        pathKey: 'birth_certificate_path',
    },
    {
        type: 'good_moral',
        label: 'Good Moral Certificate',
        verifiedKey: 'has_good_moral_certificate',
        pathKey: 'good_moral_path',
    },
];

const REMINDER_REASONS = [
    { value: 'NOT_SUBMITTED', label: 'Not submitted yet' },
    { value: 'BLURRY', label: 'Image is blurry / hard to read' },
    { value: 'WRONG_DOCUMENT', label: 'Wrong document uploaded' },
    { value: 'INCOMPLETE', label: 'Incomplete / missing pages' },
    { value: 'EXPIRED', label: 'Outdated / expired document' },
    { value: 'OTHER', label: 'Other (add a note)' },
];

function DocumentRow({
    enrollmentId,
    doc,
    verification,
    hasEnrollee,
    onToggleVerification,
}) {
    const [open, setOpen] = useState(false);
    const [showNote, setShowNote] = useState(false);
    const [isViewing, setIsViewing] = useState(false);
    const hasFile = !!verification?.[doc.pathKey];
    const { data, setData, post, processing, errors, reset } = useForm({
        reason: hasFile ? 'BLURRY' : 'NOT_SUBMITTED',
        note: '',
    });

    const toggleOpen = () => {
        setOpen((o) => !o);
        setShowNote(false);
        reset();
    };

    const submit = (e) => {
        e.preventDefault();
        post(
            route('admin.enrollments.documents.remind', [
                enrollmentId,
                doc.type,
            ]),
            {
                preserveScroll: true,
                onSuccess: () => {
                    setOpen(false);
                    reset();
                },
            },
        );
    };

    return (
        <div className="border-b border-[#1F2A24]/10 py-1.5 last:border-0">
            <div className="flex items-center justify-between gap-2">
                <CheckboxField
                    label={doc.label}
                    checked={verification?.[doc.verifiedKey]}
                    onChange={() =>
                        onToggleVerification(
                            doc.verifiedKey,
                            verification?.[doc.verifiedKey],
                        )
                    }
                />
                {hasEnrollee && (
                    <button
                        type="button"
                        onClick={toggleOpen}
                        aria-expanded={open}
                        className="min-h-9 shrink-0 rounded-full px-2 text-xs font-semibold text-[#2F6F4E] hover:bg-[#2F6F4E]/5 hover:underline"
                    >
                        {open ? 'Cancel' : 'Remind'}
                    </button>
                )}
            </div>

            <div className="ml-6 flex flex-wrap items-center">
                {hasFile ? (
                    <>
                        <button
                            type="button"
                            onClick={() => setIsViewing(true)}
                            className="inline-block text-xs font-medium text-[#2F6F4E] hover:underline"
                        >
                            View uploaded file →
                        </button>
                        <DocumentViewerDialog
                            title={doc.label}
                            url={`/storage/${verification[doc.pathKey]}`}
                            isPdf={isPdfPath(verification[doc.pathKey])}
                            open={isViewing}
                            onOpenChange={setIsViewing}
                        />
                    </>
                ) : (
                    <p className="text-xs text-[#1F2A24]/65">
                        No file uploaded yet
                    </p>
                )}
                <UploadDocumentForm
                    enrollmentId={enrollmentId}
                    documentType={doc.type}
                    documentLabel={doc.label}
                    hasFile={hasFile}
                />
            </div>

            {open && (
                <form
                    onSubmit={submit}
                    className="mt-2 space-y-2 rounded-lg bg-[#E8A33D]/10 p-3"
                >
                    <label
                        htmlFor={`remind-reason-${doc.type}`}
                        className="block text-xs font-medium text-[#1F2A24]/80"
                    >
                        Reason for reminder
                    </label>
                    <select
                        id={`remind-reason-${doc.type}`}
                        value={data.reason}
                        onChange={(e) => setData('reason', e.target.value)}
                        className="w-full rounded-lg border border-[#1F2A24]/15 bg-white px-2 py-1.5 text-xs text-[#1F2A24] focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none"
                    >
                        {REMINDER_REASONS.map((reason) => (
                            <option key={reason.value} value={reason.value}>
                                {reason.label}
                            </option>
                        ))}
                    </select>

                    {(data.reason === 'OTHER' || showNote) && (
                        <textarea
                            aria-label="Note to parent"
                            value={data.note}
                            onChange={(e) => setData('note', e.target.value)}
                            placeholder={
                                data.reason === 'OTHER'
                                    ? 'Describe the issue...'
                                    : 'Optional note to include...'
                            }
                            rows={2}
                            className="w-full rounded-lg border border-[#1F2A24]/15 bg-white px-2 py-1.5 text-xs text-[#1F2A24] focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none"
                        />
                    )}

                    {data.reason !== 'OTHER' && !showNote && (
                        <button
                            type="button"
                            onClick={() => setShowNote(true)}
                            className="text-xs font-medium text-[#2F6F4E] hover:underline"
                        >
                            + Add a note
                        </button>
                    )}

                    <div className="flex items-center gap-2">
                        <button
                            type="submit"
                            disabled={processing}
                            className="min-h-9 rounded-full bg-[#E8A33D] px-4 py-1 text-xs font-semibold text-[#1F2A24] transition-colors hover:bg-[#d6922e] disabled:cursor-wait disabled:opacity-50"
                        >
                            {processing ? 'Sending…' : 'Send Reminder'}
                        </button>
                        {(errors.reason || errors.note || errors.reminder) && (
                            <span
                                role="alert"
                                className="text-xs text-[#C6473B]"
                            >
                                {errors.reason ||
                                    errors.note ||
                                    errors.reminder}
                            </span>
                        )}
                    </div>
                </form>
            )}
        </div>
    );
}

export default function Show({ enrollment, submittedFrom, rejectionReasons }) {
    const { props } = usePage();
    const flashSuccess = props.flash?.success;
    const statusError = props.errors?.enrollment_status;

    const student = enrollment.student;
    const isCancelled = !!enrollment.cancelled_at;
    const isMissingLrn = !student.lrn;
    const verification = enrollment.office_verification;
    const missingDocuments = DOCUMENTS.filter(
        (doc) => !verification?.[doc.pathKey],
    );
    const missingDocumentsError = props.errors?.missing_documents;
    const approveBlockers = [
        isMissingLrn && 'assign an LRN',
        missingDocuments.length > 0 &&
            `upload the ${missingDocuments.map((doc) => doc.label).join(', ')}`,
    ].filter(Boolean);

    const [confirm, confirmDialog] = useConfirm();
    const [isRejecting, setIsRejecting] = useState(false);
    const studentName = `${student.first_name} ${student.last_name}`;
    const rejectionReasonLabels = Object.fromEntries(
        rejectionReasons.map((reason) => [reason.value, reason.label]),
    );

    const STATUS_CONFIRMATIONS = {
        APPROVED: {
            title: `Approve ${studentName}'s application?`,
            description:
                'The parent will be emailed and notified, and tuition payment opens in their portal.',
            confirmLabel: 'Approve',
        },
        PENDING: {
            title: 'Reset this application to pending?',
            description:
                'It will go back into the review queue. No email is sent.',
            confirmLabel: 'Reset to Pending',
        },
    };

    const changeStatus = async (
        newStatus: keyof typeof STATUS_CONFIRMATIONS,
    ) => {
        if (!(await confirm(STATUS_CONFIRMATIONS[newStatus]))) return;
        router.patch(route('admin.enrollments.status.update', enrollment.id), {
            enrollment_status: newStatus,
        });
    };

    const archiveApplication = async () => {
        const confirmed = await confirm({
            title: `Archive ${studentName}'s application?`,
            description:
                'It will be hidden from the Students list. Nothing is deleted — its documents, billing, and payment records are kept, and you can restore it anytime from the Archived view.',
            confirmLabel: 'Archive',
        });
        if (!confirmed) {
            return;
        }
        router.post(route('admin.enrollments.archive.store', enrollment.id));
    };

    const restoreApplication = () => {
        router.delete(
            route('admin.enrollments.archive.destroy', enrollment.id),
            { preserveScroll: true },
        );
    };

    const toggleVerification = (field, currentValue) => {
        router.patch(
            route('admin.enrollments.verification.update', enrollment.id),
            {
                has_form_138:
                    field === 'has_form_138'
                        ? !currentValue
                        : verification.has_form_138,
                has_birth_certificate:
                    field === 'has_birth_certificate'
                        ? !currentValue
                        : verification.has_birth_certificate,
                has_good_moral_certificate:
                    field === 'has_good_moral_certificate'
                        ? !currentValue
                        : verification.has_good_moral_certificate,
            },
            { preserveScroll: true },
        );
    };

    return (
        <>
            <Head title={`${student.last_name}, ${student.first_name}`} />
            {confirmDialog}
            <RejectApplicationDialog
                enrollmentId={enrollment.id}
                studentName={studentName}
                reasons={rejectionReasons}
                open={isRejecting}
                onOpenChange={setIsRejecting}
            />

            <div className="bg-[#FBF8F2] px-4 py-8">
                <div className="mx-auto max-w-6xl">
                    <Link
                        href={route('admin.students.index')}
                        className="mb-4 inline-block text-sm font-medium text-[#2F6F4E] hover:underline"
                    >
                        ← Back to students
                    </Link>

                    {flashSuccess && (
                        <div
                            role="status"
                            className="mb-4 rounded-xl border border-[#2F6F4E]/25 bg-[#2F6F4E]/5 px-4 py-3 text-sm text-[#2F6F4E]"
                        >
                            {flashSuccess}
                        </div>
                    )}

                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <h1 className="font-serif text-2xl font-semibold text-[#1F2A24]">
                            {student.last_name}, {student.first_name}{' '}
                            {student.middle_name}
                        </h1>
                        {isCancelled ? (
                            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
                                CANCELLED
                            </span>
                        ) : (
                            <span
                                className={`rounded-full px-3 py-1 text-sm font-medium ${STATUS_STYLES[enrollment.enrollment_status]}`}
                            >
                                {enrollment.enrollment_status}
                            </span>
                        )}
                    </div>

                    {isCancelled && (
                        <div
                            role="status"
                            className="mb-4 rounded-xl border border-[#C6473B]/25 bg-[#C6473B]/5 px-4 py-3 text-sm text-[#1F2A24]"
                        >
                            <span className="font-semibold text-[#C6473B]">
                                Cancelled by the parent
                            </span>{' '}
                            on {formatShortDate(enrollment.cancelled_at)}. They
                            withdrew this application, so it can no longer be
                            approved or rejected.
                        </div>
                    )}

                    {enrollment.archived_at && (
                        <div
                            role="status"
                            className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#1F2A24]/15 bg-[#1F2A24]/5 px-4 py-3 text-sm text-[#1F2A24]"
                        >
                            <p>
                                <span className="font-semibold">Archived</span>{' '}
                                on {formatShortDate(enrollment.archived_at)}.
                                It's hidden from the Students list.
                            </p>
                            <button
                                type="button"
                                onClick={restoreApplication}
                                className="min-h-9 rounded-full bg-[#2F6F4E] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#25573E]"
                            >
                                Restore
                            </button>
                        </div>
                    )}

                    {!enrollment.parent_email_verified && (
                        <div
                            role="status"
                            className="mb-4 rounded-xl border border-[#E8A33D]/30 bg-[#E8A33D]/10 px-4 py-3 text-sm text-[#7a4d0b]"
                        >
                            <span className="font-semibold">
                                Email not verified.
                            </span>{' '}
                            The student portal account for{' '}
                            <span className="font-medium">
                                {enrollment.email}
                            </span>{' '}
                            hasn't been confirmed yet, so status emails may not
                            arrive and the student portal can't be opened.
                            Consider confirming the contact details before
                            approving.
                        </div>
                    )}

                    {isMissingLrn && !isCancelled && (
                        <div
                            role="status"
                            className="mb-4 flex flex-wrap items-start justify-between gap-3 rounded-xl border border-[#E8A33D]/30 bg-[#E8A33D]/10 px-4 py-3 text-sm text-[#7a4d0b]"
                        >
                            <p>
                                <span className="font-semibold">
                                    LRN required.
                                </span>{' '}
                                {studentName} doesn't have a Learner Reference
                                Number yet. Assign one before approving this
                                application.
                            </p>
                            <AssignLrnForm studentId={student.id} />
                        </div>
                    )}

                    {missingDocuments.length > 0 &&
                        enrollment.enrollment_status !== 'APPROVED' &&
                        !isCancelled && (
                            <div
                                role="status"
                                className="mb-4 rounded-xl border border-[#E8A33D]/30 bg-[#E8A33D]/10 px-4 py-3 text-sm text-[#7a4d0b]"
                            >
                                <p>
                                    <span className="font-semibold">
                                        Missing documents.
                                    </span>{' '}
                                    These files haven't been uploaded yet, so
                                    this application can't be approved:
                                </p>
                                <ul className="mt-1 list-disc pl-5 font-medium">
                                    {missingDocuments.map((doc) => (
                                        <li key={doc.type}>{doc.label}</li>
                                    ))}
                                </ul>
                                <a
                                    href="#document-verification"
                                    className="mt-2 inline-block font-semibold underline"
                                >
                                    Upload them or remind the parent ↓
                                </a>
                            </div>
                        )}

                    {enrollment.enrollment_status === 'REJECTED' &&
                        (enrollment.rejection_reasons?.length > 0 ||
                            enrollment.rejection_note) && (
                            <div className="mb-4 rounded-xl border border-[#C6473B]/25 bg-[#C6473B]/5 px-4 py-3 text-sm text-[#1F2A24]">
                                <p className="font-semibold text-[#C6473B]">
                                    Rejected because:
                                </p>
                                <ul className="mt-1 list-disc pl-5">
                                    {(enrollment.rejection_reasons ?? []).map(
                                        (reason) => (
                                            <li key={reason}>
                                                {rejectionReasonLabels[
                                                    reason
                                                ] ?? reason}
                                            </li>
                                        ),
                                    )}
                                </ul>
                                {enrollment.rejection_note && (
                                    <p className="mt-1">
                                        <span className="font-medium">
                                            Note to the parent:
                                        </span>{' '}
                                        {enrollment.rejection_note}
                                    </p>
                                )}
                            </div>
                        )}

                    {statusError && (
                        <div
                            role="alert"
                            className="mb-4 rounded-xl border border-[#C6473B]/25 bg-[#C6473B]/5 px-4 py-3 text-sm text-[#C6473B]"
                        >
                            {statusError}
                        </div>
                    )}

                    {missingDocumentsError && (
                        <div
                            role="alert"
                            className="mb-4 rounded-xl border border-[#C6473B]/25 bg-[#C6473B]/5 px-4 py-3 text-sm text-[#C6473B]"
                        >
                            {missingDocumentsError}
                        </div>
                    )}

                    {/* Approve/Reject actions */}
                    <div className="mb-6 flex flex-wrap gap-3 rounded-2xl border border-[#1F2A24]/10 bg-white p-4">
                        <button
                            type="button"
                            onClick={() => changeStatus('APPROVED')}
                            disabled={
                                enrollment.enrollment_status === 'APPROVED' ||
                                isCancelled ||
                                approveBlockers.length > 0
                            }
                            title={
                                isCancelled
                                    ? 'The parent cancelled this application.'
                                    : approveBlockers.length > 0
                                      ? `Before approving, ${approveBlockers.join(' and ')}.`
                                      : undefined
                            }
                            className="min-h-11 rounded-full bg-[#2F6F4E] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#25573E] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Approve
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsRejecting(true)}
                            disabled={
                                enrollment.enrollment_status === 'REJECTED' ||
                                isCancelled
                            }
                            title={
                                isCancelled
                                    ? 'The parent cancelled this application.'
                                    : undefined
                            }
                            className="min-h-11 rounded-full bg-[#C6473B] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#A83A30] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Reject
                        </button>
                        {enrollment.enrollment_status !== 'PENDING' && (
                            <button
                                type="button"
                                onClick={() => changeStatus('PENDING')}
                                className="min-h-11 rounded-full border border-[#1F2A24]/15 bg-white px-4 py-2 text-sm font-semibold text-[#1F2A24]/75 transition-colors hover:bg-[#1F2A24]/5"
                            >
                                Reset to Pending
                            </button>
                        )}

                        {!enrollment.archived_at && (
                            <button
                                type="button"
                                onClick={archiveApplication}
                                className="min-h-11 rounded-full border border-[#1F2A24]/15 bg-white px-4 py-2 text-sm font-semibold text-[#1F2A24]/75 transition-colors hover:bg-[#1F2A24]/5 sm:ml-auto"
                            >
                                Archive
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {/* Portal account the application came from */}
                        <div className="rounded-2xl border border-[#1F2A24]/10 bg-white p-5 md:col-span-2">
                            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                <h2 className="text-xs font-semibold tracking-[0.1em] text-[#2F6F4E] uppercase">
                                    Submitted From
                                </h2>
                                {submittedFrom && (
                                    <Link
                                        href={route(
                                            'admin.enrollee-accounts.index',
                                            {
                                                status: submittedFrom.account_status,
                                                search: submittedFrom.email,
                                            },
                                        )}
                                        className="text-xs font-semibold text-[#2F6F4E] hover:underline"
                                    >
                                        View in Portal Accounts →
                                    </Link>
                                )}
                            </div>
                            {submittedFrom ? (
                                <div className="grid grid-cols-1 gap-x-6 md:grid-cols-2">
                                    <InfoRow
                                        label="Account Name"
                                        value={submittedFrom.name}
                                    />
                                    <InfoRow
                                        label="Account Email"
                                        value={
                                            <>
                                                {submittedFrom.email}
                                                {!submittedFrom.email_verified && (
                                                    <span className="ml-2 rounded-full bg-[#E8A33D]/15 px-2 py-0.5 text-xs font-medium text-[#a4670f]">
                                                        Not verified
                                                    </span>
                                                )}
                                            </>
                                        }
                                    />
                                    <InfoRow
                                        label="Account Type"
                                        value={submittedFrom.account_type}
                                    />
                                    <InfoRow
                                        label="Account Status"
                                        value={
                                            <span
                                                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[submittedFrom.account_status]}`}
                                            >
                                                {submittedFrom.account_status}
                                            </span>
                                        }
                                    />
                                    <InfoRow
                                        label="Registered"
                                        value={
                                            submittedFrom.registered_at &&
                                            formatShortDate(
                                                submittedFrom.registered_at,
                                            )
                                        }
                                    />
                                </div>
                            ) : (
                                <p className="py-2 text-sm text-[#1F2A24]/65">
                                    No linked portal account — this application
                                    wasn't submitted from a signed-in account.
                                </p>
                            )}
                        </div>

                        {/* Student info */}
                        <div className="rounded-2xl border border-[#1F2A24]/10 bg-white p-5">
                            <h2 className="mb-2 text-xs font-semibold tracking-[0.1em] text-[#2F6F4E] uppercase">
                                Student Info
                            </h2>
                            <InfoRow label="LRN" value={student.lrn} />
                            <InfoRow
                                label="PSA Birth Cert No."
                                value={student.psa_birth_cert_no}
                            />
                            <InfoRow
                                label="Date of Birth"
                                value={student.date_of_birth}
                            />
                            <InfoRow label="Sex" value={student.sex} />
                            <InfoRow
                                label="Grade Level"
                                value={enrollment.grade_level.name}
                            />
                            <InfoRow
                                label="Student Type"
                                value={enrollment.student_type}
                            />
                            <InfoRow
                                label="School Year"
                                value={enrollment.school_year}
                            />
                            <InfoRow
                                label="Session"
                                value={enrollment.session_time_preference}
                            />
                        </div>

                        {/* Address */}
                        <div className="rounded-2xl border border-[#1F2A24]/10 bg-white p-5">
                            <h2 className="mb-2 text-xs font-semibold tracking-[0.1em] text-[#2F6F4E] uppercase">
                                Address
                            </h2>
                            <InfoRow
                                label="House/Street"
                                value={student.address?.house_number_street}
                            />
                            <InfoRow
                                label="Barangay"
                                value={student.address?.barangay}
                            />
                            <InfoRow
                                label="City/Municipality"
                                value={student.address?.city_municipality}
                            />
                            <InfoRow
                                label="Province"
                                value={student.address?.province}
                            />
                            <InfoRow
                                label="Zip Code"
                                value={student.address?.zip_code}
                            />
                            <InfoRow
                                label="Country"
                                value={student.address?.country}
                            />
                        </div>

                        {/* Parents */}
                        <div className="rounded-2xl border border-[#1F2A24]/10 bg-white p-5">
                            <h2 className="mb-2 text-xs font-semibold tracking-[0.1em] text-[#2F6F4E] uppercase">
                                Father
                            </h2>
                            <InfoRow
                                label="Name"
                                value={`${student.parent_profile?.father_first_name ?? ''} ${student.parent_profile?.father_last_name ?? ''}`}
                            />
                            <InfoRow
                                label="Occupation"
                                value={
                                    student.parent_profile?.father_occupation
                                }
                            />
                            <InfoRow
                                label="Mobile No."
                                value={displayMobileNumber(
                                    student.parent_profile?.father_mobile_no,
                                )}
                            />
                        </div>

                        <div className="rounded-2xl border border-[#1F2A24]/10 bg-white p-5">
                            <h2 className="mb-2 text-xs font-semibold tracking-[0.1em] text-[#2F6F4E] uppercase">
                                Mother
                            </h2>
                            <InfoRow
                                label="Name"
                                value={`${student.parent_profile?.mother_first_name ?? ''} ${student.parent_profile?.mother_maiden_last_name ?? ''}`}
                            />
                            <InfoRow
                                label="Occupation"
                                value={
                                    student.parent_profile?.mother_occupation
                                }
                            />
                            <InfoRow
                                label="Mobile No."
                                value={displayMobileNumber(
                                    student.parent_profile?.mother_mobile_no,
                                )}
                            />
                        </div>

                        {/* Subjects */}
                        <div className="rounded-2xl border border-[#1F2A24]/10 bg-white p-5 md:col-span-2">
                            <h2 className="mb-2 text-xs font-semibold tracking-[0.1em] text-[#2F6F4E] uppercase">
                                Enrolled Subjects
                            </h2>
                            <p className="text-sm text-[#1F2A24]/80">
                                {enrollment.subjects
                                    .map((s) => s.name)
                                    .join(', ') || '—'}
                            </p>
                        </div>

                        {/* Academic history */}
                        <div className="rounded-2xl border border-[#1F2A24]/10 bg-white p-5 md:col-span-2">
                            <h2 className="mb-2 text-xs font-semibold tracking-[0.1em] text-[#2F6F4E] uppercase">
                                Academic History
                            </h2>
                            <InfoRow
                                label="Last Grade Level Completed"
                                value={
                                    enrollment.academic_history
                                        ?.last_grade_level_completed
                                }
                            />
                            <InfoRow
                                label="Last School Year Completed"
                                value={
                                    enrollment.academic_history
                                        ?.last_school_year_completed
                                }
                            />
                            <InfoRow
                                label="Previous School Name"
                                value={
                                    enrollment.academic_history
                                        ?.previous_school_name
                                }
                            />
                            <InfoRow
                                label="Previous School ID"
                                value={
                                    enrollment.academic_history
                                        ?.previous_school_id
                                }
                            />
                            <InfoRow
                                label="Previous School Address"
                                value={
                                    enrollment.academic_history
                                        ?.previous_school_address
                                }
                            />
                        </div>

                        {/* Vital info */}
                        <div className="rounded-2xl border border-[#1F2A24]/10 bg-white p-5 md:col-span-2">
                            <h2 className="mb-2 text-xs font-semibold tracking-[0.1em] text-[#2F6F4E] uppercase">
                                Vital Information
                            </h2>
                            <InfoRow
                                label="Special Health Problems"
                                value={
                                    enrollment.vital_information
                                        ?.special_health_problems
                                }
                            />
                            <InfoRow
                                label="History Particulars"
                                value={
                                    enrollment.vital_information
                                        ?.history_particulars
                                }
                            />
                        </div>

                        {/* Billing */}
                        <div className="rounded-2xl border border-[#1F2A24]/10 bg-white p-5">
                            <h2 className="mb-2 text-xs font-semibold tracking-[0.1em] text-[#2F6F4E] uppercase">
                                Billing
                            </h2>
                            <InfoRow
                                label="Payment Option"
                                value={
                                    enrollment.billing_contract?.payment_option
                                }
                            />
                        </div>

                        {/* Document verification checklist */}
                        <div
                            id="document-verification"
                            className="scroll-mt-4 rounded-2xl border border-[#1F2A24]/10 bg-white p-5"
                        >
                            <div className="mb-2 flex items-center justify-between">
                                <h2 className="text-xs font-semibold tracking-[0.1em] text-[#2F6F4E] uppercase">
                                    Document Verification
                                </h2>
                                {missingDocuments.length > 0 && (
                                    <span className="rounded-full bg-[#E8A33D]/15 px-2.5 py-0.5 text-[10px] font-semibold text-[#a4670f]">
                                        {missingDocuments.length} missing
                                    </span>
                                )}
                            </div>

                            {missingDocuments.length > 0 &&
                                !enrollment.enrollee_user_id && (
                                    <p className="mb-3 text-xs text-[#1F2A24]/65">
                                        No linked student portal account —
                                        reminders can't be sent for this
                                        application.
                                    </p>
                                )}

                            {DOCUMENTS.map((doc) => (
                                <DocumentRow
                                    key={doc.verifiedKey}
                                    enrollmentId={enrollment.id}
                                    doc={doc}
                                    verification={verification}
                                    hasEnrollee={!!enrollment.enrollee_user_id}
                                    onToggleVerification={toggleVerification}
                                />
                            ))}
                            <PaymentsSection enrollment={enrollment} />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
