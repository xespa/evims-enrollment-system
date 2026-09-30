import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import RecordCounterPaymentDialog from '@/components/record-counter-payment-dialog';

const STATUS_STYLES = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
};

const DOCUMENT_PATH_KEYS = [
    'form_138_path',
    'birth_certificate_path',
    'good_moral_path',
];

const LRN_PREFIX = '452501';

function countMissingDocuments(enrollment) {
    const verification = enrollment?.office_verification;
    return DOCUMENT_PATH_KEYS.filter((key) => !verification?.[key]).length;
}

function generateLrn() {
    let suffix = '';
    for (let i = 0; i < 8; i++) {
        suffix += Math.floor(Math.random() * 10);
    }
    return `${LRN_PREFIX}${suffix}`;
}

function AssignLrnCell({ studentId }) {
    const [open, setOpen] = useState(false);
    const { data, setData, patch, processing, errors, reset } = useForm({
        lrn: '',
    });

    const toggleOpen = () => {
        setOpen((o) => !o);
        reset();
    };

    const submit = (e) => {
        e.preventDefault();
        patch(route('admin.students.lrn.update', studentId), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setOpen(false);
                reset();
            },
        });
    };

    if (!open) {
        return (
            <button
                type="button"
                onClick={toggleOpen}
                className="min-h-9 rounded-full px-2 text-xs font-semibold text-[#2F6F4E] hover:bg-[#2F6F4E]/5 hover:underline"
            >
                Assign LRN
            </button>
        );
    }

    return (
        <form onSubmit={submit} className="min-w-[160px] space-y-1.5">
            <input
                type="text"
                inputMode="numeric"
                maxLength={14}
                autoFocus
                aria-label="Learner Reference Number (14 digits)"
                aria-invalid={errors.lrn ? true : undefined}
                placeholder="452501XXXXXXXX"
                value={data.lrn}
                onChange={(e) =>
                    setData(
                        'lrn',
                        e.target.value.replace(/\D/g, '').slice(0, 14),
                    )
                }
                className="min-h-9 w-full rounded-lg border border-[#1F2A24]/15 bg-white px-2 py-1 text-xs text-[#1F2A24] tabular-nums focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none"
            />
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => setData('lrn', generateLrn())}
                    className="min-h-8 rounded-full px-1.5 text-xs font-medium text-[#2F6F4E] hover:underline"
                >
                    Generate
                </button>
                <button
                    type="submit"
                    disabled={processing}
                    className="min-h-8 rounded-full bg-[#2F6F4E] px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-[#25573E] disabled:cursor-wait disabled:opacity-50"
                >
                    {processing ? 'Saving…' : 'Save'}
                </button>
                <button
                    type="button"
                    onClick={toggleOpen}
                    className="min-h-8 rounded-full px-1.5 text-xs text-[#1F2A24]/70 hover:text-[#1F2A24]"
                >
                    Cancel
                </button>
            </div>
            {errors.lrn && (
                <p role="alert" className="text-xs text-[#C6473B]">
                    {errors.lrn}
                </p>
            )}
        </form>
    );
}

const PAYMENT_STATUS = {
    UNPAID: { label: 'Unpaid', className: 'bg-[#1F2A24]/5 text-[#1F2A24]/70' },
    PARTIALLY_PAID: {
        label: 'Partially paid',
        className: 'bg-[#E8A33D]/15 text-[#a4670f]',
    },
    PAID: { label: 'Fully paid', className: 'bg-green-100 text-green-800' },
};

function formatPeso(value) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
    }).format(value);
}

/**
 * Where the application stands on payment, with a quick way to record a
 * counter payment once it's approved.
 */
