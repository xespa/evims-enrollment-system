import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Camera } from 'lucide-react';

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

const DOCUMENT_LABELS = {
    has_form_138: 'Form 138 (Report Card)',
    has_birth_certificate: 'PSA Birth Certificate',
    has_good_moral_certificate: 'Good Moral Certificate',
};

const PAYMENT_STATUS_STYLES = {
    COMPLETED: 'bg-green-100 text-green-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    FAILED: 'bg-red-100 text-red-800',
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

    const cancel = (enrollmentId) => {
        if (!confirm('Cancel this application?')) return;
        router.post(route('portal.enrollments.cancel', enrollmentId), {}, { preserveScroll: true });
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

    // ---- Aggregate "social signal"-style metrics across all enrollments ----
    const activeEnrollments = enrollments.filter((e) => !e.cancelled_at);
    const approvedCount = activeEnrollments.filter((e) => e.enrollment_status === 'APPROVED').length;
    const outstandingBalance = activeEnrollments.reduce(
        (sum, e) => sum + (e.remaining_balance && e.remaining_balance > 0 ? e.remaining_balance : 0),
        0,
    );

    // ---- Flatten every payment, across every enrollment, for the Payments tab ----
    const allTransactions = enrollments
        .flatMap((enrollment) =>
            (enrollment.billing_contract?.installments ?? []).flatMap((installment) =>
                installment.payments.map((payment) => ({
                    ...payment,
                    installment_number: installment.installment_number,
                    student_name: `${enrollment.student.first_name} ${enrollment.student.last_name}`,
                })),
            ),
        )
        .sort((a, b) => new Date(b.paid_at ?? b.created_at) - new Date(a.paid_at ?? a.created_at));

    return (
        <div className="mx-auto max-w-5xl px-4 pb-16">
            <Head title="My Profile" />

            {/* ---------------- Header banner ---------------- */}
            <div className="-mx-4 mb-6 h-28 bg-gradient-to-r from-[#2F6F4E] to-[#25573E] sm:h-36" />

            {/* ---------------- Identity block ---------------- */}
            <div className="-mt-16 flex flex-col gap-4 sm:-mt-20 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end">
                    <div className="relative h-24 w-24 sm:h-32 sm:w-32">
                        <label
                            htmlFor="profile-photo-input"
                            className="group relative block h-full w-full cursor-pointer overflow-hidden rounded-full border-4 border-[#FBF8F2] shadow-sm"
                        >
                            {enrollee?.profile_photo_url ? (
                                <img
                                    src={enrollee.profile_photo_url}
                                    alt={enrollee.name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center bg-[#2F6F4E] text-2xl font-semibold text-white sm:text-3xl">
                                    {initials(enrollee?.name)}
                                </div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/0 text-transparent transition-colors group-hover:bg-black/40 group-hover:text-white">
                                <Camera className="h-6 w-6" />
                            </div>
                            {uploading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs font-medium text-white">
                                    Uploading…
                                </div>
                            )}
                        </label>
                        <input
                            id="profile-photo-input"
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoChange}
                            className="hidden"
                        />
                    </div>
                    <div className="pb-1 text-center sm:text-left">
                        <div className="flex items-center justify-center gap-2 sm:justify-start">
                            <h1 className="font-serif text-xl font-semibold text-[#1F2A24] sm:text-2xl">{enrollee?.name}</h1>
                            {enrollee?.email_verified_at && (
                                <span
                                    title="Verified email"
                                    className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2F6F4E] text-xs font-bold text-white"
                                >
                                    ✓
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-[#1F2A24]/60">{enrollee?.email}</p>
                        <p className="text-sm text-[#1F2A24]/50">Student Account</p>
                    </div>
                </div>

                <div className="flex justify-center gap-2 sm:justify-end">
                    <Link
                        href={route('enrollment.create')}
                        className="rounded-full bg-[#2F6F4E] px-5 py-2 text-sm font-semibold text-[#FBF8F2] shadow-sm transition-colors hover:bg-[#25573E]"
                    >
                        + Apply for New Enrollment
                    </Link>
                    <button
                        onClick={logout}
                        className="rounded-full border border-[#1F2A24]/15 bg-white px-5 py-2 text-sm font-semibold text-[#1F2A24]/70 shadow-sm transition-colors hover:bg-[#1F2A24]/5"
                    >
                        Log Out
                    </button>
                </div>
            </div>

            {props.flash?.success && (
                <div className="mt-6 rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {props.flash.success}
                </div>
            )}

            {/* ---------------- Key metrics ("social signals") ---------------- */}
            <div className="mt-6 grid grid-cols-3 divide-x divide-[#1F2A24]/10 rounded-lg border border-[#1F2A24]/10 bg-white shadow-sm">
                <div className="px-4 py-4 text-center">
                    <p className="text-xl font-semibold text-[#1F2A24]">{activeEnrollments.length}</p>
                    <p className="text-xs text-[#1F2A24]/50">Applications</p>
                </div>
                <div className="px-4 py-4 text-center">
                    <p className="text-xl font-semibold text-[#1F2A24]">{approvedCount}</p>
                    <p className="text-xs text-[#1F2A24]/50">Approved</p>
                </div>
                <div className="px-4 py-4 text-center">
                    <p className={`text-xl font-semibold ${outstandingBalance > 0 ? 'text-[#C6473B]' : 'text-[#1F2A24]'}`}>
                        {formatCurrency(outstandingBalance)}
                    </p>
                    <p className="text-xs text-[#1F2A24]/50">Outstanding Balance</p>
                </div>
            </div>

            {/* ---------------- Tabs ---------------- */}
            <div className="mt-8 border-b border-[#1F2A24]/10">
                <nav className="-mb-px flex gap-6">
                    {TABS.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
                                activeTab === tab
                                    ? 'border-[#2F6F4E] text-[#2F6F4E]'
                                    : 'border-transparent text-[#1F2A24]/50 hover:text-[#1F2A24]/80'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>
            </div>

            {/* ---------------- Tab content ---------------- */}
            <div className="mt-6">
                {activeTab === 'Applications' && (
                    <div className="space-y-4">
                        {enrollments.length === 0 && (
                            <div className="rounded-lg border border-dashed border-[#1F2A24]/20 bg-white p-8 text-center text-sm text-[#1F2A24]/50">
                                You don't have any applications yet.
                            </div>
                        )}

                        {enrollments.map((enrollment) => {
                            const isApproved = enrollment.enrollment_status === 'APPROVED';
                            const hasBalance = enrollment.remaining_balance !== null;
                            const isFullyPaid = hasBalance && enrollment.remaining_balance <= 0;

                            return (
                                <div key={enrollment.id} className="rounded-lg border border-[#1F2A24]/10 bg-white p-5 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-[#1F2A24]">
                                                {enrollment.student.first_name} {enrollment.student.last_name}
                                            </p>
                                            <p className="text-sm text-[#1F2A24]/60">
                                                {enrollment.grade_level.name} · SY {enrollment.school_year}
                                            </p>
                                        </div>
                                        {enrollment.cancelled_at ? (
                                            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">CANCELLED</span>
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
                                            <p className="text-xs text-[#1F2A24]/50">Grade Level</p>
                                            <p className="text-sm text-[#1F2A24]">{enrollment.grade_level.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-[#1F2A24]/50">Session Time Preference</p>
                                            <p className="text-sm text-[#1F2A24]">
                                                {SESSION_LABELS[enrollment.session_time_preference] ?? enrollment.session_time_preference}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-[#1F2A24]/50">LRN</p>
                                            <p className="text-sm text-[#1F2A24]">
                                                {enrollment.student.lrn ?? <span className="text-[#1F2A24]/40 italic">Not yet assigned</span>}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 border-t border-[#1F2A24]/10 pt-4">
                                        {!isApproved && !enrollment.cancelled_at && (
                                            <p className="text-sm text-[#1F2A24]/50">
                                                Tuition payment will be available here once your application is approved.
                                            </p>
                                        )}

                                        {isApproved && hasBalance && !isFullyPaid && (
                                            <div className="flex flex-col gap-3 rounded-md bg-[#2F6F4E]/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-[#1F2A24]">
                                                        🎉 You're approved! You can now pay your tuition.
                                                    </p>
                                                    <p className="text-sm text-[#1F2A24]/70">
                                                        Remaining balance:{' '}
                                                        <span className="font-semibold text-[#2F6F4E]">
                                                            {formatCurrency(enrollment.remaining_balance)}
                                                        </span>{' '}
                                                        of {formatCurrency(enrollment.total_billed)}
                                                    </p>
                                                </div>
                                                <Link
                                                    href={enrollment.payment_url}
                                                    className="whitespace-nowrap rounded-full bg-[#2F6F4E] px-5 py-2 text-center text-sm font-semibold text-[#FBF8F2] shadow-sm transition-colors hover:bg-[#25573E]"
                                                >
                                                    Pay Tuition
                                                </Link>
                                            </div>
                                        )}

                                        {isApproved && isFullyPaid && (
                                            <div className="rounded-md bg-green-50 p-4 text-sm font-medium text-green-700">
                                                ✓ Fully paid — no outstanding balance.
                                            </div>
                                        )}

                                        {isApproved && !hasBalance && (
                                            <p className="text-sm text-[#1F2A24]/50">
                                                Billing details aren't set up yet for this enrollment. Please check back soon.
                                            </p>
                                        )}
                                    </div>

                                    {!enrollment.cancelled_at && enrollment.enrollment_status === 'PENDING' && (
                                        <div className="mt-4 border-t border-[#1F2A24]/10 pt-4 text-right">
                                            <button
                                                onClick={() => cancel(enrollment.id)}
                                                className="text-sm text-red-600 hover:underline"
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
                            <p className="py-8 text-center text-sm text-[#1F2A24]/50">No transactions yet.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="text-xs text-[#1F2A24]/50">
                                            <th className="pb-2 font-medium">Date</th>
                                            <th className="pb-2 font-medium">Student</th>
                                            <th className="pb-2 font-medium">Installment</th>
                                            <th className="pb-2 font-medium">Method</th>
                                            <th className="pb-2 font-medium">Amount</th>
                                            <th className="pb-2 font-medium">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#1F2A24]/5">
                                        {allTransactions.map((payment) => (
                                            <tr key={payment.id}>
                                                <td className="py-2 text-[#1F2A24]/80">
                                                    {payment.paid_at
                                                        ? new Date(payment.paid_at).toLocaleDateString('en-PH', {
                                                              year: 'numeric',
                                                              month: 'short',
                                                              day: 'numeric',
                                                          })
                                                        : '—'}
                                                </td>
                                                <td className="py-2 text-[#1F2A24]/80">{payment.student_name}</td>
                                                <td className="py-2 text-[#1F2A24]/80">#{payment.installment_number}</td>
                                                <td className="py-2 text-[#1F2A24]/80">{METHOD_LABELS[payment.method] ?? payment.method}</td>
                                                <td className="py-2 font-medium text-[#1F2A24]">{formatCurrency(payment.amount)}</td>
                                                <td className="py-2">
                                                    <span
                                                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                                            PAYMENT_STATUS_STYLES[payment.status] ?? 'bg-gray-100 text-gray-600'
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
                            <div className="rounded-lg border border-dashed border-[#1F2A24]/20 bg-white p-8 text-center text-sm text-[#1F2A24]/50">
                                No applications to show documents for yet.
                            </div>
                        )}
                        {enrollments.map((enrollment) => {
                            const verification = enrollment.office_verification;
                            return (
                                <div key={enrollment.id} className="rounded-lg border border-[#1F2A24]/10 bg-white p-5 shadow-sm">
                                    <p className="mb-3 text-sm font-medium text-[#1F2A24]">
                                        {enrollment.student.first_name} {enrollment.student.last_name}
                                        <span className="ml-2 text-xs font-normal text-[#1F2A24]/50">
                                            {enrollment.grade_level.name} · SY {enrollment.school_year}
                                        </span>
                                    </p>
                                    {verification ? (
                                        <ul className="space-y-1">
                                            {Object.entries(DOCUMENT_LABELS).map(([key, label]) => (
                                                <li key={key} className="flex items-center gap-2 text-sm">
                                                    <span className={verification[key] ? 'text-green-600' : 'text-gray-300'}>
                                                        {verification[key] ? '✓' : '○'}
                                                    </span>
                                                    <span className={verification[key] ? 'text-[#1F2A24]' : 'text-[#1F2A24]/40'}>{label}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-[#1F2A24]/40">Not yet reviewed by the registrar.</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
