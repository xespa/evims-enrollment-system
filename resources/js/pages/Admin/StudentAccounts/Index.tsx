import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import StudentAccountActions from '@/components/student-account-actions';
import type { StudentAccountSummary } from '@/components/student-account-actions';
import { cn } from '@/lib/utils';
import { show as showEnrollment } from '@/routes/admin/enrollments';
import { index as studentAccountsIndex } from '@/routes/admin/student-accounts';

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
    AWAITING_CONSENT: 'bg-[#E8A33D]/15 text-[#a4670f]',
    CONSENT_GIVEN: 'bg-[#2F6F4E]/10 text-[#2F6F4E]',
    ACTIVE: 'bg-[#2F6F4E] text-white',
    DECLINED: 'bg-[#C6473B]/10 text-[#9A3329]',
};

function StatusBadge({ account }: { account: StudentAccountSummary }) {
    return (
        <span
            className={cn(
                'inline-block w-fit rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap',
                account.status
                    ? STATUS_BADGES[account.status]
                    : 'bg-[#1F2A24]/5 text-[#1F2A24]/60',
            )}
        >
            {account.status_label ?? 'No account yet'}
        </span>
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
                <p className="mt-1 text-xs break-all text-[#1F2A24]/55">
                    {note}
                </p>
            )}
            {account.blocker && account.status !== 'ACTIVE' && (
                <p className="mt-1 text-xs text-[#a4670f]">{account.blocker}</p>
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
                className="font-medium text-[#1F2A24] hover:text-[#2F6F4E] hover:underline"
            >
                {student.name}
            </Link>
        ) : (
            <span className="font-medium text-[#1F2A24]">{student.name}</span>
        );

    return (
        <>
            <Head title="Student Accounts" />

            <div className="bg-[#FBF8F2] px-4 py-8">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-6">
                        <h1 className="font-serif text-2xl font-semibold text-[#1F2A24]">
                            Student Accounts
                        </h1>
                        <p className="text-sm text-[#1F2A24]/70">
                            Students sign in with their LRN to see their grades.
                            Ask a parent or guardian for consent, then create
                            the account once they agree. The first password is
                            the student's LRN.
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

                    {props.errors?.account && (
                        <div
                            role="alert"
                            className="mb-4 rounded-xl border border-[#C6473B]/25 bg-[#C6473B]/5 px-4 py-3 text-sm text-[#9A3329]"
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
                                            ? 'border-[#2F6F4E] bg-[#2F6F4E] text-white'
                                            : 'border-[#1F2A24]/10 bg-white text-[#1F2A24]/70 hover:bg-[#1F2A24]/5',
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
                                aria-label="Search students by name or LRN"
                                placeholder="Search by name or LRN..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="min-h-11 w-full min-w-0 flex-1 rounded-lg border border-[#1F2A24]/15 bg-white px-3 py-2 text-sm text-[#1F2A24] focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none sm:min-h-10 sm:w-auto sm:min-w-[200px]"
                            />
                            <button
                                type="submit"
                                className="min-h-11 w-full rounded-full bg-[#2F6F4E] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#25573E] sm:min-h-10 sm:w-auto"
                            >
                                Search
                            </button>
                        </form>
                    </div>

                    {students.data.length === 0 ? (
                        <p className="rounded-2xl border border-[#1F2A24]/10 bg-white px-4 py-10 text-center text-sm text-[#1F2A24]/60">
                            No students here.
                        </p>
                    ) : (
                        <>
                            {/* Cards (phones) */}
                            <ul className="space-y-3 md:hidden">
                                {students.data.map((student) => (
                                    <li
                                        key={student.id}
                                        className="rounded-2xl border border-[#1F2A24]/10 bg-white p-4"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                {renderName(student)}
                                                <p className="text-sm text-[#1F2A24]/65 tabular-nums">
                                                    LRN {student.lrn ?? '—'}
                                                </p>
                                                <p className="text-xs text-[#1F2A24]/55">
                                                    {renderClass(student)}
                                                </p>
                                            </div>
                                            <StatusBadge
                                                account={student.account}
                                            />
                                        </div>
                                        <StatusNote account={student.account} />
                                        <div className="mt-3 flex [&>button]:flex-1">
                                            <StudentAccountActions
                                                studentId={student.id}
                                                studentName={student.name}
                                                account={student.account}
                                            />
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            {/* Table (tablets and up) */}
                            <div className="hidden overflow-x-auto rounded-2xl border border-[#1F2A24]/10 bg-white md:block">
                                <table className="min-w-full divide-y divide-[#1F2A24]/10 text-sm">
                                    <thead className="bg-[#2F6F4E]/5">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-semibold text-[#1F2A24]/70">
                                                Student
                                            </th>
                                            <th className="px-4 py-3 text-left font-semibold text-[#1F2A24]/70">
                                                LRN
                                            </th>
                                            <th className="px-4 py-3 text-left font-semibold text-[#1F2A24]/70">
                                                Class
                                            </th>
                                            <th className="px-4 py-3 text-left font-semibold text-[#1F2A24]/70">
                                                Account
                                            </th>
                                            <th className="px-4 py-3 text-left font-semibold text-[#1F2A24]/70">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#1F2A24]/10">
                                        {students.data.map((student) => (
                                            <tr
                                                key={student.id}
                                                className="align-middle hover:bg-[#2F6F4E]/5"
                                            >
                                                <td className="px-4 py-3">
                                                    {renderName(student)}
                                                </td>
                                                <td className="px-4 py-3 text-[#1F2A24]/75 tabular-nums">
                                                    {student.lrn ?? '—'}
                                                </td>
                                                <td className="px-4 py-3 text-[#1F2A24]/75">
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
                                                    <StudentAccountActions
                                                        studentId={student.id}
                                                        studentName={
                                                            student.name
                                                        }
                                                        account={
                                                            student.account
                                                        }
                                                        size="compact"
                                                    />
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
                                        ? 'border-[#2F6F4E] bg-[#2F6F4E] text-white'
                                        : 'border-[#1F2A24]/10 bg-white text-[#1F2A24]/70 hover:bg-[#1F2A24]/5',
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
