import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Check,
    Copy,
    KeyRound,
    RotateCcw,
    ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { useClipboard } from '@/hooks/use-clipboard';
import { useConfirm } from '@/hooks/use-confirm';
import { show as showEnrollment } from '@/routes/admin/enrollments';
import { index as studentAccountsIndex } from '@/routes/admin/student-accounts';
import { update as resetPassword } from '@/routes/admin/student-accounts/password';

type PasswordStatus = {
    value: 'RESET' | 'STARTING' | 'CHANGED';
    label: string;
};

type Props = {
    account: {
        id: number;
        status: 'AWAITING_CONSENT' | 'CONSENT_GIVEN' | 'ACTIVE' | 'DECLINED';
        status_label: string;
        /** Where the password stands; null until the account is active. */
        password_status: PasswordStatus | null;
        consent_email: string;
        consent_requested_at: string | null;
        consent_requested_by: string | null;
        consent_given_by: string | null;
        consent_responded_at: string | null;
    };
    student: {
        id: number;
        name: string;
        lrn: string | null;
        grade_level: string | null;
        school_year: string | null;
        enrollment_id: number | null;
    };
    passwordResets: {
        id: number;
        at: string | null;
        by: string | null;
        details: string | null;
    }[];
    /** Only right after a reset to a temporary password; gone on reload. */
    temporaryPassword: string | null;
};

const PASSWORD_STATUS_STYLES: Record<PasswordStatus['value'], string> = {
    RESET: 'bg-[#E8A33D]/15 text-[#7a4d0b]',
    STARTING: 'bg-[#E8A33D]/15 text-[#7a4d0b]',
    CHANGED: 'bg-[#2F6F4E]/10 text-[#2F6F4E]',
};

function formatDateTime(value: string | null): string | null {
    return value
        ? new Date(value).toLocaleString('en-PH', {
              dateStyle: 'medium',
              timeStyle: 'short',
          })
        : null;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="rounded-2xl border border-[#1F2A24]/10 bg-white p-5">
            <h2 className="mb-3 text-xs font-semibold tracking-[0.1em] text-[#2F6F4E] uppercase">
                {title}
            </h2>
            {children}
        </section>
    );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div className="flex flex-col gap-0.5 border-b border-[#1F2A24]/5 py-2 last:border-0 sm:flex-row sm:gap-4">
            <dt className="text-sm text-[#1F2A24]/60 sm:w-44 sm:shrink-0">
                {label}
            </dt>
            <dd className="text-sm font-medium text-[#1F2A24]">
                {value ?? <span className="text-[#1F2A24]/40">—</span>}
            </dd>
        </div>
    );
}

/** A temporary password shown once, with a button to copy it. */
function TemporaryPassword({ password }: { password: string }) {
    const [copiedText, copy] = useClipboard();
    const isCopied = copiedText === password;

    return (
        <div
            role="status"
            className="rounded-2xl border border-[#2F6F4E]/30 bg-[#2F6F4E]/5 p-5"
        >
            <p className="text-sm font-semibold text-[#1F2A24]">
                Temporary password
            </p>
            <p className="mt-1 text-sm text-[#1F2A24]/70">
                Give this to the student or their parent now. It won't be shown
                again, and the student must change it when they sign in.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
                <code className="rounded-lg border border-[#1F2A24]/15 bg-white px-4 py-2 font-mono text-lg tracking-wider text-[#1F2A24] select-all">
                    {password}
                </code>
                <button
                    type="button"
                    onClick={() => copy(password)}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#2F6F4E]/30 bg-white px-4 text-sm font-semibold text-[#2F6F4E] hover:bg-[#2F6F4E]/5"
                >
                    {isCopied ? (
                        <Check className="h-4 w-4" aria-hidden="true" />
                    ) : (
                        <Copy className="h-4 w-4" aria-hidden="true" />
                    )}
                    {isCopied ? 'Copied' : 'Copy'}
                </button>
            </div>
        </div>
    );
}

