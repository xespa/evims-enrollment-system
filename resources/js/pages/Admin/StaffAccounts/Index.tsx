import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Loader2, MailPlus, Send, UserPlus } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import AdminAvatar from '@/components/admin-avatar';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useConfirm } from '@/hooks/use-confirm';
import staffAccountRoutes from '@/routes/admin/staff-accounts';

type StaffStatus = 'active' | 'invited' | 'deactivated';

type StaffAccount = {
    id: number;
    name: string;
    email: string;
    role: string;
    profile_photo_url: string | null;
    status: StaffStatus;
    invited_at: string | null;
    deactivated_at: string | null;
};

type RoleOption = { value: string; label: string; description: string };

type Props = {
    staffAccounts: StaffAccount[];
    roles: RoleOption[];
};

const STATUS_BADGES: Record<StaffStatus, { label: string; className: string }> =
    {
        active: {
            label: 'Active',
            className: 'bg-[#2F6F4E]/10 text-[#2F6F4E]',
        },
        invited: {
            label: 'Invitation pending',
            className: 'bg-[#E8A33D]/15 text-[#a4670f]',
        },
        deactivated: {
            label: 'Deactivated',
            className: 'bg-[#1F2A24]/5 text-[#1F2A24]/60',
        },
    };

const inputClass =
    'min-h-11 w-full rounded-lg border border-[#1F2A24]/15 bg-white px-3 py-2 text-base text-[#1F2A24] focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none aria-[invalid=true]:border-[#C6473B] sm:text-sm';

