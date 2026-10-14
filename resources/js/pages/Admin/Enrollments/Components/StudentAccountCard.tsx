import { usePage } from '@inertiajs/react';
import {
    KeyRound,
    MailCheck,
    ShieldCheck,
    ShieldQuestion,
    ShieldX,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import StudentAccountActions from '@/components/student-account-actions';
import type { StudentAccountSummary } from '@/components/student-account-actions';
import { cn } from '@/lib/utils';

const STATUS_APPEARANCE: Record<
    NonNullable<StudentAccountSummary['status']>,
    { icon: LucideIcon; badge: string }
> = {
    AWAITING_CONSENT: {
        icon: MailCheck,
        badge: 'bg-[#E8A33D]/15 text-[#a4670f]',
    },
    CONSENT_GIVEN: {
        icon: ShieldQuestion,
        badge: 'bg-[#2F6F4E]/10 text-[#2F6F4E]',
    },
    ACTIVE: { icon: ShieldCheck, badge: 'bg-[#2F6F4E]/10 text-[#2F6F4E]' },
    DECLINED: { icon: ShieldX, badge: 'bg-[#C6473B]/10 text-[#A83A30]' },
};

function formatDateTime(value: string) {
    return new Date(value).toLocaleString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

/**
 * The student's sign-in account (bound to their LRN). Staff ask the parent
 * for consent, then create the account once they agree.
 */
export default function StudentAccountCard({
    studentId,
    studentName,
    account,
    canManage,
}: {
    studentId: number;
    studentName: string;
    account: StudentAccountSummary;
    canManage: boolean;
}) {
    const error = usePage().props.errors?.account;

    const isAwaiting = account.status === 'AWAITING_CONSENT';
    const appearance = account.status
        ? STATUS_APPEARANCE[account.status]
        : null;
    const StatusIcon = appearance?.icon ?? KeyRound;

    return (
        <div className="rounded-2xl border border-[#1F2A24]/10 bg-white p-5 md:col-span-2">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xs font-semibold tracking-[0.1em] text-[#2F6F4E] uppercase">
                    Student Account
                </h2>
                {account.status_label && appearance && (
                    <span
                        className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
                            appearance.badge,
                        )}
                    >
                        <StatusIcon
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                        />
                        {account.status_label}
                    </span>
                )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1 text-sm text-[#1F2A24]/75">
                    {account.status === null && (
                        <p>
                            No account yet. {studentName} would sign in with
                            their LRN to see grades. A parent or guardian must
                            consent first.
                        </p>
                    )}
                    {isAwaiting && account.consent_email && (
                        <>
                            <p>
                                Consent email sent to{' '}
                                <span className="font-medium text-[#1F2A24]">
                                    {account.consent_email}
                                </span>
                                {account.requested_at &&
                                    ` on ${formatDateTime(account.requested_at)}`}
                                .
                            </p>
                            {account.expires_at && (
                                <p className="text-xs text-[#1F2A24]/60">
                                    The link expires{' '}
                                    {formatDateTime(account.expires_at)}. You
                                    can create the account once the parent
                                    agrees.
                                </p>
                            )}
                        </>
                    )}
                    {account.status === 'CONSENT_GIVEN' && (
                        <p>
                            {account.consent_given_by ?? 'The parent'} gave
                            consent
                            {account.responded_at &&
                                ` on ${formatDateTime(account.responded_at)}`}
                            . Create the account so {studentName} can sign in
                            with their LRN.
                        </p>
                    )}
                    {account.status === 'ACTIVE' && (
                        <p>
                            {account.consent_given_by ?? 'The parent'} gave
                            consent
                            {account.responded_at &&
                                ` on ${formatDateTime(account.responded_at)}`}
                            . {studentName} signs in with their LRN.
                        </p>
                    )}
                    {account.status === 'DECLINED' && (
                        <p>
                            {account.consent_given_by ?? 'The parent'} declined
                            {account.responded_at &&
                                ` on ${formatDateTime(account.responded_at)}`}
                            . You can ask again if they change their mind.
                        </p>
                    )}
                    {account.blocker && account.status !== 'ACTIVE' && (
                        <p className="text-xs text-[#a4670f]">
                            {account.blocker}
                        </p>
                    )}
                    {error && (
                        <p role="alert" className="text-sm text-[#C6473B]">
                            {error}
                        </p>
                    )}
                </div>

                {canManage && (
                    <StudentAccountActions
                        studentId={studentId}
                        studentName={studentName}
                        account={account}
                    />
                )}
            </div>
        </div>
    );
}