function PaymentCell({ enrollment, onRecord }) {
    const payment = enrollment.payment;

    if (!payment) {
        return <span className="text-xs text-[#1F2A24]/50">Not billed</span>;
    }

    const status = PAYMENT_STATUS[payment.status];
    const canRecord =
        enrollment.enrollment_status === 'APPROVED' &&
        !enrollment.cancelled_at &&
        payment.balance > 0;

    return (
        <div className="min-w-[9rem]">
            <span
                className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}
            >
                {status.label}
            </span>
            <p className="mt-1 text-xs text-[#1F2A24]/60 tabular-nums">
                {formatPeso(payment.paid)} of {formatPeso(payment.total)}
                <span className="text-[#1F2A24]/45">
                    {' '}
                    · {payment.channel === 'GCASH' ? 'GCash' : 'Counter'}
                </span>
            </p>
            {canRecord ? (
                <button
                    type="button"
                    onClick={onRecord}
                    className="mt-1 min-h-8 rounded-full px-1.5 text-xs font-semibold text-[#2F6F4E] hover:bg-[#2F6F4E]/5 hover:underline"
                >
                    Record payment
                </button>
            ) : (
                enrollment.enrollment_status !== 'APPROVED' &&
                payment.balance > 0 && (
                    <p className="mt-1 text-xs text-[#1F2A24]/45">
                        Payable once approved
                    </p>
                )
            )}
        </div>
    );
}