function formatDate(value: string): string {
    return new Date(value).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function StatusBadge({ account }: { account: StaffAccount }) {
    const badge = STATUS_BADGES[account.status];

    return (
        <span
            className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${badge.className}`}
        >
            {badge.label}
        </span>
    );
}

/**
 * Invites a staff member by email. The person sets their own password from
 * the link, so no password is ever chosen or seen here.
 */
function InviteStaffDialog({
    roles,
    open,
    onOpenChange,
}: {
    roles: RoleOption[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({ name: '', email: '', role: 'TEACHER' });

    const selectedRole = roles.find((role) => role.value === data.role);

    const close = (isOpen: boolean) => {
        if (!isOpen) {
            reset();
            clearErrors();
        }
        onOpenChange(isOpen);
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(staffAccountRoutes.store.url(), {
            preserveScroll: true,
            onSuccess: () => close(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={close}>
            <DialogContent className="rounded-2xl border-[#1F2A24]/10 bg-white p-0 text-[#1F2A24] sm:max-w-md">
                <form onSubmit={submit}>
                    <DialogHeader className="border-b border-[#1F2A24]/10 px-6 py-5 pr-12 text-left">
                        <DialogTitle className="font-serif text-xl font-semibold">
                            Invite staff
                        </DialogTitle>
                        <DialogDescription className="text-[#1F2A24]/70">
                            They'll get an email with a link to set their own
                            password. The link works once and expires in 48
                            hours.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 px-6 py-5">
                        <div>
                            <label
                                htmlFor="invite-name"
                                className="mb-1 block text-sm font-medium text-[#1F2A24]/80"
                            >
                                Full name
                            </label>
                            <input
                                id="invite-name"
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                autoComplete="off"
                                aria-invalid={!!errors.name}
                                className={inputClass}
                            />
                            {errors.name && (
                                <p className="mt-1 text-xs text-[#C6473B]">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="invite-email"
                                className="mb-1 block text-sm font-medium text-[#1F2A24]/80"
                            >
                                Email address
                            </label>
                            <input
                                id="invite-email"
                                type="email"
                                value={data.email}
                                onChange={(e) =>
                                    setData('email', e.target.value)
                                }
                                autoComplete="off"
                                aria-invalid={!!errors.email}
                                className={inputClass}
                            />
                            {errors.email && (
                                <p className="mt-1 text-xs text-[#C6473B]">
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="invite-role"
                                className="mb-1 block text-sm font-medium text-[#1F2A24]/80"
                            >
                                Role
                            </label>
                            <select
                                id="invite-role"
                                value={data.role}
                                onChange={(e) =>
                                    setData('role', e.target.value)
                                }
                                aria-invalid={!!errors.role}
                                aria-describedby="invite-role-description"
                                className={inputClass}
                            >
                                {roles.map((role) => (
                                    <option key={role.value} value={role.value}>
                                        {role.label}
                                    </option>
                                ))}
                            </select>
                            {errors.role ? (
                                <p className="mt-1 text-xs text-[#C6473B]">
                                    {errors.role}
                                </p>
                            ) : (
                                <p
                                    id="invite-role-description"
                                    className="mt-1 text-xs text-[#1F2A24]/60"
                                >
                                    {selectedRole?.description}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col-reverse gap-2 border-t border-[#1F2A24]/10 px-6 py-4 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={() => close(false)}
                            className="min-h-11 rounded-full border border-[#1F2A24]/15 px-5 text-sm font-semibold text-[#1F2A24]/80 hover:bg-[#1F2A24]/5"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#2F6F4E] px-5 text-sm font-semibold text-white hover:bg-[#25573E] disabled:opacity-60"
                        >
                            {processing ? (
                                <Loader2
                                    className="size-4 animate-spin"
                                    aria-hidden="true"
                                />
                            ) : (
                                <Send className="size-4" aria-hidden="true" />
                            )}
                            Send invitation
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function Index({ staffAccounts, roles }: Props) {
    const { props } = usePage<{
        flash?: { success?: string };
        errors?: { staff_account?: string; role?: string };
    }>();
    const currentUserId = props.auth.user.id;
    const [confirm, confirmDialog] = useConfirm();
    const [isInviting, setIsInviting] = useState(false);

    const roleLabel = (value: string) =>
        roles.find((role) => role.value === value)?.label ?? value;

    const changeRole = async (account: StaffAccount, role: string) => {
        const confirmed = await confirm({
            title: `Make ${account.name} a ${roleLabel(role)}?`,
            description: roles.find((option) => option.value === role)
                ?.description,
            confirmLabel: 'Change Role',
        });
        if (!confirmed) {
            return;
        }
        router.patch(
            staffAccountRoutes.update.url(account.id),
            { role },
            { preserveScroll: true },
        );
    };

    const deactivate = async (account: StaffAccount) => {
        const confirmed = await confirm({
            title: `Deactivate ${account.name}'s account?`,
            description:
                "They'll be signed out everywhere right away and won't be able to sign in. You can reactivate the account later.",
            confirmLabel: 'Deactivate',
            destructive: true,
        });
        if (!confirmed) {
            return;
        }
        router.post(
            staffAccountRoutes.deactivation.store.url(account.id),
            {},
            { preserveScroll: true },
        );
    };

    const reactivate = (account: StaffAccount) => {
        router.delete(staffAccountRoutes.deactivation.destroy.url(account.id), {
            preserveScroll: true,
        });
    };

    const resendInvitation = (account: StaffAccount) => {
        router.post(
            staffAccountRoutes.invitation.store.url(account.id),
            {},
            { preserveScroll: true },
        );
    };

    const renderRole = (account: StaffAccount, id: string) =>
        account.id === currentUserId ? (
            <span className="text-sm text-[#1F2A24]/80">
                {roleLabel(account.role)}
            </span>
        ) : (
            <>
                <label htmlFor={id} className="sr-only">
                    Role for {account.name}
                </label>
                <select
                    id={id}
                    value={account.role}
                    disabled={account.status === 'deactivated'}
                    onChange={(e) => changeRole(account, e.target.value)}
                    className="min-h-10 w-full rounded-lg border border-[#1F2A24]/15 bg-white px-3 py-1.5 text-sm text-[#1F2A24] focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none disabled:opacity-60 sm:w-auto"
                >
                    {roles.map((role) => (
                        <option key={role.value} value={role.value}>
                            {role.label}
                        </option>
                    ))}
                </select>
            </>
        );

    const renderActions = (account: StaffAccount, isStacked: boolean) => {
        if (account.id === currentUserId) {
            return null;
        }

        const size = isStacked
            ? 'min-h-11 flex-1 px-4 text-sm'
            : 'min-h-9 px-4 text-xs';

        return (
            <div className="flex flex-wrap gap-2">
                {account.status === 'invited' && (
                    <button
                        type="button"
                        onClick={() => resendInvitation(account)}
                        className={`${size} inline-flex items-center justify-center gap-1.5 rounded-full border border-[#2F6F4E]/30 font-semibold text-[#2F6F4E] hover:bg-[#2F6F4E]/5`}
                    >
                        <MailPlus className="size-3.5" aria-hidden="true" />
                        Resend invite
                    </button>
                )}
                {account.status === 'deactivated' ? (
                    <button
                        type="button"
                        onClick={() => reactivate(account)}
                        className={`${size} rounded-full bg-[#2F6F4E] font-semibold text-white hover:bg-[#25573E]`}
                    >
                        Reactivate
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={() => deactivate(account)}
                        className={`${size} rounded-full border border-[#C6473B]/40 font-semibold text-[#C6473B] hover:bg-[#C6473B]/5`}
                    >
                        Deactivate
                    </button>
                )}
            </div>
        );
    };

    const renderIdentity = (account: StaffAccount) => (
        <div className="flex min-w-0 items-center gap-3">
            <AdminAvatar
                name={account.name}
                photoUrl={account.profile_photo_url}
                className={`size-9 text-xs ${account.status === 'deactivated' ? 'opacity-50' : ''}`}
            />
            <div className="min-w-0">
                <p className="font-medium break-words text-[#1F2A24]">
                    {account.name}
                    {account.id === currentUserId && (
                        <span className="ml-1.5 text-xs font-normal text-[#1F2A24]/55">
                            (you)
                        </span>
                    )}
                </p>
                <p className="text-sm break-all text-[#1F2A24]/65">
                    {account.email}
                </p>
            </div>
        </div>
    );

    const statusNote = (account: StaffAccount) =>
        account.status === 'invited' && account.invited_at
            ? `Invited ${formatDate(account.invited_at)}`
            : account.status === 'deactivated' && account.deactivated_at
              ? `Since ${formatDate(account.deactivated_at)}`
              : null;

    const errorMessage = props.errors?.staff_account ?? props.errors?.role;

    return (
        <>
            <Head title="Staff Accounts" />
            {confirmDialog}
            <InviteStaffDialog
                roles={roles}
                open={isInviting}
                onOpenChange={setIsInviting}
            />

            <div className="bg-[#FBF8F2] px-4 py-8">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <h1 className="font-serif text-2xl font-semibold text-[#1F2A24]">
                                Staff Accounts
                            </h1>
                            <p className="text-sm text-[#1F2A24]/70">
                                Invite staff, choose what they can do, and
                                deactivate accounts that are no longer needed.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsInviting(true)}
                            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#2F6F4E] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#25573E] sm:w-auto"
                        >
                            <UserPlus className="size-4" aria-hidden="true" />
                            Invite staff
                        </button>
                    </div>

                    {props.flash?.success && (
                        <div
                            role="status"
                            className="mb-4 rounded-xl border border-[#2F6F4E]/25 bg-[#2F6F4E]/5 px-4 py-3 text-sm text-[#2F6F4E]"
                        >
                            {props.flash.success}
                        </div>
                    )}

                    {errorMessage && (
                        <div
                            role="alert"
                            className="mb-4 rounded-xl border border-[#C6473B]/25 bg-[#C6473B]/5 px-4 py-3 text-sm text-[#9A3329]"
                        >
                            {errorMessage}
                        </div>
                    )}

                    {/* Cards (phones) */}
                    <ul className="space-y-3 md:hidden">
                        {staffAccounts.map((account) => (
                            <li
                                key={account.id}
                                className="rounded-2xl border border-[#1F2A24]/10 bg-white p-4"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    {renderIdentity(account)}
                                    <StatusBadge account={account} />
                                </div>
                                <div className="mt-4 grid gap-3 border-t border-[#1F2A24]/10 pt-3 text-sm">
                                    <div>
                                        <p className="mb-1 text-xs text-[#1F2A24]/55">
                                            Role
                                        </p>
                                        {renderRole(
                                            account,
                                            `card-role-${account.id}`,
                                        )}
                                    </div>
                                    {statusNote(account) && (
                                        <p className="text-xs text-[#1F2A24]/55">
                                            {statusNote(account)}
                                        </p>
                                    )}
                                </div>
                                {account.id !== currentUserId && (
                                    <div className="mt-4">
                                        {renderActions(account, true)}
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>

                    {/* Table (tablets and up) */}
                    <div className="hidden overflow-x-auto rounded-2xl border border-[#1F2A24]/10 bg-white md:block">
                        <table className="min-w-full divide-y divide-[#1F2A24]/10 text-sm">
                            <thead className="bg-[#2F6F4E]/5">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-[#1F2A24]/70">
                                        Staff member
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-[#1F2A24]/70">
                                        Role
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-[#1F2A24]/70">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-[#1F2A24]/70">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#1F2A24]/10">
                                {staffAccounts.map((account) => (
                                    <tr
                                        key={account.id}
                                        className="align-middle hover:bg-[#2F6F4E]/5"
                                    >
                                        <td className="px-4 py-3">
                                            {renderIdentity(account)}
                                        </td>
                                        <td className="px-4 py-3">
                                            {renderRole(
                                                account,
                                                `row-role-${account.id}`,
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge account={account} />
                                            {statusNote(account) && (
                                                <p className="mt-1 text-xs text-[#1F2A24]/55">
                                                    {statusNote(account)}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {renderActions(account, false)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}