export default function Show({
    account,
    student,
    passwordResets,
    temporaryPassword,
}: Props) {
    const { props } = usePage<{ flash?: { success?: string } }>();
    const errors = usePage().props.errors as Record<string, string>;
    const [confirm, confirmDialog] = useConfirm();
    const [processing, setProcessing] = useState(false);

    const isActive = account.status === 'ACTIVE';

    const reset = async (method: 'LRN' | 'TEMPORARY') => {
        const confirmed = await confirm(
            method === 'LRN'
                ? {
                      title: `Reset ${student.name}'s password to their LRN?`,
                      description:
                          'Their current password stops working. They sign in with their LRN as the password and must choose a new one.',
                      confirmLabel: 'Reset to LRN',
                  }
                : {
                      title: `Give ${student.name} a temporary password?`,
                      description:
                          'Their current password stops working. You will see the temporary password once, to pass on to them; they must change it when they sign in.',
                      confirmLabel: 'Create temporary password',
                  },
        );

        if (!confirmed) {
            return;
        }

        router.put(
            resetPassword.url(account.id),
            { method },
            {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <>
            <Head title={`${student.name} · Student Account`} />
            {confirmDialog}

            <div className="bg-[#FBF8F2] px-4 py-8">
                <div className="mx-auto max-w-3xl space-y-4">
                    <Link
                        href={studentAccountsIndex.url()}
                        className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-[#1F2A24]/70 hover:text-[#1F2A24]"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Student Accounts
                    </Link>

                    <div>
                        <h1 className="font-serif text-2xl font-semibold text-[#1F2A24]">
                            {student.name}
                        </h1>
                        <p className="text-sm text-[#1F2A24]/70">
                            Student account · {account.status_label}
                        </p>
                    </div>

                    {props.flash?.success && (
                        <div
                            role="status"
                            className="rounded-xl border border-[#2F6F4E]/25 bg-[#2F6F4E]/5 px-4 py-3 text-sm text-[#2F6F4E]"
                        >
                            {props.flash.success}
                        </div>
                    )}
                    {errors?.password && (
                        <div
                            role="alert"
                            className="rounded-xl border border-[#C6473B]/30 bg-[#C6473B]/5 px-4 py-3 text-sm text-[#A3372D]"
                        >
                            {errors.password}
                        </div>
                    )}

                    {temporaryPassword && (
                        <TemporaryPassword password={temporaryPassword} />
                    )}

                    <Section title="Student">
                        <dl>
                            <InfoRow label="Name" value={student.name} />
                            <InfoRow
                                label="LRN (sign-in ID)"
                                value={
                                    student.lrn && (
                                        <span className="tabular-nums">
                                            {student.lrn}
                                        </span>
                                    )
                                }
                            />
                            <InfoRow
                                label="Class"
                                value={
                                    student.grade_level &&
                                    `${student.grade_level}${student.school_year ? ` · SY ${student.school_year}` : ''}`
                                }
                            />
                            {student.enrollment_id && (
                                <InfoRow
                                    label="Application"
                                    value={
                                        <Link
                                            href={showEnrollment.url(
                                                student.enrollment_id,
                                            )}
                                            className="text-[#2F6F4E] underline-offset-2 hover:underline"
                                        >
                                            Open application
                                        </Link>
                                    }
                                />
                            )}
                        </dl>
                    </Section>

                    <Section title="Account">
                        <dl>
                            <InfoRow
                                label="Status"
                                value={account.status_label}
                            />
                            <InfoRow
                                label="Parent's email"
                                value={account.consent_email}
                            />
                            <InfoRow
                                label="Consent asked"
                                value={
                                    formatDateTime(
                                        account.consent_requested_at,
                                    ) &&
                                    `${formatDateTime(account.consent_requested_at)}${account.consent_requested_by ? ` by ${account.consent_requested_by}` : ''}`
                                }
                            />
                            <InfoRow
                                label="Parent answered"
                                value={
                                    formatDateTime(
                                        account.consent_responded_at,
                                    ) &&
                                    `${formatDateTime(account.consent_responded_at)}${account.consent_given_by ? ` · ${account.consent_given_by}` : ''}`
                                }
                            />
                        </dl>
                    </Section>

                    <Section title="Password">
                        {account.password_status ? (
                            <>
                                <span
                                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${PASSWORD_STATUS_STYLES[account.password_status.value]}`}
                                >
                                    <ShieldCheck
                                        className="h-3.5 w-3.5"
                                        aria-hidden="true"
                                    />
                                    {account.password_status.label}
                                </span>
                                <p className="mt-3 text-sm text-[#1F2A24]/70">
                                    Passwords are stored hashed (scrambled one
                                    way), so nobody at the school can see them.
                                    If the student forgot theirs, reset it
                                    below.
                                </p>
                            </>
                        ) : (
                            <p className="text-sm text-[#1F2A24]/70">
                                The student gets a password once the account is
                                created.
                            </p>
                        )}

                        {isActive && (
                            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                                <button
                                    type="button"
                                    disabled={processing}
                                    onClick={() => reset('LRN')}
                                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#2F6F4E]/30 bg-white px-5 text-sm font-semibold text-[#2F6F4E] hover:bg-[#2F6F4E]/5 disabled:opacity-50"
                                >
                                    <RotateCcw
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                    />
                                    Reset to LRN
                                </button>
                                <button
                                    type="button"
                                    disabled={processing}
                                    onClick={() => reset('TEMPORARY')}
                                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#2F6F4E] px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#25573E] disabled:opacity-50"
                                >
                                    <KeyRound
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                    />
                                    Create temporary password
                                </button>
                            </div>
                        )}

                        {passwordResets.length > 0 && (
                            <div className="mt-5 border-t border-[#1F2A24]/10 pt-4">
                                <h3 className="mb-2 text-sm font-semibold text-[#1F2A24]/80">
                                    Recent resets
                                </h3>
                                <ul className="space-y-1 text-sm text-[#1F2A24]/70">
                                    {passwordResets.map((entry) => (
                                        <li key={entry.id}>
                                            {formatDateTime(entry.at)}
                                            {entry.by && ` · ${entry.by}`}
                                            {entry.details &&
                                                ` · ${entry.details}`}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </Section>
                </div>
            </div>
        </>
    );
}
