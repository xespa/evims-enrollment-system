import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { IdCard, MailCheck, MailWarning } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useConfirm } from '@/hooks/use-confirm';

type AccountStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

type AccountType = 'PARENT_GUARDIAN' | 'STUDENT';

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
    PARENT_GUARDIAN: 'Parent / Guardian',
    STUDENT: 'Student',
};

type RejectionReason =
    | 'BLURRY_ID'
    | 'INCOMPLETE_ID'
    | 'UNACCEPTED_ID'
    | 'EXPIRED_ID'
    | 'NAME_MISMATCH'
    | 'OTHER';

type RejectionReasonOption = { value: RejectionReason; label: string };

type LinkedEnrollment = {
    id: number;
    school_year: string;
    enrollment_status: string;
    student: { id: number; first_name: string; last_name: string } | null;
    grade_level: { id: number; name: string } | null;
};

type EnrolleeAccount = {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    account_status: AccountStatus;
    reviewed_at: string | null;
    rejection_reasons: RejectionReason[] | null;
    /** The admin's note to the account holder. */
    rejection_reason: string | null;
    /** Null for accounts created before the type was asked for. */
    account_type: AccountType | null;
    has_valid_id: boolean;
    created_at: string;
    reviewer: { id: number; name: string } | null;
    enrollments: LinkedEnrollment[];
};

type PaginationLink = { url: string | null; label: string; active: boolean };

type Props = {
    accounts: { data: EnrolleeAccount[]; links: PaginationLink[] };
    counts: Partial<Record<AccountStatus, number>>;
    filters: { status: AccountStatus; search: string };
    rejectionReasons: RejectionReasonOption[];
    /** Pending accounts that can't be approved until their email is confirmed. */
    awaitingEmailCount: number;
};

const TABS: { status: AccountStatus; label: string }[] = [
    { status: 'PENDING', label: 'Pending' },
    { status: 'APPROVED', label: 'Approved' },
    { status: 'REJECTED', label: 'Rejected' },
];

