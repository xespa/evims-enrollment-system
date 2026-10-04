import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    CircleCheck,
    CircleX,
    Clock,
    FileText,
    Wallet,
} from 'lucide-react';
import type { ReactNode } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

type Status = 'PENDING' | 'APPROVED' | 'REJECTED';

type Props = {
    filters: { school_year: string };
    schoolYears: string[];
    stats: {
        totalEnrollments: number;
        cancelledEnrollments: number;
        statusBreakdown: Partial<Record<Status, number>>;
        totalBilled: number;
        totalCollected: number;
        overdue: { installments: number; families: number; amount: number };
        enrollmentsByGrade: { name: string; count: number }[];
        paymentMethodBreakdown: {
            method: string;
            count: number;
            total: string | number;
        }[];
        monthlyCollections: { month: string; label: string; total: number }[];
    };
    recentEnrollments: {
        id: number;
        enrollment_status: Status;
        cancelled_at: string | null;
        created_at: string;
        student: { first_name: string; last_name: string };
        grade_level: { name: string };
    }[];
    awaitingForm138: {
        id: number;
        school_year: string;
        student: { first_name: string; last_name: string };
        grade_level: { name: string };
    }[];
    recentPayments: {
        id: number;
        amount: string | number;
        method: string;
        paid_at: string | null;
        enrollment: { student: { first_name: string; last_name: string } };
    }[];
};

const INK = '#1F2A24';
const GREEN = '#2F6F4E';

// Status colours, in the order the stacked bar shows them: amber sits
// between green and red, which are too alike for red-green colour
// blindness when side by side (checked with the palette validator). Every
// status also carries an icon and a label, never colour alone.
const STATUSES: {
    key: Status;
    label: string;
    color: string;
    badge: string;
    icon: typeof Clock;
}[] = [
    {
        key: 'APPROVED',
        label: 'Approved',
        color: '#2E8057',
        badge: 'bg-[#2E8057]/10 text-[#22613F]',
        icon: CircleCheck,
    },
    {
        key: 'PENDING',
        label: 'Pending review',
        color: '#E8A33D',
        badge: 'bg-[#E8A33D]/15 text-[#8A5A12]',
        icon: Clock,
    },
    {
        key: 'REJECTED',
        label: 'Rejected',
        color: '#C6473B',
        badge: 'bg-[#C6473B]/10 text-[#9A3329]',
        icon: CircleX,
    },
];

const STATUS_BY_KEY = Object.fromEntries(STATUSES.map((s) => [s.key, s]));

const peso = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
});
const pesoCompact = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    notation: 'compact',
    maximumFractionDigits: 1,
});

function formatCurrency(value: string | number): string {
    return peso.format(Number(value));
}

function formatDate(value: string | null): string {
    return value
        ? new Date(value).toLocaleDateString('en-PH', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
          })
        : '—';
}

