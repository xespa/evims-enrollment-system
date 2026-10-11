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
        className: 'bg-[#E8A33D]/15 text-[#a4670f]',
    },
    APPROVED: {
        label: 'Approved',
        icon: CheckCircle2,
        className: 'bg-[#2F6F4E]/10 text-[#2F6F4E]',
    },
    REJECTED: {
        label: 'Not approved',
        icon: XCircle,
        className: 'bg-[#C6473B]/10 text-[#A83A30]',
    },
    CANCELLED: {
        label: 'Cancelled',
        icon: Ban,
        className: 'bg-[#1F2A24]/10 text-[#1F2A24]/70',
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