function formatDate(value: string): string {
    return new Date(value).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

/**
 * Rejects (or revokes) a portal account. The chosen reasons — each with
 * how to fix it — and the note are emailed to the account holder.
 */
function RejectAccountDialog({
    account,
    reasons,
    open,
    onOpenChange,
}: {
    account: EnrolleeAccount;
    reasons: RejectionReasonOption[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { data, setData, patch, processing, errors, reset, clearErrors } =
        useForm<{
            account_status: 'REJECTED';
            rejection_reasons: RejectionReason[];
            rejection_reason: string;
        }>({
            account_status: 'REJECTED',
            rejection_reasons: [],
            rejection_reason: '',
        });

    const needsNote = data.rejection_reasons.includes('OTHER');
    const reasonsError =
        errors.rejection_reasons ??
        (errors as Record<string, string | undefined>)['rejection_reasons.0'];

    const toggleReason = (reason: RejectionReason, checked: boolean) => {
        setData(
            'rejection_reasons',
            checked
                ? [...data.rejection_reasons, reason]
                : data.rejection_reasons.filter((r) => r !== reason),
        );
    };

    const close = (isOpen: boolean) => {
        if (!isOpen) {
            reset();
            clearErrors();
        }
        onOpenChange(isOpen);
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        patch(route('admin.enrollee-accounts.update', account.id), {
            preserveScroll: true,
            onSuccess: () => close(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={close}>
            <DialogContent
                aria-describedby="reject-account-summary"
                className="rounded-2xl border-[#1F2A24]/10 bg-white p-0 text-[#1F2A24] sm:max-w-md"
            >
                <form onSubmit={submit}>
                    <DialogHeader className="border-b border-[#1F2A24]/10 px-6 py-5 pr-12 text-left">
                        <DialogTitle className="font-serif text-xl font-semibold">
                            Reject {account.name}'s account?
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 px-6 py-5">
                        <p
                            id="reject-account-summary"
                            className="text-sm text-[#1F2A24]/75"
                        >
                            We'll email {account.email} what's wrong and how to
                            fix it. They can upload a new ID, which sends the
                            account back to Pending.
                        </p>

                        <fieldset>
                            <legend className="mb-2 text-sm font-medium text-[#1F2A24]/80">
                                What's wrong?{' '}
                                <span
                                    className="text-[#C6473B]"
                                    aria-hidden="true"
                                >
                                    *
                                </span>
                            </legend>
                            <div className="space-y-0.5">
                                {reasons.map((reason) => {
                                    const checkboxId = `reason-${reason.value}`;

                                    return (
                                        <div
                                            key={reason.value}
                                            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-[#1F2A24]/5"
                                        >
                                            <Checkbox
                                                id={checkboxId}
                                                checked={data.rejection_reasons.includes(
                                                    reason.value,
                                                )}
                                                onCheckedChange={(checked) =>
                                                    toggleReason(
                                                        reason.value,
                                                        checked === true,
                                                    )
                                                }
                                                className="data-[state=checked]:border-[#C6473B] data-[state=checked]:bg-[#C6473B]"
                                            />
                                            <label
                                                htmlFor={checkboxId}
                                                className="flex-1 cursor-pointer text-sm text-[#1F2A24]"
                                            >
                                                {reason.label}
                                            </label>
                                        </div>
                                    );
                                })}
                            </div>
                            {reasonsError && (
                                <p className="mt-1 text-xs text-[#C6473B]">
                                    {reasonsError}
                                </p>
                            )}
                        </fieldset>

                        <div>
                            <label
                                htmlFor="rejection-note"
                                className="mb-1 block text-sm font-medium text-[#1F2A24]/80"
                            >
                                Note to the account holder{' '}
                                {needsNote ? (
                                    <span
                                        className="text-[#C6473B]"
                                        aria-hidden="true"
                                    >
                                        *
                                    </span>
                                ) : (
                                    <span className="font-normal text-[#1F2A24]/50">
                                        (optional)
                                    </span>
                                )}
                            </label>
                            <textarea
                                id="rejection-note"
                                required={needsNote}
                                rows={3}
                                maxLength={500}
                                placeholder="e.g. The birthdate on the ID is hard to read."
                                value={data.rejection_reason}
                                onChange={(e) =>
                                    setData('rejection_reason', e.target.value)
                                }
                                aria-invalid={
                                    errors.rejection_reason ? true : undefined
                                }
                                className="w-full rounded-lg border border-[#1F2A24]/15 bg-white px-3 py-2 text-sm focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none aria-[invalid=true]:border-[#C6473B]"
                            />
                            {errors.rejection_reason && (
                                <p className="mt-1 text-xs text-[#C6473B]">
                                    {errors.rejection_reason}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 border-t border-[#1F2A24]/10 px-6 py-4">
                        <button
                            type="button"
                            onClick={() => close(false)}
                            className="min-h-10 rounded-full border border-[#1F2A24]/15 px-5 text-sm font-semibold text-[#1F2A24]/80 hover:bg-[#1F2A24]/5"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={
                                processing ||
                                data.rejection_reasons.length === 0
                            }
                            className="min-h-10 rounded-full bg-[#C6473B] px-5 text-sm font-semibold text-white hover:bg-[#A93A30] disabled:opacity-60"
                        >
                            Reject &amp; Email
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function Index({
    accounts,
    counts,
    filters,
    rejectionReasons,
    awaitingEmailCount,
}: Props) {
    const reasonLabels = Object.fromEntries(
        rejectionReasons.map((reason) => [reason.value, reason.label]),
    ) as Record<RejectionReason, string>;
    const { props } = usePage<{
        flash?: { success?: string };
        errors?: { account_status?: string };
    }>();
    const [confirm, confirmDialog] = useConfirm();
    const [search, setSearch] = useState(filters.search ?? '');
    // Kept apart from `isRejecting` so the dialog doesn't blank out while closing.
    const [rejecting, setRejecting] = useState<EnrolleeAccount | null>(null);
    const [isRejecting, setIsRejecting] = useState(false);

    const applyFilters = (overrides: Partial<Props['filters']> = {}) => {
        router.get(
            route('admin.enrollee-accounts.index'),
            { status: filters.status, search, ...overrides },
            { preserveState: true, replace: true },
        );
    };

    const approve = async (account: EnrolleeAccount) => {
        const confirmed = await confirm({
            title: `Approve ${account.name}'s account?`,
            description:
                'They will be able to use the portal, upload documents, and pay online.',
            confirmLabel: 'Approve Account',
        });
        if (!confirmed) return;
        router.patch(
            route('admin.enrollee-accounts.update', account.id),
            { account_status: 'APPROVED' },
            { preserveScroll: true },
        );
    };

    const openReject = (account: EnrolleeAccount) => {
        setRejecting(account);
        setIsRejecting(true);
    };

    return (
        <>
            <Head title="Portal Accounts" />
            {confirmDialog}

            <div className="bg-[#FBF8F2] px-4 py-8">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-6">
                        <h1 className="font-serif text-2xl font-semibold text-[#1F2A24]">
                            Portal Accounts
                        </h1>
                        <p className="text-sm text-[#1F2A24]/70">
                            Approve portal accounts before they can view
                            applications, upload documents, or pay online.
                        </p>
                    </div>

                    {props.flash?.success && (
                        <div
                            role="status"
                            className="mb-4 rounded-xl border border-[#2F6F4E]/25 bg-[#2F6F4E]/5 px-4 py-3 text-sm text-[#2F6F4E]"
                        >
                            {props.flash.success}
                        </div>
                    )}

                    {props.errors?.account_status && (
                        <div
                            role="alert"
                            className="mb-4 rounded-xl border border-[#C6473B]/25 bg-[#C6473B]/5 px-4 py-3 text-sm text-[#9A3329]"
                        >
                            {props.errors.account_status}
                        </div>
                    )}

                    {filters.status === 'PENDING' && awaitingEmailCount > 0 && (
                        <div
                            role="status"
                            className="mb-4 flex items-start gap-2.5 rounded-xl border border-[#E8A33D]/30 bg-[#E8A33D]/10 px-4 py-3 text-sm text-[#1F2A24]"
                        >
                            <MailWarning
                                className="mt-0.5 h-4 w-4 shrink-0 text-[#a4670f]"
                                aria-hidden="true"
                            />
                            <p>
                                <span className="font-semibold">
                                    {awaitingEmailCount === 1
                                        ? '1 account is'
                                        : `${awaitingEmailCount} accounts are`}{' '}
                                    waiting on email confirmation.
                                </span>{' '}
                                They can't be approved until the account holder
                                clicks the link we emailed them. You can still
                                reject them.
                            </p>
                        </div>
                    )}

                    <div
                        role="tablist"
                        aria-label="Account status"
                        className="mb-4 flex flex-wrap gap-2"
                    >
                        {TABS.map((tab) => {
                            const isActive = filters.status === tab.status;

                            return (
                                <button
                                    key={tab.status}
                                    type="button"
                                    role="tab"
                                    aria-selected={isActive}
                                    onClick={() =>
                                        applyFilters({ status: tab.status })
                                    }
                                    className={`min-h-10 rounded-full border px-4 text-sm font-medium ${
                                        isActive
                                            ? 'border-[#2F6F4E] bg-[#2F6F4E] text-white'
                                            : 'border-[#1F2A24]/10 bg-white text-[#1F2A24]/70 hover:bg-[#1F2A24]/5'
                                    }`}
                                >
                                    {tab.label}{' '}
                                    <span className="tabular-nums opacity-80">
                                        ({counts[tab.status] ?? 0})
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="mb-4 rounded-2xl border border-[#1F2A24]/10 bg-white p-4">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                applyFilters();
                            }}
                            role="search"
                            className="flex flex-wrap gap-3"
                        >
                            <input
                                type="search"
                                aria-label="Search accounts by name or email"
                                placeholder="Search by name or email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="min-h-10 min-w-[200px] flex-1 rounded-lg border border-[#1F2A24]/15 bg-white px-3 py-2 text-sm text-[#1F2A24] focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none"
                            />
                            <button
                                type="submit"
                                className="min-h-10 rounded-full bg-[#2F6F4E] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#25573E]"
                            >
                                Search
                            </button>
                        </form>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-[#1F2A24]/10 bg-white">
                        <table className="min-w-full divide-y divide-[#1F2A24]/10 text-sm">
                            <thead className="bg-[#2F6F4E]/5">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-[#1F2A24]/70">
                                        Account
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-[#1F2A24]/70">
                                        Applications
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-[#1F2A24]/70">
                                        Registered
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-[#1F2A24]/70">
                                        Review
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-[#1F2A24]/70">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#1F2A24]/10">
                                {accounts.data.map((account) => (
                                    <tr
                                        key={account.id}
                                        className="align-top hover:bg-[#2F6F4E]/5"
                                    >
                                        <td className="px-4 py-3 text-[#1F2A24]">
                                            <span className="block font-medium">
                                                {account.name}
                                            </span>
                                            <span className="mt-0.5 block w-fit rounded-full bg-[#2F6F4E]/10 px-2 py-0.5 text-xs font-medium text-[#2F6F4E]">
                                                {account.account_type
                                                    ? ACCOUNT_TYPE_LABELS[
                                                          account.account_type
                                                      ]
                                                    : 'Type not given'}
                                            </span>
                                            <span className="block text-[#1F2A24]/70">
                                                {account.email}
                                            </span>
                                            {account.email_verified_at ? (
                                                <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-[#2F6F4E]/10 px-2 py-0.5 text-xs font-medium text-[#2F6F4E]">
                                                    <MailCheck
                                                        className="h-3 w-3"
                                                        aria-hidden="true"
                                                    />
                                                    Email confirmed
                                                </span>
                                            ) : (
                                                <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-[#E8A33D]/15 px-2 py-0.5 text-xs font-medium text-[#a4670f]">
                                                    <MailWarning
                                                        className="h-3 w-3"
                                                        aria-hidden="true"
                                                    />
                                                    Email not confirmed
                                                </span>
                                            )}
                                            {account.has_valid_id ? (
                                                <a
                                                    href={route(
                                                        'admin.enrollee-accounts.valid-id.show',
                                                        account.id,
                                                    )}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[#2F6F4E] hover:underline"
                                                >
                                                    <IdCard
                                                        className="h-3.5 w-3.5"
                                                        aria-hidden="true"
                                                    />
                                                    View valid ID
                                                    <span className="sr-only">
                                                        (opens in a new tab)
                                                    </span>
                                                </a>
                                            ) : (
                                                <span className="mt-1 block w-fit rounded-full bg-[#1F2A24]/5 px-2 py-0.5 text-xs font-medium text-[#1F2A24]/65">
                                                    No ID on file
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-[#1F2A24]/70">
                                            {account.enrollments.length ===
                                            0 ? (
                                                '—'
                                            ) : (
                                                <ul className="space-y-1">
                                                    {account.enrollments.map(
                                                        (enrollment) => (
                                                            <li
                                                                key={
                                                                    enrollment.id
                                                                }
                                                            >
                                                                <Link
                                                                    href={route(
                                                                        'admin.enrollments.show',
                                                                        enrollment.id,
                                                                    )}
                                                                    className="font-medium text-[#2F6F4E] hover:underline"
                                                                >
                                                                    {
                                                                        enrollment
                                                                            .student
                                                                            ?.first_name
                                                                    }{' '}
                                                                    {
                                                                        enrollment
                                                                            .student
                                                                            ?.last_name
                                                                    }
                                                                </Link>{' '}
                                                                <span className="text-xs">
                                                                    ·{' '}
                                                                    {enrollment
                                                                        .grade_level
                                                                        ?.name ??
                                                                        '—'}{' '}
                                                                    ·{' '}
                                                                    {
                                                                        enrollment.school_year
                                                                    }
                                                                </span>
                                                            </li>
                                                        ),
                                                    )}
                                                </ul>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-[#1F2A24]/70">
                                            {formatDate(account.created_at)}
                                        </td>
                                        <td className="px-4 py-3 text-[#1F2A24]/70">
                                            {account.reviewed_at ? (
                                                <>
                                                    <span className="block whitespace-nowrap">
                                                        {formatDate(
                                                            account.reviewed_at,
                                                        )}
                                                        {account.reviewer &&
                                                            ` by ${account.reviewer.name}`}
                                                    </span>
                                                    {account.account_status ===
                                                        'PENDING' && (
                                                        <span className="mt-1 block w-fit rounded-full bg-[#E8A33D]/15 px-2 py-0.5 text-xs font-medium text-[#a4670f]">
                                                            New ID sent — review
                                                            again
                                                        </span>
                                                    )}
                                                    {account.rejection_reasons
                                                        ?.length ? (
                                                        <ul className="mt-1 max-w-xs list-disc pl-4 text-xs">
                                                            {account.rejection_reasons.map(
                                                                (reason) => (
                                                                    <li
                                                                        key={
                                                                            reason
                                                                        }
                                                                    >
                                                                        {reasonLabels[
                                                                            reason
                                                                        ] ??
                                                                            reason}
                                                                    </li>
                                                                ),
                                                            )}
                                                        </ul>
                                                    ) : null}
                                                    {account.rejection_reason && (
                                                        <span className="mt-1 block max-w-xs text-xs italic">
                                                            “
                                                            {
                                                                account.rejection_reason
                                                            }
                                                            ”
                                                        </span>
                                                    )}
                                                </>
                                            ) : (
                                                'Not reviewed yet'
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-2">
                                                {account.account_status !==
                                                    'APPROVED' &&
                                                    (account.email_verified_at ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                approve(account)
                                                            }
                                                            className="min-h-9 rounded-full bg-[#2F6F4E] px-4 text-xs font-semibold text-white hover:bg-[#25573E]"
                                                        >
                                                            Approve
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            disabled
                                                            aria-describedby={`approve-blocked-${account.id}`}
                                                            title="Can't approve until the email is confirmed"
                                                            className="min-h-9 cursor-not-allowed rounded-full bg-[#1F2A24]/10 px-4 text-xs font-semibold text-[#1F2A24]/45"
                                                        >
                                                            Approve
                                                        </button>
                                                    ))}
                                                {account.account_status !==
                                                    'REJECTED' && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openReject(account)
                                                        }
                                                        className="min-h-9 rounded-full border border-[#C6473B]/40 px-4 text-xs font-semibold text-[#C6473B] hover:bg-[#C6473B]/5"
                                                    >
                                                        {account.account_status ===
                                                        'APPROVED'
                                                            ? 'Revoke'
                                                            : 'Reject'}
                                                    </button>
                                                )}
                                            </div>
                                            {account.account_status !==
                                                'APPROVED' &&
                                                !account.email_verified_at && (
                                                    <p
                                                        id={`approve-blocked-${account.id}`}
                                                        className="mt-1.5 max-w-[12rem] text-xs leading-snug text-[#a4670f]"
                                                    >
                                                        Can't approve yet —
                                                        waiting for them to
                                                        confirm their email.
                                                    </p>
                                                )}
                                        </td>
                                    </tr>
                                ))}

                                {accounts.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-4 py-8 text-center text-[#1F2A24]/65"
                                        >
                                            No accounts found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        {accounts.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url ?? '#'}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                preserveScroll
                                className={`rounded-full border px-3 py-1.5 text-sm ${
                                    link.active
                                        ? 'border-[#2F6F4E] bg-[#2F6F4E] text-white'
                                        : 'border-[#1F2A24]/10 bg-white text-[#1F2A24]/70 hover:bg-[#1F2A24]/5'
                                } ${!link.url ? 'pointer-events-none opacity-40' : ''}`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {rejecting && (
                <RejectAccountDialog
                    key={rejecting.id}
                    account={rejecting}
                    reasons={rejectionReasons}
                    open={isRejecting}
                    onOpenChange={setIsRejecting}
                />
            )}
        </>
    );
}
