import { Ban, CheckCircle2, Clock, XCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PortalEnrollment } from '@/types/portal';

const VARIANTS: Record<
    'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED',
    { label: string; icon: LucideIcon; className: string }
> = {
    PENDING: {
        label: 'Under review',
        icon: Clock,
        className: 'bg-warn/15 text-warn-ink',
    },
    APPROVED: {
        label: 'Approved',
        icon: CheckCircle2,
        className: 'bg-brand/10 text-brand-ink',
    },
    REJECTED: {
        label: 'Not approved',
        icon: XCircle,
        className: 'bg-danger/10 text-danger-alert',
    },
    CANCELLED: {
        label: 'Cancelled',
        icon: Ban,
        className: 'bg-ink/10 text-ink/70',
    },
};

/** An application's status, with an icon so it never relies on color alone. */
export default function EnrollmentStatusBadge({
    enrollment,
}: {
    enrollment: PortalEnrollment;
}) {
    const variant =
        VARIANTS[
            enrollment.cancelled_at ? 'CANCELLED' : enrollment.enrollment_status
        ];
    const Icon = variant.icon;

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap',
                variant.className,
            )}
        >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {variant.label}
        </span>
    );
}
