import { router } from '@inertiajs/react';
import { KeyRound, Send } from 'lucide-react';
import { useState } from 'react';
import { useConfirm } from '@/hooks/use-confirm';
import { cn } from '@/lib/utils';
import { store as createAccount } from '@/routes/admin/students/account';
import { store as requestConsent } from '@/routes/admin/students/account-consent';

/** From Student::accountSummary(). */
export type StudentAccountSummary = {
    status: 'AWAITING_CONSENT' | 'CONSENT_GIVEN' | 'ACTIVE' | 'DECLINED' | null;
    status_label: string | null;
    consent_email: string | null;
    requested_at: string | null;
    expires_at: string | null;
    responded_at: string | null;
    consent_given_by: string | null;
    /** Why an account can't be requested yet, if anything. */
    blocker: string | null;
};

/**
 * The next step for a student's account: ask the parent for consent (or
 * again), or — once they agreed — create the account. Renders nothing when
 * there's nothing to do.
 */
export default function StudentAccountActions({
    studentId,
    studentName,
    account,
    size = 'default',
}: {
    studentId: number;
    studentName: string;
    account: StudentAccountSummary;
    size?: 'default' | 'compact';
}) {
    const [confirm, confirmDialog] = useConfirm();
    const [processing, setProcessing] = useState(false);

    const isAwaiting = account.status === 'AWAITING_CONSENT';
    const isReadyToCreate = account.status === 'CONSENT_GIVEN';
    const canRequestConsent =
        !account.blocker &&
        account.status !== 'ACTIVE' &&
        account.status !== 'CONSENT_GIVEN';

    if (!isReadyToCreate && !canRequestConsent) {
        return null;
    }

    const visitOptions = {
        preserveScroll: true,
        onStart: () => setProcessing(true),
        onFinish: () => setProcessing(false),
    };

    const sendConsent = async () => {
        const confirmed = await confirm({
            title: isAwaiting
                ? 'Resend the consent email?'
                : `Ask for consent to ${studentName}'s account?`,
            description: isAwaiting
                ? 'The parent gets a fresh link, and the earlier one stops working.'
                : "We'll email the parent or guardian on file a link to agree or decline. Once they agree, you can create the account.",
            confirmLabel: isAwaiting ? 'Resend email' : 'Send consent email',
        });

        if (confirmed) {
            router.post(requestConsent(studentId).url, {}, visitOptions);
        }
    };

    const create = async () => {
        const confirmed = await confirm({
            title: `Create ${studentName}'s account?`,
            description:
                "The account is bound to the student's LRN. They sign in with the LRN, which is also their first password, and are asked to change it. We'll email the parent that it's ready.",
            confirmLabel: 'Create account',
        });

        if (confirmed) {
            router.post(createAccount(studentId).url, {}, visitOptions);
        }
    };

    const buttonClass = cn(
        'inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-[#2F6F4E] focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60',
        size === 'compact' ? 'min-h-9 px-4 text-xs' : 'min-h-11 px-5 text-sm',
    );

    return (
        <>
            {confirmDialog}
            {isReadyToCreate ? (
                <button
                    type="button"
                    onClick={create}
                    disabled={processing}
                    className={cn(
                        buttonClass,
                        'bg-[#2F6F4E] text-white hover:bg-[#25573E]',
                    )}
                >
                    <KeyRound className="h-4 w-4" aria-hidden="true" />
                    Create account
                </button>
            ) : (
                <button
                    type="button"
                    onClick={sendConsent}
                    disabled={processing}
                    className={cn(
                        buttonClass,
                        isAwaiting
                            ? 'border border-[#2F6F4E]/30 text-[#2F6F4E] hover:bg-[#2F6F4E]/5'
                            : 'bg-[#2F6F4E] text-white hover:bg-[#25573E]',
                    )}
                >
                    <Send className="h-4 w-4" aria-hidden="true" />
                    {isAwaiting
                        ? 'Resend consent email'
                        : account.status === 'DECLINED'
                          ? 'Ask for consent again'
                          : 'Request parent consent'}
                </button>
            )}
        </>
    );
}
