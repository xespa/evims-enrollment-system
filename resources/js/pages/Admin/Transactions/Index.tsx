import { Head, Link, router, usePage, setLayoutProps } from '@inertiajs/react';
import {
    AlertTriangle,
    CalendarClock,
    CheckCircle2,
    ChevronRight,
    History,
    Inbox,
    Plus,
    Search,
    Wallet,
    X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import InstallmentsDialog from '@/components/installments-dialog';
import type { ScheduledInstallment } from '@/components/installments-dialog';
import RecordCounterPaymentDialog from '@/components/record-counter-payment-dialog';
import type { UnpaidInstallment } from '@/components/record-counter-payment-dialog';
import { formatCurrency, formatDate } from '@/lib/transactions';
import { cn } from '@/lib/utils';
import { index as transactionHistoryIndex } from '@/routes/admin/transaction-history';
import { index as transactionsIndex } from '@/routes/admin/transactions';

type Tab = 'PAID' | 'RECEIVABLE' | 'OVERDUE';

/** One student's application, from TransactionController::row(). */
type StudentRow = {
    id: number;
    enrollment_status: string;
    cancelled_at: string | null;
    school_year: string;
    grade_level: string | null;
    student: { first_name: string; last_name: string };
    payment: {
        channel_label: string;
        total: number;
        paid: number;
        balance: number;
        unpaid_installments: UnpaidInstallment[];
    } | null;
    installments: ScheduledInstallment[];
    paid_count: number;
    last_paid_at: string | null;
    owed: number;
    owed_installments: number;
    first_owed_due_date: string | null;
    days_overdue: number;
};

type Filters = {
    school_year: string;
    grade_level_id: string;
    search: string;
};

type OwedSummary = { count: number; total: number };

type Props = {
    tab: Tab;
    rows: {
        data: StudentRow[];
        links: { url: string | null; label: string; active: boolean }[];
        from: number | null;
        to: number | null;
        total: number;
    };
    summary: {
        collected: number;
        paid_students: number;
        receivable: OwedSummary;
        overdue: OwedSummary;
    };
    schoolYears: string[];
    gradeLevels: { id: number; name: string }[];
    filters: Filters;
};

type Payer = {
    id: number;
    name: string;
    unpaidInstallments: UnpaidInstallment[];
    settleThroughInstallmentId?: number;
};

const EMPTY_FILTERS: Filters = {
    school_year: '',
    grade_level_id: '',
    search: '',
};

const INPUT_CLASS =
    'min-h-11 rounded-lg border border-ink/15 bg-surface px-3 text-sm text-ink focus:border-brand focus:ring-2 focus:ring-brand/30 focus:outline-none';

/** Each tab, shown as a figure card the list is picked from. */
const TABS: Record<
    Tab,
    {
        label: string;
        description: string;
        icon: LucideIcon;
        accent: { active: string; icon: string; amount: string };
        empty: { icon: LucideIcon; title: string; body: string };
    }
> = {
    PAID: {
        label: 'Collected',
        description: 'Students who have paid',
        icon: Wallet,
        accent: {
            active: 'border-brand ring-2 ring-brand/20',
            icon: 'bg-brand/10 text-brand-ink',
            amount: 'text-brand-ink',
        },
        empty: {
            icon: Inbox,
            title: 'No payments yet',
            body: 'Students show up here once a payment is recorded at the counter or made via GCash.',
        },
    },
    RECEIVABLE: {
        label: 'Receivable',
        description: 'Upcoming installments still owed',
        icon: CalendarClock,
        accent: {
            active: 'border-[#a4670f] ring-2 ring-warn/25',
            icon: 'bg-warn/15 text-warn-ink',
            amount: 'text-ink',
        },
        empty: {
            icon: CheckCircle2,
            title: 'Nothing upcoming',
            body: 'No student owes an installment that is still to come.',
        },
    },
    OVERDUE: {
        label: 'Overdue',
        description: 'Installments past their due date',
        icon: AlertTriangle,
        accent: {
            active: 'border-danger ring-2 ring-danger/20',
            icon: 'bg-danger/10 text-danger-alert',
            amount: 'text-danger-alert',
        },
        empty: {
            icon: CheckCircle2,
            title: 'Everyone is on track',
            body: 'No student has an installment past its due date.',
        },
    },
};

function plural(count: number, word: string) {
    return `${count} ${count === 1 ? word : `${word}s`}`;
}

function studentName(row: StudentRow) {
    return `${row.student.first_name} ${row.student.last_name}`;
}

function initials(row: StudentRow) {
    return `${row.student.first_name.charAt(0)}${row.student.last_name.charAt(0)}`.toUpperCase();
}

/** Whether a counter payment can be recorded against the application. */
function isPayable(row: StudentRow) {
    return (
        row.enrollment_status === 'APPROVED' &&
        !row.cancelled_at &&
        (row.payment?.balance ?? 0) > 0
    );
}

function TabCard({
    tab,
    isActive,
    amount,
    detail,
    onSelect,
}: {
    tab: Tab;
    isActive: boolean;
    amount: number;
    detail: string;
    onSelect: () => void;
}) {
    const config = TABS[tab];
    const Icon = config.icon;

    return (
        <button
            type="button"
            onClick={onSelect}
            aria-pressed={isActive}
            className={cn(
                'flex min-h-11 w-full items-start gap-3 rounded-2xl border bg-surface p-4 text-left transition-[border-color,box-shadow] duration-200 hover:border-ink/25 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none',
                isActive ? config.accent.active : 'border-ink/10',
            )}
        >
            <span
                aria-hidden="true"
                className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                    config.accent.icon,
                )}
            >
                <Icon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2 text-sm font-medium text-ink/70">
                    {config.label}
                    {isActive && (
                        <span className="rounded-full bg-ink/5 px-2 py-0.5 text-xs font-medium text-ink/70">
                            Showing
                        </span>
                    )}
                </span>
                <span
                    className={cn(
                        'mt-0.5 block text-2xl font-semibold tabular-nums',
                        config.accent.amount,
                    )}
                >
                    {formatCurrency(amount)}
                </span>
                <span className="mt-0.5 block text-xs text-ink/60">
                    {detail}
                </span>
            </span>
        </button>
    );
}

