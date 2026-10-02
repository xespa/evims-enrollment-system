import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import {
    BadgeCheck,
    Camera,
    CheckCircle2,
    Landmark,
    Loader2,
    PartyPopper,
} from 'lucide-react';
import DocumentViewerDialog, {
    isPdfPath,
} from '@/components/document-viewer-dialog';
import { useConfirm } from '@/hooks/use-confirm';

const STATUS_STYLES = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
};

const SESSION_LABELS = {
    MORNING_SESSION: 'Morning Session',
    AFTERNOON_SESSION: 'Afternoon Session',
    SCHOOL_SERVICE: 'School Service',
};

const DOCUMENTS = [
    {
        type: 'form_138',
        label: 'Form 138 (Report Card)',
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

const PAYMENT_STATUS_STYLES = {
    COMPLETED: 'bg-green-100 text-green-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    FAILED: 'bg-red-100 text-red-800',
    VOIDED: 'bg-gray-100 text-gray-600',
};

const METHOD_LABELS = {
    GCASH: 'GCash',
    CASH: 'Cash',
};

const TABS = ['Applications', 'Payments', 'Documents'];

const formatCurrency = (value) =>
    `₱${Number(value).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

const initials = (name = '') =>
    name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');

export default function Dashboard({ enrollments }) {
    const { props } = usePage();
    const enrollee = props.auth?.enrollee;
    const [activeTab, setActiveTab] = useState('Applications');
    const [uploading, setUploading] = useState(false);
    const [confirm, confirmDialog] = useConfirm();

    const cancel = async (enrollment) => {
        const confirmed = await confirm({
            title: 'Cancel this application?',
            description: `The application for ${enrollment.student.first_name} ${enrollment.student.last_name} (${enrollment.grade_level.name}, SY ${enrollment.school_year}) will be withdrawn. You can submit a new one later.`,
            confirmLabel: 'Cancel Application',
            cancelLabel: 'Keep Application',
            destructive: true,
        });
        if (!confirmed) return;
        const enrollmentId = enrollment.id;
        router.post(
            route('portal.enrollments.cancel', enrollmentId),
            {},
            { preserveScroll: true },
        );
    };

    const logout = () => {
        router.post(route('portal.logout'));
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        router.post(
            route('portal.profile.photo.update'),
            { photo: file },
            {
                forceFormData: true,
                preserveScroll: true,
                onFinish: () => setUploading(false),
            },
        );
    };

    const [uploadingDoc, setUploadingDoc] = useState(null);
    // Kept apart from `isViewingDocument` so the viewer doesn't blank out while closing.
    const [viewingDocument, setViewingDocument] = useState<{
        title: string;
        path: string;
    } | null>(null);
    const [isViewingDocument, setIsViewingDocument] = useState(false);

    const handleDocumentUpload = (enrollmentId, type) => (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const key = `${enrollmentId}:${type}`;
        setUploadingDoc(key);
        router.post(
            route('portal.enrollments.documents.store', {
                enrollment: enrollmentId,
                type,
            }),
            { file },
            {
                forceFormData: true,
                preserveScroll: true,
                onFinish: () => setUploadingDoc(null),
            },
        );
    };

    const handleTabKeyDown = (event: ReactKeyboardEvent) => {
        const offsets: Record<string, number> = {
            ArrowRight: 1,
            ArrowLeft: -1,
        };
        if (!(event.key in offsets)) return;
        event.preventDefault();
        const nextIndex =
            (TABS.indexOf(activeTab) + offsets[event.key] + TABS.length) %
            TABS.length;
        setActiveTab(TABS[nextIndex]);
        document.getElementById(`portal-tab-${TABS[nextIndex]}`)?.focus();
    };

    // ---- Aggregate "social signal"-style metrics across all enrollments ----
    const activeEnrollments = enrollments.filter((e) => !e.cancelled_at);
    const approvedCount = activeEnrollments.filter(
        (e) => e.enrollment_status === 'APPROVED',
    ).length;
    const outstandingBalance = activeEnrollments.reduce(
        (sum, e) =>
            sum +
            (e.remaining_balance && e.remaining_balance > 0
                ? e.remaining_balance
                : 0),
        0,
    );

    // ---- Flatten every payment, across every enrollment, for the Payments tab ----
    const allTransactions = enrollments
        .flatMap((enrollment) =>
            (enrollment.billing_contract?.installments ?? []).flatMap(
                (installment) =>
                    installment.payments.map((payment) => ({
                        ...payment,
                        installment_number: installment.installment_number,
                        student_name: `${enrollment.student.first_name} ${enrollment.student.last_name}`,
                    })),
            ),
        )
        .sort(
            (a, b) =>
                new Date(b.paid_at ?? b.created_at) -
                new Date(a.paid_at ?? a.created_at),
        );

    return (
        <div className="mx-auto max-w-5xl px-4 pb-16">
            <Head title="My Profile" />
            {confirmDialog}
            {viewingDocument && (
                <DocumentViewerDialog
                    title={viewingDocument.title}
                    url={`/storage/${viewingDocument.path}`}
                    isPdf={isPdfPath(viewingDocument.path)}
                    open={isViewingDocument}
                    onOpenChange={setIsViewingDocument}
                />
            )}

            {/* ---------------- Header banner ---------------- */}
            <div className="-mx-4 mb-6 h-28 bg-gradient-to-r from-[#2F6F4E] to-[#25573E] sm:h-36" />

            {/* ---------------- Identity block ---------------- */}
            <div className="-mt-16 flex flex-col gap-4 sm:-mt-20 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end">
                    <div className="relative h-24 w-24 sm:h-32 sm:w-32">
                        <label
                            htmlFor="profile-photo-input"
                            className="group relative block h-full w-full cursor-pointer overflow-hidden rounded-full border-4 border-[#FBF8F2] shadow-sm focus-within:ring-2 focus-within:ring-[#2F6F4E] focus-within:ring-offset-2"
                        >
                            {enrollee?.profile_photo_url ? (
                                <img
                                    src={enrollee.profile_photo_url}
                                    alt=""
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center bg-[#2F6F4E] text-2xl font-semibold text-white sm:text-3xl">
                                    {initials(enrollee?.name)}
                                </div>
                            )}
                            <span className="sr-only">
                                Change profile photo
                            </span>
                            <div
                                aria-hidden="true"
                                className="absolute inset-0 hidden items-center justify-center bg-black/0 text-transparent transition-colors group-hover:bg-black/40 group-hover:text-white sm:flex"
                            >
                                <Camera className="h-6 w-6" />
                            </div>
                            {uploading && (
                                <div
                                    role="status"
                                    className="absolute inset-0 flex items-center justify-center bg-black/50 text-white"
                                >
                                    <Loader2
                                        className="h-6 w-6 animate-spin"
                                        aria-hidden="true"
                                    />
                                    <span className="sr-only">
                                        Uploading photo…
                                    </span>
                                </div>
                            )}
                        </label>
                        <input
                            id="profile-photo-input"
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoChange}
                            disabled={uploading}
                            className="sr-only"
                        />
                        {/* Always-visible camera badge: hover overlays
                            never appear on touch screens. */}
                        <span
                            aria-hidden="true"
                            className="pointer-events-none absolute right-0.5 bottom-0.5 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#FBF8F2] bg-[#2F6F4E] text-white shadow-sm sm:right-1.5 sm:bottom-1.5"
                        >
                            <Camera className="h-4 w-4" />
                        </span>
                    </div>
                    <div className="pb-1 text-center sm:text-left">
                        <div className="flex items-center justify-center gap-2 sm:justify-start">
                            <h1 className="font-serif text-xl font-semibold text-[#1F2A24] sm:text-2xl">
                                {enrollee?.name}
                            </h1>
                            {enrollee?.email_verified_at && (
                                <span
                                    title="Verified email"
                                    className="text-[#2F6F4E]"
                                >
                                    <BadgeCheck
                                        className="h-5 w-5"
                                        aria-hidden="true"
                                    />
                                    <span className="sr-only">
                                        Verified email
                                    </span>
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-[#1F2A24]/70">
                            {enrollee?.email}
                        </p>
                        <p className="text-sm text-[#1F2A24]/65">
                            Student Account
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap justify-center gap-2 sm:justify-end">
                    <Link
                        href={route('admission.create')}
                        className="inline-flex min-h-11 items-center rounded-full bg-[#2F6F4E] px-5 py-2 text-sm font-semibold text-[#FBF8F2] shadow-sm transition-colors hover:bg-[#25573E]"
                    >
                        + Apply for New Enrollment
                    </Link>
                    <button
                        type="button"
                        onClick={logout}
                        className="min-h-11 rounded-full border border-[#1F2A24]/15 bg-white px-5 py-2 text-sm font-semibold text-[#1F2A24]/70 shadow-sm transition-colors hover:bg-[#1F2A24]/5"
                    >
                        Log Out
                    </button>
                </div>
            </div>

            {props.flash?.success && (
                <div
                    role="status"
                    className="mt-6 rounded-xl border border-[#2F6F4E]/25 bg-[#2F6F4E]/5 px-4 py-3 text-sm text-[#2F6F4E]"
                >
                    {props.flash.success}
                </div>
            )}

            {/* ---------------- Key metrics ("social signals") ---------------- */}
            <div className="mt-6 grid grid-cols-3 divide-x divide-[#1F2A24]/10 rounded-lg border border-[#1F2A24]/10 bg-white shadow-sm">
                <div className="px-2 py-4 text-center sm:px-4">
                    <p className="text-lg font-semibold text-[#1F2A24] tabular-nums sm:text-xl">
                        {activeEnrollments.length}
                    </p>
                    <p className="text-xs text-[#1F2A24]/65">Applications</p>
                </div>
                <div className="px-2 py-4 text-center sm:px-4">
                    <p className="text-lg font-semibold text-[#1F2A24] tabular-nums sm:text-xl">
                        {approvedCount}
                    </p>
                    <p className="text-xs text-[#1F2A24]/65">Approved</p>
                </div>
                <div className="px-2 py-4 text-center sm:px-4">
                    <p
                        className={`text-base font-semibold break-words tabular-nums sm:text-xl ${outstandingBalance > 0 ? 'text-[#C6473B]' : 'text-[#1F2A24]'}`}
                    >
                        {formatCurrency(outstandingBalance)}
                    </p>
                    <p className="text-xs text-[#1F2A24]/65">
                        Outstanding Balance
                    </p>
                </div>
            </div>

            {/* ---------------- Tabs ---------------- */}
            <div className="mt-8 border-b border-[#1F2A24]/10">
                <div
                    role="tablist"
                    aria-label="Account sections"
                    className="-mb-px flex gap-6"
                >
                    {TABS.map((tab) => (
                        <button
                            key={tab}
                            id={`portal-tab-${tab}`}
                            type="button"
                            role="tab"
                            aria-selected={activeTab === tab}
                            aria-controls="portal-tabpanel"
                            tabIndex={activeTab === tab ? 0 : -1}
                            onClick={() => setActiveTab(tab)}
                            onKeyDown={handleTabKeyDown}
                            className={`min-h-11 border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
                                activeTab === tab
                                    ? 'border-[#2F6F4E] text-[#2F6F4E]'
                                    : 'border-transparent text-[#1F2A24]/65 hover:text-[#1F2A24]/80'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* ---------------- Tab content ---------------- */}
            <div
                id="portal-tabpanel"
                role="tabpanel"
                aria-labelledby={`portal-tab-${activeTab}`}
                className="mt-6"
            >
                {activeTab === 'Applications' && (
                    <div className="space-y-4">
                        {enrollments.length === 0 && (
                            <div className="rounded-lg border border-dashed border-[#1F2A24]/20 bg-white p-8 text-center text-sm text-[#1F2A24]/65">
                                You don't have any applications yet.
                            </div>
                        )}

                        {enrollments.map((enrollment) => {
                            const isApproved =
                                enrollment.enrollment_status === 'APPROVED';
                            const hasBalance =
                                enrollment.remaining_balance !== null;
                            const isFullyPaid =
                                hasBalance && enrollment.remaining_balance <= 0;

                            return (
                                <div
                                    key={enrollment.id}
                                    className="rounded-lg border border-[#1F2A24]/10 bg-white p-5 shadow-sm"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="font-medium text-[#1F2A24]">
                                                {enrollment.student.first_name}{' '}
                                                {enrollment.student.last_name}
                                            </p>
                                            <p className="text-sm text-[#1F2A24]/70">
                                                {enrollment.grade_level.name} ·
                                                SY {enrollment.school_year}
                                            </p>
                                        </div>
                                        {enrollment.cancelled_at ? (
                                            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                                                CANCELLED
                                            </span>
                                        ) : (
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[enrollment.enrollment_status]}`}
                                            >
                                                {enrollment.enrollment_status}
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-4 grid grid-cols-1 gap-3 border-t border-[#1F2A24]/10 pt-4 sm:grid-cols-3">
                                        <div>
                                            <p className="text-xs text-[#1F2A24]/65">
                                                Grade Level
                                            </p>
                                            <p className="text-sm text-[#1F2A24]">
                                                {enrollment.grade_level.name}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-[#1F2A24]/65">
                                                Session Time Preference
                                            </p>
                                            <p className="text-sm text-[#1F2A24]">
                                                {SESSION_LABELS[
                                                    enrollment
                                                        .session_time_preference
                                                ] ??
                                                    enrollment.session_time_preference}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-[#1F2A24]/65">
                                                LRN
                                            </p>
                                            <p className="text-sm text-[#1F2A24]">
                                                {enrollment.student.lrn ?? (
                                                    <span className="text-[#1F2A24]/65 italic">
                                                        Not yet assigned
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    {enrollment.enrollment_status ===
                                        'REJECTED' &&
                                        !enrollment.cancelled_at &&
                                        (enrollment.rejection_details.length >
                                            0 ||
                                            enrollment.rejection_note) && (
                                            <div className="mt-4 rounded-md border border-[#C6473B]/20 bg-[#C6473B]/5 p-4 text-sm text-[#1F2A24]">
                                                <p className="font-medium text-[#C6473B]">
                                                    Why this application was not
                                                    approved
                                                </p>
                                                <ul className="mt-2 list-disc space-y-1 pl-5">
                                                    {enrollment.rejection_details.map(
                                                        (detail) => (
                                                            <li
                                                                key={
                                                                    detail.label
                                                                }
                                                            >
                                                                <span className="font-medium">
                                                                    {
                                                                        detail.label
                                                                    }
                                                                </span>{' '}
                                                                —{' '}
                                                                {
                                                                    detail.guidance
                                                                }
                                                            </li>
                                                        ),
                                                    )}
                                                </ul>
                                                {enrollment.rejection_note && (
                                                    <p className="mt-2">
                                                        <span className="font-medium">
                                                            Note from the
                                                            school:
                                                        </span>{' '}
                                                        {
                                                            enrollment.rejection_note
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                    <div className="mt-4 border-t border-[#1F2A24]/10 pt-4">
                                        {!isApproved &&
                                            !enrollment.cancelled_at && (
                                                <p className="text-sm text-[#1F2A24]/65">
                                                    Tuition payment will be
                                                    available here once your
                                                    application is approved.
                                                </p>
                                            )}

                                        {isApproved &&
                                            hasBalance &&
                                            !isFullyPaid &&
                                            !enrollment.payment_url && (
                                                <div className="flex gap-3 rounded-md bg-[#2F6F4E]/5 p-4">
                                                    <Landmark
                                                        className="mt-0.5 h-5 w-5 shrink-0 text-[#2F6F4E]"
                                                        aria-hidden="true"
                                                    />
                                                    <div>
                                                        <p className="text-sm font-medium text-[#1F2A24]">
                                                            You're approved!
                                                            Please pay at the
                                                            school cashier.
                                                        </p>
                                                        <p className="text-sm text-[#1F2A24]/70">
                                                            Remaining balance:{' '}
                                                            <span className="font-semibold text-[#2F6F4E]">
                                                                {formatCurrency(
                                                                    enrollment.remaining_balance,
                                                                )}
                                                            </span>{' '}
                                                            of{' '}
                                                            {formatCurrency(
                                                                enrollment.total_billed,
                                                            )}
                                                        </p>
                                                        <p className="mt-1 text-xs text-[#1F2A24]/60">
                                                            Bring reference no.{' '}
                                                            <span className="font-semibold tabular-nums">
                                                                #{enrollment.id}
                                                            </span>
                                                            . Your payment will
                                                            show here once the
                                                            cashier records it.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                        {isApproved &&
                                            hasBalance &&
                                            !isFullyPaid &&
                                            enrollment.payment_url && (
                                                <div className="flex flex-col gap-3 rounded-md bg-[#2F6F4E]/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                                                    <div>
                                                        <p className="flex items-center gap-1.5 text-sm font-medium text-[#1F2A24]">
                                                            <PartyPopper
                                                                className="h-4 w-4 shrink-0 text-[#2F6F4E]"
                                                                aria-hidden="true"
                                                            />
                                                            You're approved! You
                                                            can now pay your
                                                            tuition.
                                                        </p>
                                                        <p className="text-sm text-[#1F2A24]/70">
                                                            Remaining balance:{' '}
                                                            <span className="font-semibold text-[#2F6F4E]">
                                                                {formatCurrency(
                                                                    enrollment.remaining_balance,
                                                                )}
                                                            </span>{' '}
                                                            of{' '}
                                                            {formatCurrency(
                                                                enrollment.total_billed,
                                                            )}
                                                        </p>
                                                    </div>
                                                    <Link
                                                        href={
                                                            enrollment.payment_url
                                                        }
                                                        className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#2F6F4E] px-5 py-2 text-center text-sm font-semibold whitespace-nowrap text-[#FBF8F2] shadow-sm transition-colors hover:bg-[#25573E]"
                                                    >
                                                        Pay Tuition
                                                    </Link>
                                                </div>
                                            )}

                                        {isApproved && isFullyPaid && (
                                            <div className="flex items-center gap-2 rounded-md bg-[#2F6F4E]/5 p-4 text-sm font-medium text-[#2F6F4E]">
                                                <CheckCircle2
                                                    className="h-4 w-4 shrink-0"
                                                    aria-hidden="true"
                                                />
                                                Fully paid — no outstanding
                                                balance.
                                            </div>
                                        )}

                                        {isApproved && !hasBalance && (
                                            <p className="text-sm text-[#1F2A24]/65">
                                                Billing details aren't set up
                                                yet for this enrollment. Please
                                                check back soon.
                                            </p>
                                        )}
                                    </div>

                                    {!enrollment.cancelled_at &&
                                        enrollment.enrollment_status ===
                                            'PENDING' && (
                                            <div className="mt-4 border-t border-[#1F2A24]/10 pt-4 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        cancel(enrollment)
                                                    }
                                                    className="min-h-10 rounded-full px-3 text-sm font-medium text-[#C6473B] transition-colors hover:bg-[#C6473B]/5"
                                                >
                                                    Cancel Application
                                                </button>
                                            </div>
                                        )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {activeTab === 'Payments' && (
                    <div className="rounded-lg border border-[#1F2A24]/10 bg-white p-5 shadow-sm">
                        {allTransactions.length === 0 ? (
                            <p className="py-8 text-center text-sm text-[#1F2A24]/65">
                                No transactions yet.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="text-xs text-[#1F2A24]/65">
                                            <th className="pb-2 font-medium">
                                                Date
                                            </th>
                                            <th className="pb-2 font-medium">
                                                Student
                                            </th>
                                            <th className="pb-2 font-medium">
                                                Installment
                                            </th>
                                            <th className="pb-2 font-medium">
                                                Method
                                            </th>
                                            <th className="pb-2 font-medium">
                                                Amount
                                            </th>
                                            <th className="pb-2 font-medium">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#1F2A24]/5">
                                        {allTransactions.map((payment) => (
                                            <tr key={payment.id}>
                                                <td className="py-2 text-[#1F2A24]/80">
                                                    {payment.paid_at
                                                        ? new Date(
                                                              payment.paid_at,
                                                          ).toLocaleDateString(
                                                              'en-PH',
                                                              {
                                                                  year: 'numeric',
                                                                  month: 'short',
                                                                  day: 'numeric',
                                                              },
                                                          )
                                                        : '—'}
                                                </td>
                                                <td className="py-2 text-[#1F2A24]/80">
                                                    {payment.student_name}
                                                </td>
                                                <td className="py-2 text-[#1F2A24]/80">
                                                    #
                                                    {payment.installment_number}
                                                </td>
                                                <td className="py-2 text-[#1F2A24]/80">
                                                    {METHOD_LABELS[
                                                        payment.method
                                                    ] ?? payment.method}
                                                </td>
                                                <td className="py-2 font-medium text-[#1F2A24]">
                                                    {formatCurrency(
                                                        payment.amount,
                                                    )}
                                                </td>
                                                <td className="py-2">
                                                    <span
                                                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                                            PAYMENT_STATUS_STYLES[
                                                                payment.status
                                                            ] ??
                                                            'bg-gray-100 text-gray-600'
                                                        }`}
                                                    >
                                                        {payment.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'Documents' && (
                    <div className="space-y-4">
                        {enrollments.length === 0 && (
                            <div className="rounded-lg border border-dashed border-[#1F2A24]/20 bg-white p-8 text-center text-sm text-[#1F2A24]/65">
                                No applications to show documents for yet.
                            </div>
                        )}
                        {enrollments.map((enrollment) => {
                            const verification = enrollment.office_verification;
                            const isApproved =
                                enrollment.enrollment_status === 'APPROVED';

                            return (
                                <div
                                    key={enrollment.id}
                                    className="rounded-lg border border-[#1F2A24]/10 bg-white p-5 shadow-sm"
                                >
                                    <p className="mb-3 text-sm font-medium text-[#1F2A24]">
                                        {enrollment.student.first_name}{' '}
                                        {enrollment.student.last_name}
                                        <span className="ml-2 text-xs font-normal text-[#1F2A24]/65">
                                            {enrollment.grade_level.name} · SY{' '}
                                            {enrollment.school_year}
                                        </span>
                                    </p>

                                    <ul className="space-y-3">
                                        {DOCUMENTS.map((doc) => {
                                            const isVerified =
                                                verification?.[doc.verifiedKey];
                                            const path =
                                                verification?.[doc.pathKey];
                                            const key = `${enrollment.id}:${doc.type}`;

                                            return (
                                                <li
                                                    key={doc.type}
                                                    className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1F2A24]/5 pb-3 last:border-0 last:pb-0"
                                                >
                                                    <div>
                                                        <p className="text-sm text-[#1F2A24]">
                                                            {doc.label}
                                                        </p>
                                                        <p
                                                            className={`text-xs font-medium ${isVerified ? 'text-[#2F6F4E]' : path ? 'text-[#a4670f]' : 'text-[#1F2A24]/65'}`}
                                                        >
                                                            {isVerified
                                                                ? 'Verified'
                                                                : path
                                                                  ? 'Pending review'
                                                                  : 'Not uploaded yet'}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {path && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setViewingDocument(
                                                                        {
                                                                            title: doc.label,
                                                                            path,
                                                                        },
                                                                    );
                                                                    setIsViewingDocument(
                                                                        true,
                                                                    );
                                                                }}
                                                                className="inline-flex min-h-9 items-center rounded-full px-3 text-xs font-semibold text-[#2F6F4E] hover:bg-[#2F6F4E]/5 hover:underline"
                                                            >
                                                                View
                                                                <span className="sr-only">
                                                                    {' '}
                                                                    {doc.label}
                                                                </span>
                                                            </button>
                                                        )}
                                                        {isApproved ? (
                                                            <span className="text-xs text-[#1F2A24]/65">
                                                                Locked
                                                            </span>
                                                        ) : (
                                                            <label className="relative inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border border-[#1F2A24]/15 px-4 text-xs font-semibold text-[#1F2A24]/80 transition-colors focus-within:ring-2 focus-within:ring-[#2F6F4E] focus-within:ring-offset-1 hover:bg-[#1F2A24]/5">
                                                                {uploadingDoc ===
                                                                    key && (
                                                                    <Loader2
                                                                        className="h-3.5 w-3.5 animate-spin"
                                                                        aria-hidden="true"
                                                                    />
                                                                )}
                                                                {uploadingDoc ===
                                                                key
                                                                    ? 'Uploading...'
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
                                                                    disabled={
                                                                        uploadingDoc ===
                                                                        key
                                                                    }
                                                                    onChange={handleDocumentUpload(
                                                                        enrollment.id,
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
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