function Card({
    title,
    action,
    className = '',
    children,
}: {
    title: string;
    action?: ReactNode;
    className?: string;
    children: ReactNode;
}) {
    return (
        <section
            className={`rounded-2xl border border-[#1F2A24]/10 bg-white p-5 ${className}`}
        >
            <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-xs font-semibold tracking-[0.1em] text-[#2F6F4E] uppercase">
                    {title}
                </h2>
                {action}
            </div>
            {children}
        </section>
    );
}

function StatTile({
    label,
    value,
    sub,
    icon: Icon,
    tone = 'neutral',
    children,
}: {
    label: string;
    value: ReactNode;
    sub?: ReactNode;
    icon: typeof Clock;
    tone?: 'neutral' | 'attention' | 'critical';
    children?: ReactNode;
}) {
    const iconStyle = {
        neutral: 'bg-[#2F6F4E]/10 text-[#2F6F4E]',
        attention: 'bg-[#E8A33D]/15 text-[#8A5A12]',
        critical: 'bg-[#C6473B]/10 text-[#9A3329]',
    }[tone];

    return (
        <div className="rounded-2xl border border-[#1F2A24]/10 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-[#1F2A24]/70">{label}</p>
                <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconStyle}`}
                >
                    <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                </span>
            </div>
            <p className="mt-1 font-serif text-2xl font-semibold text-[#1F2A24] tabular-nums">
                {value}
            </p>
            {sub && <p className="mt-1 text-xs text-[#1F2A24]/65">{sub}</p>}
            {children}
        </div>
    );
}

function ChartTooltip({
    active,
    payload,
    label,
    format,
}: {
    active?: boolean;
    payload?: { value: number }[];
    label?: string;
    format: (value: number) => string;
}) {
    if (!active || !payload?.length) {
        return null;
    }

    return (
        <div className="rounded-lg border border-[#1F2A24]/10 bg-white px-3 py-2 text-sm shadow-lg">
            <p className="text-xs text-[#1F2A24]/60">{label}</p>
            <p className="font-semibold text-[#1F2A24] tabular-nums">
                {format(payload[0].value)}
            </p>
        </div>
    );
}

function EmptyNote({ children }: { children: ReactNode }) {
    return (
        <p className="py-6 text-center text-sm text-[#1F2A24]/60">{children}</p>
    );
}

export default function Dashboard({
    filters,
    schoolYears,
    stats,
    recentEnrollments,
    awaitingForm138,
    recentPayments,
}: Props) {
    const schoolYear = filters.school_year;
    const outstanding = Math.max(0, stats.totalBilled - stats.totalCollected);
    const collectionRate =
        stats.totalBilled > 0
            ? Math.min(100, (stats.totalCollected / stats.totalBilled) * 100)
            : 0;

    const statusTotal = STATUSES.reduce(
        (sum, s) => sum + (stats.statusBreakdown[s.key] ?? 0),
        0,
    );
    const pending = stats.statusBreakdown.PENDING ?? 0;

    const gradeRows = stats.enrollmentsByGrade;
    const hasGradeData = gradeRows.some((row) => row.count > 0);
    const hasCollections = stats.monthlyCollections.some((m) => m.total > 0);
    const methodTotal = stats.paymentMethodBreakdown.reduce(
        (sum, row) => sum + Number(row.total),
        0,
    );

    const changeSchoolYear = (value: string) => {
        router.get(
            route('admin.dashboard'),
            { school_year: value },
            { preserveScroll: true, preserveState: true, replace: true },
        );
    };

    return (
        <>
            <Head title="Dashboard" />
            <div className="bg-[#FBF8F2] px-4 py-8">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <h1 className="font-serif text-2xl font-semibold text-[#1F2A24]">
                                Dashboard
                            </h1>
                            <p className="text-sm text-[#1F2A24]/70">
                                {schoolYear
                                    ? `School year ${schoolYear} at a glance.`
                                    : 'All school years at a glance.'}
                            </p>
                        </div>
                        <div>
                            <label
                                htmlFor="dashboard-school-year"
                                className="mb-1 block text-xs font-medium text-[#1F2A24]/70"
                            >
                                School year
                            </label>
                            <select
                                id="dashboard-school-year"
                                value={schoolYear}
                                onChange={(e) =>
                                    changeSchoolYear(e.target.value)
                                }
                                className="min-h-10 rounded-lg border border-[#1F2A24]/15 bg-white px-3 pr-8 text-sm text-[#1F2A24] focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none"
                            >
                                {schoolYears.map((year) => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                                <option value="">All school years</option>
                            </select>
                        </div>
                    </div>

                    {awaitingForm138.length > 0 && (
                        <div
                            role="status"
                            className="mb-6 rounded-xl border border-[#E8A33D]/30 bg-[#E8A33D]/10 px-4 py-3 text-sm text-[#7a4d0b]"
                        >
                            <p className="flex items-start gap-2">
                                <AlertTriangle
                                    className="mt-0.5 h-4 w-4 shrink-0"
                                    aria-hidden="true"
                                />
                                <span>
                                    <span className="font-semibold">
                                        Upload the latest Form 138.
                                    </span>{' '}
                                    {awaitingForm138.length === 1
                                        ? 'This returning student needs'
                                        : `These ${awaitingForm138.length} returning students need`}{' '}
                                    their report card from EVIMS attached before
                                    their application can be approved:
                                </span>
                            </p>
                            <ul className="mt-2 flex flex-wrap gap-2 pl-6">
                                {awaitingForm138.map((enrollment) => (
                                    <li key={enrollment.id}>
                                        <Link
                                            href={`${route('admin.enrollments.show', enrollment.id)}#document-verification`}
                                            className="inline-flex min-h-8 items-center rounded-full bg-white/70 px-3 text-xs font-semibold underline-offset-2 hover:underline"
                                        >
                                            {enrollment.student.last_name},{' '}
                                            {enrollment.student.first_name} ·{' '}
                                            {enrollment.grade_level.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Headline numbers */}
                    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatTile
                            label="Applications"
                            value={stats.totalEnrollments}
                            icon={FileText}
                            sub={
                                stats.cancelledEnrollments > 0
                                    ? `${stats.cancelledEnrollments} cancelled, not counted`
                                    : 'Active applications'
                            }
                        />
                        <StatTile
                            label="Pending review"
                            value={pending}
                            icon={Clock}
                            tone={pending > 0 ? 'attention' : 'neutral'}
                            sub={
                                pending > 0 ? (
                                    <Link
                                        href={route('admin.students.index', {
                                            school_year: schoolYear,
                                        })}
                                        className="font-medium text-[#2F6F4E] hover:underline"
                                    >
                                        Review applications →
                                    </Link>
                                ) : (
                                    'Nothing waiting'
                                )
                            }
                        />
                        <StatTile
                            label="Collected"
                            value={formatCurrency(stats.totalCollected)}
                            icon={Wallet}
                            sub={`${collectionRate.toFixed(1)}% of ${formatCurrency(stats.totalBilled)} billed`}
                        >
                            <div
                                className="mt-3 h-2 overflow-hidden rounded-full bg-[#1F2A24]/10"
                                role="progressbar"
                                aria-label="Share of billed fees collected"
                                aria-valuenow={Math.round(collectionRate)}
                                aria-valuemin={0}
                                aria-valuemax={100}
                            >
                                <div
                                    className="h-full rounded-full bg-[#2F6F4E] transition-[width] duration-500 motion-reduce:transition-none"
                                    style={{ width: `${collectionRate}%` }}
                                />
                            </div>
                            <p className="mt-1.5 text-xs text-[#1F2A24]/65">
                                {formatCurrency(outstanding)} still to collect
                            </p>
                        </StatTile>
                        <StatTile
                            label="Overdue"
                            value={formatCurrency(stats.overdue.amount)}
                            icon={AlertTriangle}
                            tone={
                                stats.overdue.installments > 0
                                    ? 'critical'
                                    : 'neutral'
                            }
                            sub={
                                stats.overdue.installments > 0
                                    ? `${stats.overdue.installments} installment${stats.overdue.installments === 1 ? '' : 's'} past due · ${stats.overdue.families} famil${stats.overdue.families === 1 ? 'y' : 'ies'}`
                                    : 'No installments past due'
                            }
                        />
                    </div>

                    <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
                        {/* Collections over time */}
                        <Card
                            title="Collections, last 6 months"
                            className="lg:col-span-2"
                        >
                            {hasCollections ? (
                                <>
                                    <div aria-hidden="true">
                                        <ResponsiveContainer
                                            width="100%"
                                            height={240}
                                        >
                                            <AreaChart
                                                data={stats.monthlyCollections}
                                                margin={{
                                                    top: 8,
                                                    right: 8,
                                                    left: 0,
                                                    bottom: 0,
                                                }}
                                            >
                                                <defs>
                                                    <linearGradient
                                                        id="collections-fill"
                                                        x1="0"
                                                        y1="0"
                                                        x2="0"
                                                        y2="1"
                                                    >
                                                        <stop
                                                            offset="0%"
                                                            stopColor={GREEN}
                                                            stopOpacity={0.22}
                                                        />
                                                        <stop
                                                            offset="100%"
                                                            stopColor={GREEN}
                                                            stopOpacity={0.02}
                                                        />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid
                                                    vertical={false}
                                                    stroke={INK}
                                                    strokeOpacity={0.08}
                                                />
                                                <XAxis
                                                    dataKey="label"
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tick={{
                                                        fontSize: 12,
                                                        fill: INK,
                                                        fillOpacity: 0.6,
                                                    }}
                                                />
                                                <YAxis
                                                    width={64}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tickFormatter={(v) =>
                                                        pesoCompact.format(v)
                                                    }
                                                    tick={{
                                                        fontSize: 12,
                                                        fill: INK,
                                                        fillOpacity: 0.6,
                                                    }}
                                                />
                                                <Tooltip
                                                    cursor={{
                                                        stroke: INK,
                                                        strokeOpacity: 0.2,
                                                    }}
                                                    content={
                                                        <ChartTooltip
                                                            format={
                                                                formatCurrency
                                                            }
                                                        />
                                                    }
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="total"
                                                    stroke={GREEN}
                                                    strokeWidth={2}
                                                    fill="url(#collections-fill)"
                                                    dot={{
                                                        r: 4,
                                                        fill: GREEN,
                                                        stroke: '#fff',
                                                        strokeWidth: 2,
                                                    }}
                                                    activeDot={{
                                                        r: 6,
                                                        fill: GREEN,
                                                        stroke: '#fff',
                                                        strokeWidth: 2,
                                                    }}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <table className="sr-only">
                                        <caption>
                                            Money collected per month
                                        </caption>
                                        <tbody>
                                            {stats.monthlyCollections.map(
                                                (m) => (
                                                    <tr key={m.month}>
                                                        <th scope="row">
                                                            {m.label}
                                                        </th>
                                                        <td>
                                                            {formatCurrency(
                                                                m.total,
                                                            )}
                                                        </td>
                                                    </tr>
                                                ),
                                            )}
                                        </tbody>
                                    </table>
                                </>
                            ) : (
                                <EmptyNote>
                                    No payments collected in the last 6 months.
                                </EmptyNote>
                            )}
                        </Card>

                        {/* Application status */}
                        <Card title="Application status">
                            {statusTotal > 0 ? (
                                <>
                                    <div
                                        className="flex h-3 gap-0.5 overflow-hidden rounded-full"
                                        aria-hidden="true"
                                    >
                                        {STATUSES.map((s) => {
                                            const count =
                                                stats.statusBreakdown[s.key] ??
                                                0;

                                            return count > 0 ? (
                                                <div
                                                    key={s.key}
                                                    style={{
                                                        width: `${(count / statusTotal) * 100}%`,
                                                        backgroundColor:
                                                            s.color,
                                                    }}
                                                />
                                            ) : null;
                                        })}
                                    </div>
                                    <ul className="mt-4 space-y-3">
                                        {STATUSES.map((s) => {
                                            const count =
                                                stats.statusBreakdown[s.key] ??
                                                0;
                                            const Icon = s.icon;

                                            return (
                                                <li
                                                    key={s.key}
                                                    className="flex items-center gap-3 text-sm"
                                                >
                                                    <span
                                                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                                                        style={{
                                                            backgroundColor:
                                                                s.color,
                                                        }}
                                                        aria-hidden="true"
                                                    />
                                                    <Icon
                                                        className="h-4 w-4 shrink-0 text-[#1F2A24]/55"
                                                        aria-hidden="true"
                                                    />
                                                    <span className="flex-1 text-[#1F2A24]/80">
                                                        {s.label}
                                                    </span>
                                                    <span className="font-semibold text-[#1F2A24] tabular-nums">
                                                        {count}
                                                    </span>
                                                    <span className="w-11 text-right text-xs text-[#1F2A24]/55 tabular-nums">
                                                        {Math.round(
                                                            (count /
                                                                statusTotal) *
                                                                100,
                                                        )}
                                                        %
                                                    </span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </>
                            ) : (
                                <EmptyNote>No applications yet.</EmptyNote>
                            )}
                        </Card>
                    </div>

                    <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
                        {/* Enrollments by grade */}
                        <Card
                            title="Applications by grade level"
                            className="lg:col-span-2"
                        >
                            {hasGradeData ? (
                                <>
                                    <div aria-hidden="true">
                                        <ResponsiveContainer
                                            width="100%"
                                            height={gradeRows.length * 30 + 24}
                                        >
                                            <BarChart
                                                data={gradeRows}
                                                layout="vertical"
                                                margin={{
                                                    top: 0,
                                                    right: 16,
                                                    left: 0,
                                                    bottom: 0,
                                                }}
                                                barCategoryGap={6}
                                            >
                                                <CartesianGrid
                                                    horizontal={false}
                                                    stroke={INK}
                                                    strokeOpacity={0.08}
                                                />
                                                <XAxis
                                                    type="number"
                                                    allowDecimals={false}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tick={{
                                                        fontSize: 12,
                                                        fill: INK,
                                                        fillOpacity: 0.6,
                                                    }}
                                                />
                                                <YAxis
                                                    type="category"
                                                    dataKey="name"
                                                    width={76}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tick={{
                                                        fontSize: 12,
                                                        fill: INK,
                                                        fillOpacity: 0.75,
                                                    }}
                                                />
                                                <Tooltip
                                                    cursor={{
                                                        fill: GREEN,
                                                        fillOpacity: 0.06,
                                                    }}
                                                    content={
                                                        <ChartTooltip
                                                            format={(v) =>
                                                                `${v} application${v === 1 ? '' : 's'}`
                                                            }
                                                        />
                                                    }
                                                />
                                                <Bar
                                                    dataKey="count"
                                                    fill={GREEN}
                                                    radius={[0, 4, 4, 0]}
                                                    maxBarSize={18}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <table className="sr-only">
                                        <caption>
                                            Applications per grade level
                                        </caption>
                                        <tbody>
                                            {gradeRows.map((row) => (
                                                <tr key={row.name}>
                                                    <th scope="row">
                                                        {row.name}
                                                    </th>
                                                    <td>{row.count}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </>
                            ) : (
                                <EmptyNote>No applications yet.</EmptyNote>
                            )}
                        </Card>

                        {/* Payment methods */}
                        <Card title="Payment methods">
                            {stats.paymentMethodBreakdown.length > 0 ? (
                                <ul className="space-y-4">
                                    {stats.paymentMethodBreakdown.map((row) => {
                                        const share =
                                            methodTotal > 0
                                                ? (Number(row.total) /
                                                      methodTotal) *
                                                  100
                                                : 0;

                                        return (
                                            <li key={row.method}>
                                                <div className="flex items-baseline justify-between gap-3 text-sm">
                                                    <span className="font-medium text-[#1F2A24]">
                                                        {row.method === 'GCASH'
                                                            ? 'GCash'
                                                            : row.method ===
                                                                'CASH'
                                                              ? 'Cash (counter)'
                                                              : row.method}
                                                    </span>
                                                    <span className="font-semibold text-[#1F2A24] tabular-nums">
                                                        {formatCurrency(
                                                            row.total,
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#1F2A24]/10">
                                                    <div
                                                        className="h-full rounded-full bg-[#2F6F4E]"
                                                        style={{
                                                            width: `${share}%`,
                                                        }}
                                                    />
                                                </div>
                                                <p className="mt-1 text-xs text-[#1F2A24]/60 tabular-nums">
                                                    {row.count} payment
                                                    {Number(row.count) === 1
                                                        ? ''
                                                        : 's'}{' '}
                                                    · {Math.round(share)}%
                                                </p>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <EmptyNote>No payments recorded yet.</EmptyNote>
                            )}
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {/* Recent applications */}
                        <Card
                            title="Recent applications"
                            action={
                                <Link
                                    href={route('admin.students.index', {
                                        school_year: schoolYear,
                                    })}
                                    className="text-sm font-medium text-[#2F6F4E] hover:underline"
                                >
                                    View all
                                </Link>
                            }
                        >
                            {recentEnrollments.length > 0 ? (
                                <ul className="-mx-2 divide-y divide-[#1F2A24]/10">
                                    {recentEnrollments.map((enrollment) => {
                                        const status = enrollment.cancelled_at
                                            ? null
                                            : STATUS_BY_KEY[
                                                  enrollment.enrollment_status
                                              ];
                                        const Icon = status?.icon ?? CircleX;

                                        return (
                                            <li key={enrollment.id}>
                                                <Link
                                                    href={route(
                                                        'admin.enrollments.show',
                                                        enrollment.id,
                                                    )}
                                                    className="flex min-h-14 items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-[#1F2A24]/[0.03]"
                                                >
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-sm font-medium text-[#1F2A24]">
                                                            {
                                                                enrollment
                                                                    .student
                                                                    .last_name
                                                            }
                                                            ,{' '}
                                                            {
                                                                enrollment
                                                                    .student
                                                                    .first_name
                                                            }
                                                        </p>
                                                        <p className="text-xs text-[#1F2A24]/65">
                                                            {
                                                                enrollment
                                                                    .grade_level
                                                                    .name
                                                            }{' '}
                                                            · applied{' '}
                                                            {formatDate(
                                                                enrollment.created_at,
                                                            )}
                                                        </p>
                                                    </div>
                                                    <span
                                                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                                                            status?.badge ??
                                                            'bg-[#1F2A24]/10 text-[#1F2A24]/70'
                                                        }`}
                                                    >
                                                        <Icon
                                                            className="h-3.5 w-3.5"
                                                            aria-hidden="true"
                                                        />
                                                        {status?.label ??
                                                            'Cancelled'}
                                                    </span>
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <EmptyNote>No applications yet.</EmptyNote>
                            )}
                        </Card>

                        {/* Recent payments */}
                        <Card
                            title="Recent payments"
                            action={
                                <Link
                                    href={route('admin.transactions.index')}
                                    className="text-sm font-medium text-[#2F6F4E] hover:underline"
                                >
                                    View all
                                </Link>
                            }
                        >
                            {recentPayments.length > 0 ? (
                                <ul className="divide-y divide-[#1F2A24]/10">
                                    {recentPayments.map((payment) => (
                                        <li
                                            key={payment.id}
                                            className="flex min-h-14 items-center gap-3 py-2"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium text-[#1F2A24]">
                                                    {
                                                        payment.enrollment
                                                            .student.last_name
                                                    }
                                                    ,{' '}
                                                    {
                                                        payment.enrollment
                                                            .student.first_name
                                                    }
                                                </p>
                                                <p className="text-xs text-[#1F2A24]/65">
                                                    {payment.method === 'GCASH'
                                                        ? 'GCash'
                                                        : payment.method ===
                                                            'CASH'
                                                          ? 'Cash'
                                                          : payment.method}{' '}
                                                    ·{' '}
                                                    {formatDate(
                                                        payment.paid_at,
                                                    )}
                                                </p>
                                            </div>
                                            <span className="shrink-0 text-sm font-semibold text-[#1F2A24] tabular-nums">
                                                {formatCurrency(payment.amount)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <EmptyNote>No payments yet.</EmptyNote>
                            )}
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}
