import { Link } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowRight,
    CalendarCheck,
    CheckCircle2,
    ClipboardList,
    Hourglass,
    Upload,
    Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { formatAppointment } from '@/lib/document-appointment';
import {
    hasOutstandingBalance,
    missingDocuments,
    studentName,
} from '@/lib/portal-enrollment';
import { formatCurrency } from '@/lib/transactions';
import { cn } from '@/lib/utils';
import { create as admissionCreate } from '@/routes/admission';
import type { PortalEnrollment } from '@/types/portal';

export type DashboardTab = 'Applications' | 'Payments' | 'Documents';

type NextStep = {
    tone: 'action' | 'warning' | 'calm';
    icon: LucideIcon;
    title: string;
    description: ReactNode;
    action?:
        { label: string; href: string } | { label: string; tab: DashboardTab };
};

/** Picks the single most useful thing for the parent to do next. */
function nextStepFor(enrollments: PortalEnrollment[]): NextStep {
    const active = enrollments.filter((enrollment) => !enrollment.cancelled_at);

    if (active.length === 0) {
        return {
            tone: 'action',
            icon: ClipboardList,
            title: 'Start an enrollment application',
            description:
                'Apply for your child in a few steps. You can save a draft and finish later.',
            action: {
                label: 'Apply now',
                href: admissionCreate().url,
            },
        };
    }

    const rejected = active.find(
        (enrollment) => enrollment.enrollment_status === 'REJECTED',
    );

    if (rejected) {
        return {
            tone: 'warning',
            icon: AlertCircle,
            title: `${studentName(rejected)}'s application was not approved`,
            description:
                'See what needs fixing, then submit a new application when you are ready.',
            action: { label: 'See details', tab: 'Applications' },
        };
    }

    const payable = active.find(hasOutstandingBalance);

    if (payable?.payment_url) {
        return {
            tone: 'action',
            icon: Wallet,
            title: `Pay tuition for ${studentName(payable)}`,
            description: (
                <>
                    Remaining balance:{' '}
                    <span className="font-semibold tabular-nums">
                        {formatCurrency(payable.remaining_balance ?? 0)}
                    </span>
                </>
            ),
            action: { label: 'Pay with GCash', href: payable.payment_url },
        };
    }

    if (payable) {
        return {
            tone: 'action',
            icon: Wallet,
            title: `Pay tuition for ${studentName(payable)}`,
            description: (
                <>
                    Remaining balance:{' '}
                    <span className="font-semibold tabular-nums">
                        {formatCurrency(payable.remaining_balance ?? 0)}
                    </span>{' '}
                    · Pay in cash or online
                </>
            ),
            action: { label: 'Pay tuition', tab: 'Applications' },
        };
    }

    const appointment = active.find(
        (enrollment) =>
            enrollment.document_appointment &&
            enrollment.enrollment_status === 'PENDING',
    );

    if (appointment?.document_appointment) {
        return {
            tone: 'action',
            icon: CalendarCheck,
            title: `Registrar visit on ${formatAppointment(appointment.document_appointment)}`,
            description: `Bring ${studentName(appointment)}'s original documents to the registrar's office.`,
            action: { label: 'See what to bring', tab: 'Documents' },
        };
    }

    const needsDocuments = active.find(
        (enrollment) => missingDocuments(enrollment).length > 0,
    );

    if (needsDocuments) {
        const count = missingDocuments(needsDocuments).length;

        return {
            tone: 'action',
            icon: Upload,
            title: `Upload ${count} ${count === 1 ? 'document' : 'documents'} for ${studentName(needsDocuments)}`,
            description:
                'The registrar reviews applications faster once every document is in.',
            action: { label: 'Upload documents', tab: 'Documents' },
        };
    }

    if (
        active.some((enrollment) => enrollment.enrollment_status === 'PENDING')
    ) {
        return {
            tone: 'calm',
            icon: Hourglass,
            title: 'Your application is being reviewed',
            description:
                "There's nothing you need to do right now. We'll notify you as soon as there's an update.",
        };
    }

    return {
        tone: 'calm',
        icon: CheckCircle2,
        title: "You're all set",
        description: 'Every application is approved and fully paid.',
    };
}

const TONE_STYLES: Record<NextStep['tone'], string> = {
    action: 'border-brand/25 bg-brand/5 [&_[data-icon]]:bg-brand [&_[data-icon]]:text-white',
    warning:
        'border-danger/25 bg-danger/5 [&_[data-icon]]:bg-danger [&_[data-icon]]:text-white',
    calm: 'border-ink/10 bg-surface [&_[data-icon]]:bg-brand/10 [&_[data-icon]]:text-brand-ink',
};

export default function NextStepCard({
    enrollments,
    onOpenTab,
}: {
    enrollments: PortalEnrollment[];
    onOpenTab: (tab: DashboardTab) => void;
}) {
    const step = nextStepFor(enrollments);
    const Icon = step.icon;
    const action = step.action;
    const buttonClass =
        'inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-full bg-brand px-5 text-sm font-semibold whitespace-nowrap text-on-brand shadow-sm transition-colors hover:bg-brand-deep focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none';

    return (
        <section
            aria-labelledby="next-step-title"
            className={cn(
                'flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5',
                TONE_STYLES[step.tone],
            )}
        >
            <div className="flex gap-3">
                <span
                    data-icon
                    aria-hidden="true"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                >
                    <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                    <p className="text-xs font-semibold tracking-wide text-ink/60 uppercase">
                        Next step
                    </p>
                    <h2
                        id="next-step-title"
                        className="font-semibold text-ink"
                    >
                        {step.title}
                    </h2>
                    <p className="text-sm text-ink/70">
                        {step.description}
                    </p>
                </div>
            </div>

            {action && 'href' in action && (
                <Link href={action.href} className={buttonClass}>
                    {action.label}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
            )}
            {action && 'tab' in action && (
                <button
                    type="button"
                    onClick={() => onOpenTab(action.tab)}
                    className={buttonClass}
                >
                    {action.label}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
            )}
        </section>
    );
}
