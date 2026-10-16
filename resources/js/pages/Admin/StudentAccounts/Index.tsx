import { Head, Link, router, usePage, setLayoutProps } from '@inertiajs/react';
import { useState } from 'react';
import StudentAccountActions from '@/components/student-account-actions';
import type { StudentAccountSummary } from '@/components/student-account-actions';
import { cn } from '@/lib/utils';
import { show as showEnrollment } from '@/routes/admin/enrollments';
import {
    index as studentAccountsIndex,
    show as showStudentAccount,
} from '@/routes/admin/student-accounts';

type StudentRow = {
    id: number;
    name: string;
    lrn: string | null;
    grade_level: string | null;
    school_year: string | null;
    /** The latest approved application, linked for details. */
    enrollment_id: number | null;
    account: StudentAccountSummary;
};

type StatusOption = { value: string; label: string; count: number };

type PaginationLink = { url: string | null; label: string; active: boolean };

type Props = {
    students: { data: StudentRow[]; links: PaginationLink[] };
    statuses: StatusOption[];
    filters: { status: string; search: string };
};

const STATUS_BADGES: Record<
    NonNullable<StudentAccountSummary['status']>,
    string
> = {
    AWAITING_CONSENT: 'bg-warn/15 text-warn-ink',
    CONSENT_GIVEN: 'bg-brand/10 text-brand-ink',
    ACTIVE: 'bg-brand text-white',
    DECLINED: 'bg-danger/10 text-danger-deep',
};

function StatusBadge({ account }: { account: StudentAccountSummary }) {
    return (
        <span
            className={cn(
                'inline-block w-fit rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap',
                account.status
                    ? STATUS_BADGES[account.status]
                    : 'bg-ink/5 text-ink/60',
            )}
        >
            {account.status_label ?? 'No account yet'}
        </span>
    );
}

/** Opens the account's details and password reset, once there's an account. */
function ViewAccountLink({ student }: { student: StudentRow }) {
    if (student.account.id === null) {
        return null;
    }

    return (
        <Link
            href={showStudentAccount.url(student.account.id)}
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-ink/15 bg-surface px-4 text-sm font-semibold whitespace-nowrap text-ink/80 hover:bg-ink/5"
        >
            View
            <span className="sr-only"> {student.name}'s account</span>
        </Link>
    );
}

/** Who consented or was asked, and anything stopping the next step. */
function StatusNote({ account }: { account: StudentAccountSummary }) {
    const note =
        account.status === 'AWAITING_CONSENT'
            ? `Emailed ${account.consent_email}`
            : account.consent_given_by &&
                (account.status === 'CONSENT_GIVEN' ||
                    account.status === 'ACTIVE')
              ? `Consent from ${account.consent_given_by}`
              : account.status === 'DECLINED' && account.consent_given_by
                ? `Declined by ${account.consent_given_by}`
                : null;

    return (
        <>
            {note && (
                <p className="mt-1 text-xs break-all text-ink/55">{note}</p>
            )}
            {account.blocker && account.status !== 'ACTIVE' && (
                <p className="mt-1 text-xs text-warn-ink">{account.blocker}</p>
            )}
        </>
    );
}

/**
 * Every student with an approved application and their sign-in account,
 * bound to their LRN: ask the parent for consent, then create the account.
 */