/** Paid-of-total bar, with the numbers spelled out (not colour alone). */
function PaidProgress({ row }: { row: StudentRow }) {
    const total = row.payment?.total ?? 0;
    const paid = row.payment?.paid ?? 0;
    const percentage =
        total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;

    return (
        <div className="w-full">
            <div className="flex items-baseline justify-between gap-2 text-xs text-ink/60">
                <span className="tabular-nums">
                    {formatCurrency(paid)} of {formatCurrency(total)}
                </span>
                <span className="tabular-nums">{percentage}%</span>
            </div>
            <div
                role="progressbar"
                aria-label={`${studentName(row)}: tuition paid`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percentage}
                className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink/10"
            >
                <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

/** What the open tab says about one student, as an amount and a status. */
function RowFigure({ row, tab }: { row: StudentRow; tab: Tab }) {
    if (tab === 'PAID') {
        const isFullyPaid = (row.payment?.balance ?? 0) <= 0;

        return (
            <>
                <span className="block font-semibold text-brand-ink tabular-nums">
                    {formatCurrency(row.payment?.paid ?? 0)}
                </span>
                <span
                    className={cn(
                        'mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
                        isFullyPaid
                            ? 'bg-brand/10 text-brand-ink'
                            : 'bg-ink/5 text-ink/70',
                    )}
                >
                    {isFullyPaid
                        ? 'Fully paid'
                        : `${formatCurrency(row.payment?.balance ?? 0)} left`}
                </span>
            </>
        );
    }

    const isOverdue = tab === 'OVERDUE';
    const StatusIcon = isOverdue ? AlertTriangle : CalendarClock;

    return (
        <>
            <span
                className={cn(
                    'block font-semibold tabular-nums',
                    isOverdue ? 'text-danger-alert' : 'text-ink',
                )}
            >
                {formatCurrency(row.owed)}
            </span>
            <span
                className={cn(
                    'mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
                    isOverdue
                        ? 'bg-danger/10 text-danger-alert'
                        : 'bg-warn/15 text-warn-ink',
                )}
            >
                <StatusIcon className="h-3 w-3" aria-hidden="true" />
                {isOverdue
                    ? `${plural(row.days_overdue, 'day')} overdue`
                    : row.first_owed_due_date &&
                      `Due ${formatDate(row.first_owed_due_date)}`}
            </span>
        </>
    );
}

/** The line under a student's name: what the open tab is counting. */
function rowSummary(row: StudentRow, tab: Tab) {
    if (tab === 'PAID') {
        return `${plural(row.paid_count, 'payment')}${row.last_paid_at ? ` · last on ${formatDate(row.last_paid_at)}` : ''}`;
    }

    return `${plural(row.owed_installments, 'installment')} ${tab === 'OVERDUE' ? 'past due' : 'coming up'}`;
}

export default function Index({
    tab,
    rows,
    summary,
    schoolYears,
    gradeLevels,
    filters,
}: Props) {
    const { props } = usePage();
    const flashSuccess = props.flash?.success;

    // The student whose installments are open; kept apart from
    // `isViewing` so the dialog doesn't blank out while closing.
    const [viewing, setViewing] = useState<StudentRow | null>(null);
    const [isViewing, setIsViewing] = useState(false);

    // Recording a counter payment for a student in the list.
    const [payer, setPayer] = useState<Payer | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordSession, setRecordSession] = useState(0);

    const startRecording = (nextPayer: Payer) => {
        setPayer(nextPayer);
        setRecordSession((n) => n + 1);
        setIsRecording(true);
    };

    const recordFor = (row: StudentRow, settleThroughInstallmentId?: number) =>
        startRecording({
            id: row.id,
            name: studentName(row),
            unpaidInstallments: row.payment?.unpaid_installments ?? [],
            settleThroughInstallmentId,
        });

    const [draft, setDraft] = useState<Filters>(filters);
    const [isLoading, setIsLoading] = useState(false);

    const visit = (query: Partial<Filters> & { tab?: Tab }) => {
        router.get(
            transactionsIndex().url,
            Object.fromEntries(
                Object.entries({ tab, ...draft, ...query }).filter(
                    // An empty school year is kept: it means "All school
                    // years", while leaving it out starts on the current one.
                    ([key, value]) => value !== '' || key === 'school_year',
                ),
            ),
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onStart: () => setIsLoading(true),
                onFinish: () => setIsLoading(false),
            },
        );
    };

    const update = (changes: Partial<Filters>) => {
        setDraft((current) => ({ ...current, ...changes }));
        visit(changes);
    };

    // Search as the user types, once they pause.
    const lastSearched = useRef(filters.search);
    useEffect(() => {
        if (draft.search === lastSearched.current) {
            return;
        }

        const timer = setTimeout(() => {
            lastSearched.current = draft.search;
            visit({ search: draft.search });
        }, 350);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [draft.search]);

    const gradeLevelName = gradeLevels.find(
        (gradeLevel) => String(gradeLevel.id) === filters.grade_level_id,
    )?.name;

    const activeFilters: { key: keyof Filters; label: string }[] = [
        {
            key: 'search' as const,
            label: filters.search ? `“${filters.search}”` : '',
        },
        {
            key: 'school_year' as const,
            label: filters.school_year ? `SY ${filters.school_year}` : '',
        },
        { key: 'grade_level_id' as const, label: gradeLevelName ?? '' },
    ].filter((chip) => chip.label !== '');

    const removeFilter = (key: keyof Filters) => {
        if (key === 'search') {
            lastSearched.current = '';
        }
        update({ [key]: '' });
    };

    const clearFilters = () => {
        lastSearched.current = '';
        setDraft(EMPTY_FILTERS);
        visit(EMPTY_FILTERS);
    };

    const totalBilled =
        summary.collected + summary.receivable.total + summary.overdue.total;
    const share = (amount: number) =>
        totalBilled > 0 ? (amount / totalBilled) * 100 : 0;

    const tabCards: { tab: Tab; amount: number; detail: string }[] = [
        {
            tab: 'PAID',
            amount: summary.collected,
            detail: `from ${plural(summary.paid_students, 'student')}`,
        },
        {
            tab: 'RECEIVABLE',
            amount: summary.receivable.total,
            detail: `${plural(summary.receivable.count, 'student')} with upcoming installments`,
        },
        {
            tab: 'OVERDUE',
            amount: summary.overdue.total,
            detail: `${plural(summary.overdue.count, 'student')} behind on payments`,
        },
    ];

    const empty = TABS[tab].empty;
    const EmptyIcon = empty.icon;
    setLayoutProps({ title: 'Billing & Collections' });

    return (
        <>
            <Head title="Billing & Collections" />

            <div className="bg-cream px-4 py-8">
                <div className="mx-auto max-w-6xl">
                    {/* Header */}
                    <div className="mb-6 flex justify-end">
                        <Link
                            href={transactionHistoryIndex().url}
                            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-brand/30 bg-surface px-5 text-sm font-semibold text-brand-ink transition-colors hover:bg-brand/5 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
                        >
                            <History className="h-4 w-4" aria-hidden="true" />
                            Payment history
                        </Link>
                    </div>

                    {flashSuccess && !isRecording && (
                        <div
                            role="status"
                            className="mb-6 flex items-center gap-2 rounded-xl border border-brand/25 bg-brand/5 px-4 py-3 text-sm text-brand-ink"
                        >
                            <CheckCircle2
                                className="h-4 w-4 shrink-0"
                                aria-hidden="true"
                            />
                            {flashSuccess}
                        </div>
                    )}

                    {/* Collection rate */}
                    <section
                        aria-label="Collection rate"
                        className="mb-3 rounded-2xl border border-ink/10 bg-surface px-4 py-3"
                    >
                        <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                            <span className="font-medium text-ink">
                                {Math.round(share(summary.collected))}%
                                collected
                            </span>
                            <span className="text-ink/60 tabular-nums">
                                {formatCurrency(summary.collected)} of{' '}
                                {formatCurrency(totalBilled)} billed
                            </span>
                        </div>
                        <div
                            aria-hidden="true"
                            className="mt-2 flex h-2 overflow-hidden rounded-full bg-ink/10"
                        >
                            <span
                                className="bg-brand"
                                style={{
                                    width: `${share(summary.collected)}%`,
                                }}
                            />
                            <span
                                className="bg-warn"
                                style={{
                                    width: `${share(summary.receivable.total)}%`,
                                }}
                            />
                            <span
                                className="bg-danger"
                                style={{
                                    width: `${share(summary.overdue.total)}%`,
                                }}
                            />
                        </div>
                        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink/65">
                            <li className="inline-flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-brand" />
                                Collected
                            </li>
                            <li className="inline-flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-warn" />
                                Receivable
                            </li>
                            <li className="inline-flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-danger" />
                                Overdue
                            </li>
                        </ul>
                    </section>

                    {/* Figures, which double as the tabs */}
                    <nav
                        aria-label="Show students by"
                        className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3"
                    >
                        {tabCards.map((card) => (
                            <TabCard
                                key={card.tab}
                                tab={card.tab}
                                isActive={tab === card.tab}
                                amount={card.amount}
                                detail={card.detail}
                                onSelect={() => visit({ tab: card.tab })}
                            />
                        ))}
                    </nav>

                    {/* Filters */}
                    <form
                        role="search"
                        onSubmit={(e) => {
                            e.preventDefault();
                            lastSearched.current = draft.search;
                            visit({});
                        }}
                        className="mb-3 flex flex-wrap items-end gap-3"
                    >
                        <label className="flex min-w-[220px] flex-1 flex-col gap-1 text-xs font-medium text-ink/65">
                            Search students
                            <span className="relative">
                                <Search
                                    className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink/40"
                                    aria-hidden="true"
                                />
                                <input
                                    type="search"
                                    placeholder="Name, LRN, email or application no."
                                    value={draft.search}
                                    onChange={(e) =>
                                        setDraft((current) => ({
                                            ...current,
                                            search: e.target.value,
                                        }))
                                    }
                                    className={`${INPUT_CLASS} w-full pl-9`}
                                />
                            </span>
                        </label>

                        <label className="flex flex-col gap-1 text-xs font-medium text-ink/65">
                            School year
                            <select
                                value={draft.school_year}
                                onChange={(e) =>
                                    update({ school_year: e.target.value })
                                }
                                className={INPUT_CLASS}
                            >
                                <option value="">All school years</option>
                                {schoolYears.map((year) => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="flex flex-col gap-1 text-xs font-medium text-ink/65">
                            Grade level
                            <select
                                value={draft.grade_level_id}
                                onChange={(e) =>
                                    update({ grade_level_id: e.target.value })
                                }
                                className={INPUT_CLASS}
                            >
                                <option value="">All grade levels</option>
                                {gradeLevels.map((gradeLevel) => (
                                    <option
                                        key={gradeLevel.id}
                                        value={String(gradeLevel.id)}
                                    >
                                        {gradeLevel.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </form>

                    {/* Result count and active filters */}
                    <div className="mb-3 flex min-h-8 flex-wrap items-center gap-2 text-sm text-ink/65">
                        <span aria-live="polite">
                            {isLoading
                                ? 'Loading…'
                                : `${plural(rows.total, 'student')} · ${TABS[tab].description.toLowerCase()}`}
                        </span>
                        {activeFilters.map((chip) => (
                            <button
                                key={chip.key}
                                type="button"
                                onClick={() => removeFilter(chip.key)}
                                aria-label={`Remove filter ${chip.label}`}
                                className="inline-flex min-h-8 items-center gap-1 rounded-full border border-brand/25 bg-brand/5 px-3 text-xs font-medium text-brand-ink transition-colors hover:bg-brand/10"
                            >
                                {chip.label}
                                <X className="h-3 w-3" aria-hidden="true" />
                            </button>
                        ))}
                        {activeFilters.length > 1 && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="min-h-8 rounded-full px-2 text-xs font-medium text-ink/60 underline-offset-2 hover:text-ink hover:underline"
                            >
                                Clear all
                            </button>
                        )}
                    </div>

                    {/* Students */}
                    <div
                        className={cn(
                            'overflow-hidden rounded-2xl border border-ink/10 bg-surface transition-opacity duration-200',
                            isLoading && 'opacity-60',
                        )}
                        aria-busy={isLoading}
                    >
                        {rows.data.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
                                <EmptyIcon
                                    className="h-9 w-9 text-ink/25"
                                    aria-hidden="true"
                                />
                                <p className="font-medium text-ink">
                                    {activeFilters.length > 0
                                        ? 'No students match these filters'
                                        : empty.title}
                                </p>
                                <p className="max-w-sm text-sm text-ink/60">
                                    {activeFilters.length > 0
                                        ? 'Try a different search, school year or grade level.'
                                        : empty.body}
                                </p>
                                {activeFilters.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="mt-2 min-h-11 rounded-full border border-brand/30 px-5 text-sm font-semibold text-brand-ink hover:bg-brand/5"
                                    >
                                        Clear filters
                                    </button>
                                )}
                            </div>
                        ) : (
                            <ul className="divide-y divide-ink/10">
                                {rows.data.map((row) => (
                                    <li
                                        key={row.id}
                                        className="flex flex-col gap-3 p-4 transition-colors hover:bg-brand/[0.03] sm:flex-row sm:items-center sm:gap-4"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setViewing(row);
                                                setIsViewing(true);
                                            }}
                                            aria-label={`View ${studentName(row)}'s installments`}
                                            className="group flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-lg text-left focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none sm:gap-4"
                                        >
                                            <span
                                                aria-hidden="true"
                                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand-ink"
                                            >
                                                {initials(row)}
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate font-medium text-ink group-hover:underline">
                                                    {row.student.last_name},{' '}
                                                    {row.student.first_name}
                                                </span>
                                                <span className="block truncate text-xs text-ink/60">
                                                    {row.grade_level ?? '—'} ·
                                                    SY {row.school_year} · #
                                                    {row.id}
                                                </span>
                                                <span className="mt-0.5 block text-xs text-ink/60">
                                                    {rowSummary(row, tab)}
                                                </span>
                                            </span>
                                            <span className="hidden w-48 shrink-0 md:block">
                                                <PaidProgress row={row} />
                                            </span>
                                            <span className="w-32 shrink-0 text-right">
                                                <RowFigure
                                                    row={row}
                                                    tab={tab}
                                                />
                                            </span>
                                            <ChevronRight
                                                className="hidden h-4 w-4 shrink-0 text-ink/35 transition-transform group-hover:translate-x-0.5 sm:block"
                                                aria-hidden="true"
                                            />
                                        </button>

                                        <div className="md:hidden">
                                            <PaidProgress row={row} />
                                        </div>

                                        {isPayable(row) ? (
                                            <button
                                                type="button"
                                                onClick={() => recordFor(row)}
                                                aria-label={`Record a counter payment for ${studentName(row)}`}
                                                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-full border border-brand/30 px-4 text-sm font-semibold text-brand-ink transition-colors hover:bg-brand/5 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
                                            >
                                                <Plus
                                                    className="h-4 w-4"
                                                    aria-hidden="true"
                                                />
                                                Record
                                            </button>
                                        ) : (
                                            <span
                                                className="hidden w-[6.6rem] shrink-0 sm:block"
                                                aria-hidden="true"
                                            />
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Pagination */}
                    {rows.links.length > 3 && (
                        <nav
                            aria-label="Pages"
                            className="mt-4 flex flex-wrap items-center justify-between gap-3"
                        >
                            <p className="text-sm text-ink/60">
                                Showing {rows.from}–{rows.to} of{' '}
                                {plural(rows.total, 'student')}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {rows.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url ?? '#'}
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                        preserveScroll
                                        aria-current={
                                            link.active ? 'page' : undefined
                                        }
                                        className={`inline-flex min-h-10 min-w-10 items-center justify-center rounded-full border px-3 text-sm ${
                                            link.active
                                                ? 'border-brand bg-brand text-white'
                                                : 'border-ink/10 bg-surface text-ink/70 hover:bg-ink/5'
                                        } ${!link.url ? 'pointer-events-none opacity-40' : ''}`}
                                    />
                                ))}
                            </div>
                        </nav>
                    )}
                </div>
            </div>

            {viewing?.payment && (
                <InstallmentsDialog
                    enrollmentId={viewing.id}
                    studentName={studentName(viewing)}
                    channelLabel={viewing.payment.channel_label}
                    installments={viewing.installments}
                    open={isViewing}
                    onOpenChange={setIsViewing}
                    onRecordPayment={
                        isPayable(viewing)
                            ? (settleThroughInstallmentId) => {
                                  setIsViewing(false);
                                  recordFor(
                                      viewing,
                                      settleThroughInstallmentId,
                                  );
                              }
                            : undefined
                    }
                />
            )}

            {payer && (
                <RecordCounterPaymentDialog
                    key={recordSession}
                    enrollmentId={payer.id}
                    studentName={payer.name}
                    unpaidInstallments={payer.unpaidInstallments}
                    settleThroughInstallmentId={
                        payer.settleThroughInstallmentId
                    }
                    open={isRecording}
                    onOpenChange={setIsRecording}
                />
            )}
        </>
    );
}
