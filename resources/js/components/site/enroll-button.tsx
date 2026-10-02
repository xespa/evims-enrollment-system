import { Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    CalendarClock,
    Clock,
    MailWarning,
    ShieldAlert,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { create as admission } from '@/routes/admission';
import { accountStatus } from '@/routes/portal';
import { notice as verificationNotice } from '@/routes/portal/verification';

type Enrollee = {
    email_verified_at: string | null;
    account_status: 'PENDING' | 'APPROVED' | 'REJECTED';
};

type SharedProps = {
    auth?: { enrollee?: Enrollee | null };
    enrollment?: { openSchoolYear?: string | null };
};

type EnrollState = {
    label: string;
    /** Extra context, e.g. which school year is open. */
    hint?: string;
    href: string;
    icon: LucideIcon;
    tone: 'primary' | 'waiting' | 'action' | 'muted';
    /** Show the "enrollment is open" pulse. */
    isLive?: boolean;
};

/**
 * What the enroll button should say and where it should lead for the
 * person looking at it — so nobody clicks "Enroll Now" into a dead end.
 */
function enrollState(
    enrollee: Enrollee | null,
    openSchoolYear: string | null,
): EnrollState {
    if (!openSchoolYear) {
        return {
            label: 'Enrollment opens soon',
            href: admission().url,
            icon: CalendarClock,
            tone: 'muted',
        };
    }

    const hint = `S.Y. ${openSchoolYear}`;

    if (enrollee && !enrollee.email_verified_at) {
        return {
            label: 'Confirm email to enroll',
            hint,
            href: verificationNotice().url,
            icon: MailWarning,
            tone: 'action',
        };
    }

    if (enrollee?.account_status === 'PENDING') {
        return {
            label: 'Account under review',
            hint,
            href: accountStatus().url,
            icon: Clock,
            tone: 'waiting',
        };
    }

    if (enrollee?.account_status === 'REJECTED') {
        return {
            label: 'Fix account to enroll',
            hint,
            href: accountStatus().url,
            icon: ShieldAlert,
            tone: 'action',
        };
    }

    return {
        label: enrollee ? 'Enroll a Child' : 'Enroll Now',
        hint,
        href: admission().url,
        icon: ArrowRight,
        tone: 'primary',
        isLive: true,
    };
}

const TONES: Record<EnrollState['tone'], string> = {
    primary:
        'bg-[#2F6F4E] text-[#FBF8F2] shadow-md shadow-[#2F6F4E]/25 hover:bg-[#25573E] hover:shadow-lg hover:shadow-[#2F6F4E]/30',
    waiting:
        'border border-[#E8A33D]/40 bg-[#E8A33D]/10 text-[#8A5A12] hover:bg-[#E8A33D]/20',
    action: 'border border-[#C6473B]/30 bg-[#C6473B]/5 text-[#9A3329] hover:bg-[#C6473B]/10',
    muted: 'border border-[#1F2A24]/15 bg-white text-[#1F2A24]/70 hover:bg-[#1F2A24]/5',
};

export default function EnrollButton({
    onNavigate,
    fullWidth = false,
}: {
    onNavigate?: () => void;
    fullWidth?: boolean;
}) {
    const { url, props } = usePage<SharedProps>();
    const state = enrollState(
        props.auth?.enrollee ?? null,
        props.enrollment?.openSchoolYear ?? null,
    );
    const Icon = state.icon;
    const isCurrentPage =
        url.split('?')[0] === new URL(state.href, 'http://x').pathname;

    return (
        <Link
            href={state.href}
            onClick={onNavigate}
            aria-current={isCurrentPage ? 'page' : undefined}
            aria-label={
                state.hint ? `${state.label}, ${state.hint}` : state.label
            }
            className={`group relative inline-flex min-h-11 items-center gap-2.5 rounded-full py-1.5 pr-4 pl-3.5 text-left transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#2F6F4E] focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.98] ${
                fullWidth ? 'w-full justify-center' : ''
            } ${TONES[state.tone]} ${
                isCurrentPage
                    ? 'ring-2 ring-[#2F6F4E]/30 ring-offset-2 ring-offset-[#FBF8F2]'
                    : ''
            }`}
        >
            {state.isLive && (
                <span
                    className="relative flex h-2 w-2 shrink-0"
                    aria-hidden="true"
                >
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#E8A33D] opacity-75 motion-reduce:animate-none" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#E8A33D]" />
                </span>
            )}

            <span className="flex flex-col leading-tight">
                <span className="text-sm font-semibold whitespace-nowrap">
                    {state.label}
                </span>
                {state.hint && (
                    <span
                        className={`text-[10.5px] font-medium tracking-wide whitespace-nowrap ${
                            state.tone === 'primary'
                                ? 'text-[#FBF8F2]/75'
                                : 'opacity-75'
                        }`}
                    >
                        {state.hint}
                    </span>
                )}
            </span>

            <Icon
                className={`h-4 w-4 shrink-0 ${
                    state.tone === 'primary'
                        ? 'transition-transform duration-200 group-hover:translate-x-0.5'
                        : ''
                }`}
                aria-hidden="true"
            />
        </Link>
    );
}
