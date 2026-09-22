import { Head, Link, router, usePage, useForm } from '@inertiajs/react';
import { useState } from 'react';

function InfoRow({ label, value }) {
    return (
        <div className="flex justify-between border-b border-[#1F2A24]/10 py-2 text-sm">
            <span className="text-[#1F2A24]/60">{label}</span>
            <span className="font-medium text-[#1F2A24]">{value || '—'}</span>
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

function formatCurrency(value) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
    }).format(value);
}

function PaymentsSection({ enrollment }) {
    const [payingInstallmentId, setPayingInstallmentId] = useState(null);
    const { data, setData, post, processing, errors, reset } = useForm({
        installment_id: '',
        amount: '',
    });

    const installments = enrollment.billing_contract?.installments ?? [];

    const totalDue = installments.reduce(
        (sum, i) => sum + Number(i.amount_due),
        0,
    );
    const totalPaid = installments.reduce(
        (sum, i) =>
            sum +
            i.payments
                .filter((p) => p.status === 'COMPLETED')
                .reduce((s, p) => s + Number(p.amount), 0),
        0,
    );

    const openPayForm = (installment) => {
        setPayingInstallmentId(installment.id);
        setData({
            installment_id: installment.id,
            amount: (
                Number(installment.amount_due) - installmentPaid(installment)
            ).toFixed(2),
        });
    };

    const installmentPaid = (installment) =>
        installment.payments
            .filter((p) => p.status === 'COMPLETED')
            .reduce((s, p) => s + Number(p.amount), 0);

    const submitCashPayment = (e) => {
        e.preventDefault();
        post(route('admin.enrollments.payments.cash', enrollment.id), {
            preserveScroll: true,
            onSuccess: () => {
                setPayingInstallmentId(null);
                reset();
            },
        });
    };

    return (
        <div className="mt-6 border-t border-[#1F2A24]/10 pt-4">
            <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xs font-semibold tracking-[0.1em] text-[#2F6F4E] uppercase">
                    Payments
                </h2>
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
            </div>

            <div className="divide-y divide-[#1F2A24]/10">
                {installments.map((installment) => {
                    const paid = installmentPaid(installment);
                    const remaining = Number(installment.amount_due) - paid;

                    return (
                        <div key={installment.id} className="py-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-sm font-medium text-[#1F2A24]">
                                        Installment #
                                        {installment.installment_number}
                                    </span>
                                    <span className="ml-2 text-xs text-[#1F2A24]/60">
                                        Due {installment.due_date}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-[#1F2A24]/70">
                                        {formatCurrency(installment.amount_due)}
                                    </span>
                                    <span
                                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${INSTALLMENT_STATUS_STYLES[installment.status]}`}
                                    >
                                        {installment.status}
                                    </span>
                                    {installment.status !== 'PAID' && (
                                        <button
                                            onClick={() =>
                                                openPayForm(installment)
                                            }
                                            className="text-xs font-medium text-[#2F6F4E] hover:underline"
                                        >
                                            Record Cash Payment
                                        </button>
                                    )}
                                </div>
                            </div>

                            {payingInstallmentId === installment.id && (
                                <form
                                    onSubmit={submitCashPayment}
                                    className="mt-2 flex items-center gap-2 rounded-lg bg-[#2F6F4E]/5 p-3"
                                >
                                    <span className="text-xs text-[#1F2A24]/60">
                                        Amount:
                                    </span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.amount}
                                        onChange={(e) =>
                                            setData('amount', e.target.value)
                                        }
                                        className="w-32 rounded-lg border border-[#1F2A24]/15 bg-white px-2 py-1 text-sm text-[#1F2A24] focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none"
                                    />
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="rounded-full bg-[#2F6F4E] px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-[#25573E] disabled:opacity-50"
                                    >
                                        Confirm
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setPayingInstallmentId(null)
                                        }
                                        className="text-xs text-[#1F2A24]/60 hover:underline"
                                    >
                                        Cancel
                                    </button>
                                    {errors.amount && (
                                        <span className="text-xs text-red-600">
                                            {errors.amount}
                                        </span>
                                    )}
                                </form>
                            )}

                            {paid > 0 && installment.status !== 'PAID' && (
                                <p className="mt-1 text-xs text-[#1F2A24]/60">
                                    {formatCurrency(paid)} paid so far,{' '}
                                    {formatCurrency(remaining)} remaining
                                </p>
                            )}
                        </div>
                    );
                })}

                {installments.length === 0 && (
                    <p className="py-3 text-sm text-[#1F2A24]/40">
                        No installment schedule found.
                    </p>
                )}
            </div>
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
                        className="shrink-0 text-xs font-medium text-[#2F6F4E] hover:underline"
                    >
                        {open ? 'Cancel' : 'Remind'}
                    </button>
                )}
            </div>

            {verification?.[doc.pathKey] ? (
                <a
                    href={`/storage/${verification[doc.pathKey]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-6 inline-block text-xs font-medium text-[#2F6F4E] hover:underline"
                >
                    View uploaded file →
                </a>
            ) : (
                <p className="ml-6 text-xs text-[#1F2A24]/40">
                    No file uploaded yet
                </p>
            )}

            {open && (
                <form
                    onSubmit={submit}
                    className="mt-2 space-y-2 rounded-lg bg-[#E8A33D]/10 p-3"
                >
                    <select
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
                            className="text-[11px] font-medium text-[#2F6F4E] hover:underline"
                        >
                            + Add a note
                        </button>
                    )}

                    <div className="flex items-center gap-2">
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-full bg-[#E8A33D] px-3 py-1 text-xs font-semibold text-[#1F2A24] transition-colors hover:bg-[#d6922e] disabled:opacity-50"
                        >
                            Send
                        </button>
                        {(errors.reason || errors.note || errors.reminder) && (
                            <span className="text-xs text-red-600">
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

export default function Show({ enrollment }) {
    const { props } = usePage();
    const flashSuccess = props.flash?.success;

    const student = enrollment.student;
    const verification = enrollment.office_verification;
    const missingDocuments = DOCUMENTS.filter(
        (doc) => !verification?.[doc.pathKey],
    );

    const changeStatus = (newStatus) => {
        if (!confirm(`Set status to ${newStatus}?`)) return;
        router.patch(route('admin.enrollments.updateStatus', enrollment.id), {
            enrollment_status: newStatus,
        });
    };

    const toggleVerification = (field, currentValue) => {
        router.patch(
            route('admin.enrollments.updateVerification', enrollment.id),
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

            <div className="bg-[#FBF8F2] px-4 py-8">
                <div className="mx-auto max-w-6xl">
                    <Link
                        href={route('admin.students.index')}
                        className="mb-4 inline-block text-sm font-medium text-[#2F6F4E] hover:underline"
                    >
                        ← Back to students
                    </Link>

                    {flashSuccess && (
                        <div className="mb-4 rounded-xl border border-[#2F6F4E]/25 bg-[#2F6F4E]/5 px-4 py-3 text-sm text-[#2F6F4E]">
                            {flashSuccess}
                        </div>
                    )}

                    <div className="mb-4 flex items-center justify-between">
                        <h1 className="font-serif text-2xl font-semibold text-[#1F2A24]">
                            {student.last_name}, {student.first_name}{' '}
                            {student.middle_name}
                        </h1>
                        <span
                            className={`rounded-full px-3 py-1 text-sm font-medium ${STATUS_STYLES[enrollment.enrollment_status]}`}
                        >
                            {enrollment.enrollment_status}
                        </span>
                    </div>

                    {/* Approve/Reject actions */}
                    <div className="mb-6 flex gap-3 rounded-2xl border border-[#1F2A24]/10 bg-white p-4">
                        <button
                            onClick={() => changeStatus('APPROVED')}
                            disabled={
                                enrollment.enrollment_status === 'APPROVED'
                            }
                            className="rounded-full bg-[#2F6F4E] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#25573E] disabled:opacity-40"
                        >
                            Approve
                        </button>
                        <button
                            onClick={() => changeStatus('REJECTED')}
                            disabled={
                                enrollment.enrollment_status === 'REJECTED'
                            }
                            className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-40"
                        >
                            Reject
                        </button>
                        <button
                            onClick={() => changeStatus('PENDING')}
                            disabled={
                                enrollment.enrollment_status === 'PENDING'
                            }
                            className="rounded-full border border-[#1F2A24]/15 bg-white px-4 py-2 text-sm font-semibold text-[#1F2A24]/70 transition-colors hover:bg-[#1F2A24]/5 disabled:opacity-40"
                        >
                            Reset to Pending
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                                value={student.parent_profile?.father_mobile_no}
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
                                value={student.parent_profile?.mother_mobile_no}
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
                        <div className="rounded-2xl border border-[#1F2A24]/10 bg-white p-5">
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
                                    <p className="mb-3 text-xs text-[#1F2A24]/40">
                                        No linked parent portal account —
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
