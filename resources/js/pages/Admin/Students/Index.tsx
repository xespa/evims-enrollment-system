import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AssignLrnForm from '@/components/assign-lrn-form';
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

function countMissingDocuments(enrollment) {
    const verification = enrollment?.office_verification;
    return DOCUMENT_PATH_KEYS.filter((key) => !verification?.[key]).length;
}

const PAYMENT_STATUS = {
    UNPAID: { label: 'Unpaid', className: 'bg-[#1F2A24]/5 text-[#1F2A24]/70' },
    PARTIALLY_PAID: {
        label: 'Partially paid',
        className: 'bg-[#E8A33D]/15 text-[#a4670f]',
    },
    PAID: { label: 'Fully paid', className: 'bg-green-100 text-green-800' },
};

const SEX_OPTIONS = [
    { value: 'MALE', label: 'Male' },
    { value: 'FEMALE', label: 'Female' },
];

const STATUS_OPTIONS = [
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'CANCELLED', label: 'Cancelled' },
];

const STUDENT_TYPE_OPTIONS = [
    { value: 'NO_LRN', label: 'No LRN' },
    { value: 'WITH_LRN', label: 'With LRN' },
    { value: 'RETURNEE', label: 'Returnee' },
];

/** The dropdown filters, in the order they're shown. */
const SELECT_FILTER_KEYS = [
    'school_year',
    'grade_level_id',
    'sex',
    'status',
    'student_type',
];

const SELECT_CLASS =
    'min-h-10 rounded-lg border border-[#1F2A24]/15 bg-white px-3 py-2 text-sm text-[#1F2A24] focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none';

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

type ApplicationStatus = keyof typeof STATUS_STYLES;

/** The fields of a listed application that the card and badges read. */
type ApplicationRow = {
    id: number;
    school_year: string;
    enrollment_status: ApplicationStatus;
    cancelled_at: string | null;
    parent_email_verified: boolean;
    grade_level: { name: string } | null;
    student: {
        id: number;
        first_name: string;
        last_name: string;
        lrn: string | null;
    };
};