export default function Index({ applications, gradeLevels, schoolYears, filters }) {
    const { props } = usePage();
    const flashSuccess = props.flash?.success;

    const [search, setSearch] = useState(filters.search ?? '');
    const [schoolYear, setSchoolYear] = useState(filters.school_year ?? '');
    // The application whose counter payment is being recorded; kept apart
    // from `isRecording` so the dialog doesn't blank out while closing.
    const [recordingFor, setRecordingFor] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordSession, setRecordSession] = useState(0);

    const openRecordPayment = (enrollment) => {
        setRecordingFor(enrollment);
        setRecordSession((n) => n + 1);
        setIsRecording(true);
    };

    const [gradeLevelId, setGradeLevelId] = useState(
        filters.grade_level_id ?? '',
    );

    const applyFilters = (overrides = {}) => {
        router.get(
            route('admin.students.index'),
            {
                search,
                school_year: schoolYear,
                grade_level_id: gradeLevelId,
                ...overrides,
            },
            { preserveState: true, replace: true },
        );
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        applyFilters();
    };

    return (
        <>
            <Head title="Students" />

            <div className="bg-[#FBF8F2] px-4 py-8">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-6 flex items-center justify-between">
                        <h1 className="font-serif text-2xl font-semibold text-[#1F2A24]">
                            Students
                        </h1>
                    </div>

                    {flashSuccess && (
                        <div
                            role="status"
                            className="mb-4 rounded-xl border border-[#2F6F4E]/25 bg-[#2F6F4E]/5 px-4 py-3 text-sm text-[#2F6F4E]"
                        >
                            {flashSuccess}
                        </div>
                    )}

                    {/* Search */}
                    <div className="mb-4 rounded-2xl border border-[#1F2A24]/10 bg-white p-4">
                        <form
                            onSubmit={handleSearchSubmit}
                            role="search"
                            className="flex flex-wrap gap-3"
                        >
                            <input
                                type="search"
                                aria-label="Search students by name or LRN"
                                placeholder="Search by name or LRN..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="min-h-10 min-w-[200px] flex-1 rounded-lg border border-[#1F2A24]/15 bg-white px-3 py-2 text-sm text-[#1F2A24] focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none"
                            />

                            <select
                                aria-label="Filter by school year"
                                value={schoolYear}
                                onChange={(e) => {
                                    setSchoolYear(e.target.value);
                                    applyFilters({
                                        school_year: e.target.value,
                                    });
                                }}
                                className="min-h-10 rounded-lg border border-[#1F2A24]/15 bg-white px-3 py-2 text-sm text-[#1F2A24] focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none"
                            >
                                <option value="">All School Years</option>
                                {schoolYears.map((year) => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>

                            <select
                                aria-label="Filter by grade level"
                                value={gradeLevelId}
                                onChange={(e) => {
                                    setGradeLevelId(e.target.value);
                                    applyFilters({
                                        grade_level_id: e.target.value,
                                    });
                                }}
                                className="min-h-10 rounded-lg border border-[#1F2A24]/15 bg-white px-3 py-2 text-sm text-[#1F2A24] focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none"
                            >
                                <option value="">All Grade Levels</option>
                                {gradeLevels.map((g) => (
                                    <option key={g.id} value={g.id}>
                                        {g.name}
                                    </option>
                                ))}
                            </select>

                            <button
                                type="submit"
                                className="min-h-10 rounded-full bg-[#2F6F4E] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#25573E]"
                            >
                                Search
                            </button>
                        </form>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto rounded-2xl border border-[#1F2A24]/10 bg-white">
                        <table className="min-w-full divide-y divide-[#1F2A24]/10 text-sm">
                            <thead className="bg-[#2F6F4E]/5">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-[#1F2A24]/70">
                                        Student Name
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-[#1F2A24]/70">
                                        LRN
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-[#1F2A24]/70">
                                        Grade Level
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-[#1F2A24]/70">
                                        School Year
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-[#1F2A24]/70">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-[#1F2A24]/70">
                                        Documents
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-[#1F2A24]/70">
                                        Payment
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-[#1F2A24]/70">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#1F2A24]/10">
                                {applications.data.map((enrollment) => {
                                    const student = enrollment.student;
                                    const missingCount =
                                        countMissingDocuments(enrollment);

                                    return (
                                        <tr
                                            key={enrollment.id}
                                            className="hover:bg-[#2F6F4E]/5"
                                        >
                                            <td className="px-4 py-3 text-[#1F2A24]">
                                                {student.last_name},{' '}
                                                {student.first_name}
                                                {!enrollment.parent_email_verified && (
                                                    <span
                                                        className="mt-1 block w-fit rounded-full bg-[#E8A33D]/15 px-2 py-0.5 text-xs font-medium text-[#a4670f]"
                                                        title="The student portal account's email address hasn't been confirmed yet."
                                                    >
                                                        Email not verified
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-[#1F2A24]/70">
                                                {student.lrn || (
                                                    <AssignLrnCell
                                                        studentId={
                                                            student.id
                                                        }
                                                    />
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-[#1F2A24]/70">
                                                {enrollment.grade_level
                                                    ?.name || '—'}
                                            </td>
                                            <td className="px-4 py-3 text-[#1F2A24]/70">
                                                {enrollment.school_year}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[enrollment.enrollment_status]}`}
                                                >
                                                    {
                                                        enrollment.enrollment_status
                                                    }
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {missingCount > 0 ? (
                                                    <span className="rounded-full bg-[#E8A33D]/15 px-2.5 py-1 text-xs font-semibold text-[#a4670f]">
                                                        {missingCount} missing
                                                    </span>
                                                ) : (
                                                    <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
                                                        Complete
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <PaymentCell
                                                    enrollment={enrollment}
                                                    onRecord={() =>
                                                        openRecordPayment(
                                                            enrollment,
                                                        )
                                                    }
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={route(
                                                        'admin.enrollments.show',
                                                        enrollment.id,
                                                    )}
                                                    className="font-medium text-[#2F6F4E] hover:underline"
                                                >
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {applications.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="px-4 py-8 text-center text-[#1F2A24]/65"
                                        >
                                            No applications found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="mt-4 flex flex-wrap gap-2">
                        {applications.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url ?? '#'}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                preserveScroll
                                className={`rounded-full border px-3 py-1.5 text-sm ${
                                    link.active
                                        ? 'border-[#2F6F4E] bg-[#2F6F4E] text-white'
                                        : 'border-[#1F2A24]/10 bg-white text-[#1F2A24]/70 hover:bg-[#1F2A24]/5'
                                } ${!link.url ? 'pointer-events-none opacity-40' : ''}`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {recordingFor?.payment && (
                <RecordCounterPaymentDialog
                    key={recordSession}
                    enrollmentId={recordingFor.id}
                    studentName={`${recordingFor.student.first_name} ${recordingFor.student.last_name}`}
                    unpaidInstallments={recordingFor.payment.unpaid_installments}
                    open={isRecording}
                    onOpenChange={setIsRecording}
                />
            )}
        </>
    );
}
