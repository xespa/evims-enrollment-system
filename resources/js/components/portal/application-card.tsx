import { CheckCircle2, FileDown, PartyPopper } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import ApplicationProgress from '@/components/portal/application-progress';
import EnrollmentStatusBadge from '@/components/portal/enrollment-status-badge';
import PayTuitionDialog from '@/components/portal/pay-tuition-dialog';
import { SESSION_LABELS, studentName } from '@/lib/portal-enrollment';
import { formatCurrency } from '@/lib/transactions';
import { show as registrationFormShow } from '@/routes/portal/enrollments/registration-form';
import type {
    PortalEnrollment,
    PortalInstallment,
    PortalPaymentMethod,
} from '@/types/portal';

function PaymentProgress({
    totalBilled,
    remainingBalance,
}: {
    totalBilled: number;
    remainingBalance: number;
}) {
    const paid = Math.max(totalBilled - remainingBalance, 0);
    const percentage =
        totalBilled > 0
            ? Math.min(Math.round((paid / totalBilled) * 100), 100)
            : 0;

    return (
        <div className="mt-3">
            <div className="flex items-baseline justify-between gap-2 text-xs text-[#1F2A24]/70">
                <span>
                    <span className="font-semibold text-[#1F2A24] tabular-nums">
                        {formatCurrency(paid)}
                    </span>{' '}
                    paid of{' '}
                    <span className="tabular-nums">
                        {formatCurrency(totalBilled)}
                    </span>
                </span>
                <span className="tabular-nums">{percentage}%</span>
            </div>
            <div
                role="progressbar"
                aria-label="Tuition paid"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percentage}
                className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#1F2A24]/10"
            >
                <div
                    className="h-full rounded-full bg-[#2F6F4E] transition-[width] duration-500"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

const INSTALLMENT_STATUS: Record<
    PortalInstallment['status'],
    { label: string; className: string }
> = {
    UNPAID: { label: 'Unpaid', className: 'bg-[#1F2A24]/5 text-[#1F2A24]/70' },
    PARTIALLY_PAID: {
        label: 'Partially paid',
        className: 'bg-[#E8A33D]/15 text-[#a4670f]',
    },
    PAID: { label: 'Paid', className: 'bg-[#2F6F4E]/10 text-[#2F6F4E]' },
};

/**
 * Each installment and where it stands, so a payment the cashier records
 * shows up against the right installment.
 */
function InstallmentSchedule({
    installments,
}: {
    installments: PortalInstallment[];
}) {
    if (installments.length === 0) {
        return null;
    }

    return (
        <details className="group mt-3 rounded-lg border border-[#1F2A24]/10 bg-white">
            <summary className="flex min-h-11 cursor-pointer items-center justify-between px-3 text-sm font-medium text-[#1F2A24]">
                Installments
                <span className="text-xs text-[#1F2A24]/60">
                    {installments.filter((i) => i.status === 'PAID').length} of{' '}
                    {installments.length} paid
                </span>
            </summary>
            <ol className="divide-y divide-[#1F2A24]/5 border-t border-[#1F2A24]/10">
                {installments.map((installment) => {
                    const status = INSTALLMENT_STATUS[installment.status];

                    return (
                        <li
                            key={installment.id}
                            className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
                        >
                            <span className="text-[#1F2A24]/80">
                                #{installment.installment_number} · Due{' '}
                                {new Date(
                                    installment.due_date,
                                ).toLocaleDateString('en-PH', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                })}
                            </span>
                            <span className="flex items-center gap-2">
                                <span className="font-medium text-[#1F2A24] tabular-nums">
                                    {formatCurrency(installment.amount_due)}
                                </span>
                                <span
                                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}
                                >
                                    {status.label}
                                </span>
                            </span>
                        </li>
                    );
                })}
            </ol>
        </details>
    );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div>
            <dt className="text-xs text-[#1F2A24]/65">{label}</dt>
            <dd className="text-sm text-[#1F2A24]">{children}</dd>
        </div>
    );
}