function ApplicationStatusBadge({
    enrollment,
}: {
    enrollment: Pick<ApplicationRow, 'cancelled_at' | 'enrollment_status'>;
}) {
    if (enrollment.cancelled_at) {
        return (
            <span
                className="inline-block rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium whitespace-nowrap text-gray-600"
                title="The parent cancelled this application."
            >
                CANCELLED
            </span>
        );
    }

    return (
        <span
            className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${STATUS_STYLES[enrollment.enrollment_status]}`}
        >
            {enrollment.enrollment_status}
        </span>
    );
}

function DocumentsBadge({ missingCount }: { missingCount: number }) {
    return missingCount > 0 ? (
        <span className="inline-block rounded-full bg-[#E8A33D]/15 px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-[#a4670f]">
            {missingCount} missing
        </span>
    ) : (
        <span className="inline-block rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium whitespace-nowrap text-green-800">
            Complete
        </span>
    );
}

function EmailNotVerifiedBadge() {
    return (
        <span
            className="mt-1 block w-fit rounded-full bg-[#E8A33D]/15 px-2 py-0.5 text-xs font-medium text-[#a4670f]"
            title="The student portal account's email address hasn't been confirmed yet."
        >
            Email not verified
        </span>
    );
}

/** One application as a card, standing in for a table row on phones. */
function ApplicationCard({
    enrollment,
    onRecordPayment,
}: {
    enrollment: ApplicationRow;
    onRecordPayment: () => void;
}) {
    const student = enrollment.student;

    return (
        <li className="rounded-2xl border border-[#1F2A24]/10 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="font-medium break-words text-[#1F2A24]">
                        {student.last_name}, {student.first_name}
                    </p>
                    {!enrollment.parent_email_verified && (
                        <EmailNotVerifiedBadge />
                    )}
                </div>
                <ApplicationStatusBadge enrollment={enrollment} />
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                    <dt className="text-xs text-[#1F2A24]/55">Grade Level</dt>
                    <dd className="mt-0.5 text-[#1F2A24]/80">
                        {enrollment.grade_level?.name || '—'}
                    </dd>
                </div>
                <div>
                    <dt className="text-xs text-[#1F2A24]/55">School Year</dt>
                    <dd className="mt-0.5 text-[#1F2A24]/80">
                        {enrollment.school_year}
                    </dd>
                </div>
                <div>
                    <dt className="text-xs text-[#1F2A24]/55">Documents</dt>
                    <dd className="mt-1">
                        <DocumentsBadge
                            missingCount={countMissingDocuments(enrollment)}
                        />
                    </dd>
                </div>
                {/* Full width when empty, so the Assign LRN form has room. */}
                <div className={student.lrn ? '' : 'col-span-2'}>
                    <dt className="text-xs text-[#1F2A24]/55">LRN</dt>
                    <dd className="mt-0.5 text-[#1F2A24]/80 tabular-nums">
                        {student.lrn || (
                            <AssignLrnForm studentId={student.id} />
                        )}
                    </dd>
                </div>
                <div className="col-span-2 border-t border-[#1F2A24]/10 pt-3">
                    <dt className="text-xs text-[#1F2A24]/55">Payment</dt>
                    <dd className="mt-1">
                        <PaymentCell
                            enrollment={enrollment}
                            onRecord={onRecordPayment}
                        />
                    </dd>
                </div>
            </dl>

            <Link
                href={route('admin.enrollments.show', enrollment.id)}
                className="mt-4 flex min-h-11 items-center justify-center rounded-full border border-[#2F6F4E]/30 text-sm font-semibold text-[#2F6F4E] transition-colors hover:bg-[#2F6F4E]/5"
            >
                View application
            </Link>
        </li>
    );
}

export default function Index({
    applications,
    gradeLevels,
    schoolYears,
    filters,
}) {
    const { props } = usePage();
    const flashSuccess = props.flash?.success;

    const [search, setSearch] = useState(filters.search ?? '');
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

    const [selected, setSelected] = useState(() =>
        Object.fromEntries(
            SELECT_FILTER_KEYS.map((key) => [key, filters[key] ?? '']),
        ),
    );

    const selectOptions = {
        school_year: {
            label: 'school year',
            allLabel: 'All School Years',
            options: schoolYears.map((year) => ({ value: year, label: year })),
        },
        grade_level_id: {
            label: 'grade level',
            allLabel: 'All Grade Levels',
            options: gradeLevels.map((g) => ({
                value: String(g.id),
                label: g.name,
            })),
        },
        sex: { label: 'sex', allLabel: 'All Sex', options: SEX_OPTIONS },
        status: {
            label: 'status',
            allLabel: 'All Statuses',
            options: STATUS_OPTIONS,
        },
        student_type: {
            label: 'student type',
            allLabel: 'All Student Types',
            options: STUDENT_TYPE_OPTIONS,
        },
    };

    const applyFilters = (overrides = {}) => {
        router.get(
            route('admin.students.index'),
            {
                search,
                ...selected,
                archived: filters.archived ? 1 : undefined,
                ...overrides,
            },
            { preserveState: true, replace: true },
        );
    };

    const changeFilter = (key, value) => {
        setSelected((current) => ({ ...current, [key]: value }));
        applyFilters({ [key]: value });
    };

    // "All school years" is an explicit choice (an empty school_year), so
    // clearing goes back to that rather than to the default year.
    const hasActiveFilters =
        search !== '' || SELECT_FILTER_KEYS.some((key) => selected[key] !== '');

    const clearFilters = () => {
        const cleared = Object.fromEntries(
            SELECT_FILTER_KEYS.map((key) => [key, '']),
        );

        setSearch('');
        setSelected(cleared);
        applyFilters({ search: '', ...cleared });
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
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                        <h1 className="font-serif text-2xl font-semibold text-[#1F2A24]">
                            Students
                        </h1>
                        <div
                            role="group"
                            aria-label="Show active or archived applications"
                            className="inline-flex rounded-full border border-[#1F2A24]/15 bg-white p-1"
                        >
                            {[
                                { label: 'Active', archived: false },
                                { label: 'Archived', archived: true },
                            ].map((option) => (
                                <button
                                    key={option.label}
                                    type="button"
                                    aria-pressed={
                                        filters.archived === option.archived
                                    }
                                    onClick={() =>
                                        applyFilters({
                                            archived: option.archived
                                                ? 1
                                                : undefined,
                                        })
                                    }
                                    className="min-h-9 rounded-full px-4 text-sm font-semibold text-[#1F2A24]/70 transition-colors hover:text-[#1F2A24] aria-pressed:bg-[#2F6F4E] aria-pressed:text-white"
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
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
                            className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap"
                        >
                            <input
                                type="search"
                                aria-label="Search students by name or LRN"
                                placeholder="Search by name or LRN..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="col-span-2 min-h-11 min-w-0 flex-1 rounded-lg border border-[#1F2A24]/15 bg-white px-3 py-2 text-sm text-[#1F2A24] focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none sm:min-h-10 sm:min-w-[200px]"
                            />

                            {SELECT_FILTER_KEYS.map((key) => (
                                <select
                                    key={key}
                                    aria-label={`Filter by ${selectOptions[key].label}`}
                                    value={selected[key]}
                                    onChange={(e) =>
                                        changeFilter(key, e.target.value)
                                    }
                                    className={`${SELECT_CLASS} w-full min-w-0 last-of-type:col-span-2 sm:w-auto ${
                                        selected[key] !== ''
                                            ? 'border-[#2F6F4E]/50 bg-[#2F6F4E]/5'
                                            : ''
                                    }`}
                                >
                                    <option value="">
                                        {selectOptions[key].allLabel}
                                    </option>
                                    {selectOptions[key].options.map(
                                        (option) => (
                                            <option
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </option>
                                        ),
                                    )}
                                </select>
                            ))}

                            <button
                                type="submit"
                                className="col-span-2 min-h-11 rounded-full bg-[#2F6F4E] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#25573E] sm:min-h-10"
                            >
                                Search
                            </button>
                        </form>

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-[#1F2A24]/65">
                            <p aria-live="polite">
                                {applications.total}{' '}
                                {applications.total === 1
                                    ? 'application'
                                    : 'applications'}{' '}
                                found
                            </p>
                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="min-h-9 rounded-full px-3 font-semibold text-[#2F6F4E] hover:bg-[#2F6F4E]/5"
                                >
                                    Clear filters
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Cards (phones) */}
                    <ul className="space-y-3 md:hidden">
                        {applications.data.map((enrollment) => (
                            <ApplicationCard
                                key={enrollment.id}
                                enrollment={enrollment}
                                onRecordPayment={() =>
                                    openRecordPayment(enrollment)
                                }
                            />
                        ))}

                        {applications.data.length === 0 && (
                            <li className="rounded-2xl border border-[#1F2A24]/10 bg-white px-4 py-8 text-center text-sm text-[#1F2A24]/65">
                                No applications found.
                            </li>
                        )}
                    </ul>

                    {/* Table (tablets and up) */}
                    <div className="hidden overflow-x-auto rounded-2xl border border-[#1F2A24]/10 bg-white md:block">
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
                                                    <EmailNotVerifiedBadge />
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-[#1F2A24]/70">
                                                {student.lrn || (
                                                    <AssignLrnForm
                                                        studentId={student.id}
                                                    />
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-[#1F2A24]/70">
                                                {enrollment.grade_level?.name ||
                                                    '—'}
                                            </td>
                                            <td className="px-4 py-3 text-[#1F2A24]/70">
                                                {enrollment.school_year}
                                            </td>
                                            <td className="px-4 py-3">
                                                <ApplicationStatusBadge
                                                    enrollment={enrollment}
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <DocumentsBadge
                                                    missingCount={missingCount}
                                                />
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
                                className={`inline-flex min-h-10 min-w-10 items-center justify-center rounded-full border px-3 py-1.5 text-sm ${
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
                    unpaidInstallments={
                        recordingFor.payment.unpaid_installments
                    }
                    open={isRecording}
                    onOpenChange={setIsRecording}
                />
            )}
        </>
    );
}