export default function Index({ students, statuses, filters }: Props) {
    const { props } = usePage<{
        flash?: { success?: string };
        errors?: { account?: string };
    }>();
    const [search, setSearch] = useState(filters.search);

    const applyFilters = (overrides: Partial<Props['filters']> = {}) => {
        router.get(
            studentAccountsIndex.url(),
            { status: filters.status, search, ...overrides },
            { preserveState: true, replace: true },
        );
    };

    const renderClass = (student: StudentRow) =>
        student.grade_level
            ? `${student.grade_level}${student.school_year ? ` · SY ${student.school_year}` : ''}`
            : '—';

    const renderName = (student: StudentRow) =>
        student.enrollment_id ? (
            <Link
                href={showEnrollment(student.enrollment_id).url}
                className="font-medium text-ink hover:text-brand-ink hover:underline"
            >
                {student.name}
            </Link>
        ) : (
            <span className="font-medium text-ink">{student.name}</span>
        );
    setLayoutProps({
        title: 'Student Accounts',
        help: "Students sign in with their LRN to see their grades. Ask a parent or guardian for consent, then create the account once they agree. The first password is the student's LRN.",
    });

    return (
        <>
            <Head title="Student Accounts" />

            <div className="bg-cream px-4 py-8">
                <div className="mx-auto max-w-6xl">
                    {props.flash?.success && (
                        <div
                            role="status"
                            className="mb-4 rounded-xl border border-brand/25 bg-brand/5 px-4 py-3 text-sm text-brand-ink"
                        >
                            {props.flash.success}
                        </div>
                    )}

                    {props.errors?.account && (
                        <div
                            role="alert"
                            className="mb-4 rounded-xl border border-danger/25 bg-danger/5 px-4 py-3 text-sm text-danger-deep"
                        >
                            {props.errors.account}
                        </div>
                    )}

                    <div
                        role="tablist"
                        aria-label="Account status"
                        className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0"
                    >
                        {statuses.map((status) => {
                            const isActive = filters.status === status.value;

                            return (
                                <button
                                    key={status.value}
                                    type="button"
                                    role="tab"
                                    aria-selected={isActive}
                                    onClick={() =>
                                        applyFilters({ status: status.value })
                                    }
                                    className={cn(
                                        'min-h-10 shrink-0 rounded-full border px-4 text-sm font-medium whitespace-nowrap',
                                        isActive
                                            ? 'border-brand bg-brand text-white'
                                            : 'border-ink/10 bg-surface text-ink/70 hover:bg-ink/5',
                                    )}
                                >
                                    {status.label}{' '}
                                    <span className="tabular-nums opacity-80">
                                        ({status.count})
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="mb-4 rounded-2xl border border-ink/10 bg-surface p-4">
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
                                aria-label="Search students by name or LRN"
                                placeholder="Search by name or LRN..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="min-h-11 w-full min-w-0 flex-1 rounded-lg border border-ink/15 bg-surface px-3 py-2 text-sm text-ink focus:border-brand focus:ring-2 focus:ring-brand/30 focus:outline-none sm:min-h-10 sm:w-auto sm:min-w-[200px]"
                            />
                            <button
                                type="submit"
                                className="min-h-11 w-full rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-deep sm:min-h-10 sm:w-auto"
                            >
                                Search
                            </button>
                        </form>
                    </div>

                    {students.data.length === 0 ? (
                        <p className="rounded-2xl border border-ink/10 bg-surface px-4 py-10 text-center text-sm text-ink/60">
                            No students here.
                        </p>
                    ) : (
                        <>
                            {/* Cards (phones) */}
                            <ul className="space-y-3 md:hidden">
                                {students.data.map((student) => (
                                    <li
                                        key={student.id}
                                        className="rounded-2xl border border-ink/10 bg-surface p-4"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                {renderName(student)}
                                                <p className="text-sm text-ink/65 tabular-nums">
                                                    LRN {student.lrn ?? '—'}
                                                </p>
                                                <p className="text-xs text-ink/55">
                                                    {renderClass(student)}
                                                </p>
                                            </div>
                                            <StatusBadge
                                                account={student.account}
                                            />
                                        </div>
                                        <StatusNote account={student.account} />
                                        <div className="mt-3 flex gap-2 [&>button]:flex-1">
                                            <StudentAccountActions
                                                studentId={student.id}
                                                studentName={student.name}
                                                account={student.account}
                                            />
                                            <ViewAccountLink
                                                student={student}
                                            />
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            {/* Table (tablets and up) */}
                            <div className="hidden overflow-x-auto rounded-2xl border border-ink/10 bg-surface md:block">
                                <table className="min-w-full divide-y divide-ink/10 text-sm">
                                    <thead className="bg-brand/5">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-semibold text-ink/70">
                                                Student
                                            </th>
                                            <th className="px-4 py-3 text-left font-semibold text-ink/70">
                                                LRN
                                            </th>
                                            <th className="px-4 py-3 text-left font-semibold text-ink/70">
                                                Class
                                            </th>
                                            <th className="px-4 py-3 text-left font-semibold text-ink/70">
                                                Account
                                            </th>
                                            <th className="px-4 py-3 text-left font-semibold text-ink/70">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-ink/10">
                                        {students.data.map((student) => (
                                            <tr
                                                key={student.id}
                                                className="align-middle hover:bg-brand/5"
                                            >
                                                <td className="px-4 py-3">
                                                    {renderName(student)}
                                                </td>
                                                <td className="px-4 py-3 text-ink/75 tabular-nums">
                                                    {student.lrn ?? '—'}
                                                </td>
                                                <td className="px-4 py-3 text-ink/75">
                                                    {renderClass(student)}
                                                </td>
                                                <td className="max-w-xs px-4 py-3">
                                                    <StatusBadge
                                                        account={
                                                            student.account
                                                        }
                                                    />
                                                    <StatusNote
                                                        account={
                                                            student.account
                                                        }
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <StudentAccountActions
                                                            studentId={
                                                                student.id
                                                            }
                                                            studentName={
                                                                student.name
                                                            }
                                                            account={
                                                                student.account
                                                            }
                                                            size="compact"
                                                        />
                                                        <ViewAccountLink
                                                            student={student}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    <div className="mt-6 flex flex-wrap justify-center gap-1">
                        {students.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url ?? '#'}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                preserveScroll
                                className={cn(
                                    'inline-flex min-h-10 min-w-10 items-center justify-center rounded-full border px-3 py-1.5 text-sm',
                                    link.active
                                        ? 'border-brand bg-brand text-white'
                                        : 'border-ink/10 bg-surface text-ink/70 hover:bg-ink/5',
                                    !link.url &&
                                        'pointer-events-none opacity-40',
                                )}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