export default function ApplicationCard({
    enrollment,
    paymentMethods,
    onCancel,
}: {
    enrollment: PortalEnrollment;
    paymentMethods: PortalPaymentMethod[];
    onCancel: (enrollment: PortalEnrollment) => void;
}) {
    const [isPaying, setIsPaying] = useState(false);
    // Remounts the dialog per opening so it starts from the saved method.
    const [paySession, setPaySession] = useState(0);
    const isCancelled = Boolean(enrollment.cancelled_at);
    const isApproved = enrollment.enrollment_status === 'APPROVED';
    const isPending = enrollment.enrollment_status === 'PENDING';
    const billing =
        enrollment.remaining_balance !== null &&
        enrollment.total_billed !== null
            ? {
                  remaining: enrollment.remaining_balance,
                  total: enrollment.total_billed,
              }
            : null;
    const isFullyPaid = billing !== null && billing.remaining <= 0;
    const showRejection =
        enrollment.enrollment_status === 'REJECTED' &&
        !isCancelled &&
        (enrollment.rejection_details.length > 0 || enrollment.rejection_note);

    return (
        <article
            aria-labelledby={`application-${enrollment.id}-title`}
            className={`rounded-xl border border-[#1F2A24]/10 bg-white p-5 shadow-sm ${isCancelled ? 'opacity-75' : ''}`}
        >
            <header className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                    <h3
                        id={`application-${enrollment.id}-title`}
                        className="font-semibold text-[#1F2A24]"
                    >
                        {studentName(enrollment)}
                    </h3>
                    <p className="text-sm text-[#1F2A24]/70">
                        {enrollment.grade_level.name} · SY{' '}
                        {enrollment.school_year} · Ref.{' '}
                        <span className="tabular-nums">#{enrollment.id}</span>
                    </p>
                </div>
                <EnrollmentStatusBadge enrollment={enrollment} />
            </header>

            {!isCancelled && (
                <div className="mt-4">
                    <ApplicationProgress enrollment={enrollment} />
                </div>
            )}

            <dl className="mt-4 grid grid-cols-1 gap-3 border-t border-[#1F2A24]/10 pt-4 sm:grid-cols-3">
                <Detail label="Grade Level">
                    {enrollment.grade_level.name}
                </Detail>
                <Detail label="Session Time Preference">
                    {SESSION_LABELS[enrollment.session_time_preference] ??
                        enrollment.session_time_preference}
                </Detail>
                <Detail label="LRN">
                    {enrollment.student.lrn ?? (
                        <span className="text-[#1F2A24]/65 italic">
                            Not yet assigned
                        </span>
                    )}
                </Detail>
            </dl>

            {showRejection && (
                <div className="mt-4 rounded-lg border border-[#C6473B]/20 bg-[#C6473B]/5 p-4 text-sm text-[#1F2A24]">
                    <p className="font-medium text-[#A83A30]">
                        Why this application was not approved
                    </p>
                    {enrollment.rejection_details.length > 0 && (
                        <ul className="mt-2 list-disc space-y-1 pl-5">
                            {enrollment.rejection_details.map((detail) => (
                                <li key={detail.label}>
                                    <span className="font-medium">
                                        {detail.label}
                                    </span>{' '}
                                    — {detail.guidance}
                                </li>
                            ))}
                        </ul>
                    )}
                    {enrollment.rejection_note && (
                        <p className="mt-2">
                            <span className="font-medium">
                                Note from the school:
                            </span>{' '}
                            {enrollment.rejection_note}
                        </p>
                    )}
                </div>
            )}

            {!isCancelled && (
                <div className="mt-4 border-t border-[#1F2A24]/10 pt-4">
                    {!isApproved && (
                        <p className="text-sm text-[#1F2A24]/65">
                            Tuition payment will be available here once your
                            application is approved.
                        </p>
                    )}

                    {isApproved && billing && !isFullyPaid && (
                        <div className="rounded-lg bg-[#2F6F4E]/5 p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex gap-3">
                                    <PartyPopper
                                        className="mt-0.5 h-5 w-5 shrink-0 text-[#2F6F4E]"
                                        aria-hidden="true"
                                    />
                                    <div>
                                        <p className="text-sm font-medium text-[#1F2A24]">
                                            You're approved! You can now pay
                                            your tuition.
                                        </p>
                                        <p className="text-sm text-[#1F2A24]/70">
                                            Remaining balance:{' '}
                                            <span className="font-semibold text-[#2F6F4E] tabular-nums">
                                                {formatCurrency(
                                                    billing.remaining,
                                                )}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPaySession((n) => n + 1);
                                        setIsPaying(true);
                                    }}
                                    className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#2F6F4E] px-5 py-2 text-center text-sm font-semibold whitespace-nowrap text-[#FBF8F2] shadow-sm transition-colors hover:bg-[#25573E]"
                                >
                                    Pay Tuition
                                </button>
                            </div>
                            <PaymentProgress
                                totalBilled={billing.total}
                                remainingBalance={billing.remaining}
                            />
                            <InstallmentSchedule
                                installments={
                                    enrollment.billing_contract?.installments ??
                                    []
                                }
                            />
                            <PayTuitionDialog
                                key={paySession}
                                enrollment={enrollment}
                                paymentMethods={paymentMethods}
                                open={isPaying}
                                onOpenChange={setIsPaying}
                            />
                        </div>
                    )}

                    {isApproved && isFullyPaid && (
                        <div className="flex items-center gap-2 rounded-lg bg-[#2F6F4E]/5 p-4 text-sm font-medium text-[#2F6F4E]">
                            <CheckCircle2
                                className="h-4 w-4 shrink-0"
                                aria-hidden="true"
                            />
                            Fully paid — no outstanding balance.
                        </div>
                    )}

                    {isApproved && !billing && (
                        <p className="text-sm text-[#1F2A24]/65">
                            Billing details aren't set up yet for this
                            enrollment. Please check back soon.
                        </p>
                    )}

                    {isApproved && (
                        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-[#1F2A24]/70">
                                Your registration form was emailed to you when
                                this application was approved.
                            </p>
                            {/* A plain link, since the browser downloads the PDF. */}
                            <a
                                href={registrationFormShow(enrollment.id).url}
                                className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-[#2F6F4E]/30 px-4 text-sm font-semibold whitespace-nowrap text-[#2F6F4E] transition-colors hover:bg-[#2F6F4E]/5"
                            >
                                <FileDown
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                />
                                Download registration form
                            </a>
                        </div>
                    )}
                </div>
            )}

            {!isCancelled && isPending && (
                <div className="mt-4 border-t border-[#1F2A24]/10 pt-4 text-right">
                    <button
                        type="button"
                        onClick={() => onCancel(enrollment)}
                        className="min-h-10 rounded-full px-3 text-sm font-medium text-[#C6473B] transition-colors hover:bg-[#C6473B]/5"
                    >
                        Cancel Application
                    </button>
                </div>
            )}
        </article>
    );
}
