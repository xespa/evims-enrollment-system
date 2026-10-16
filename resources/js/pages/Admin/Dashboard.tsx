import { Head, Link, router, setLayoutProps } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    CircleCheck,
    CircleX,
    Clock,
    FileText,
    Wallet,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
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
        overdue: { installments: number; students: number; amount: number };
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
    recentPayments: {
        id: number;
        amount: string | number;
        method: string;
        paid_at: string | null;
        enrollment: { student: { first_name: string; last_name: string } };
    }[];
};

type ChartView = 'collections' | 'grades';

// The theme's colours, so the charts follow the light/dark switch.
const INK = 'var(--color-ink)';
const GREEN = 'var(--color-brand)';

// Status colours, in the order the bars show them: amber sits between green
// and red, which are too alike for red-green colour blindness when side by
// side (checked with the palette validator). Every status also carries an
// icon and a label, never colour alone.
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
        badge: 'bg-[#2E8057]/10 text-brand-forest',
        icon: CircleCheck,
    },
    {
        key: 'PENDING',
        label: 'Pending review',
        color: '#E8A33D',
        badge: 'bg-warn/15 text-warn-strong',
        icon: Clock,
    },
    {
        key: 'REJECTED',
        label: 'Rejected',
        color: '#C6473B',
        badge: 'bg-danger/10 text-danger-deep',
        icon: CircleX,
    },
];

const STATUS_BY_KEY = Object.fromEntries(STATUSES.map((s) => [s.key, s]));

const CHART_VIEWS: { value: ChartView; label: string }[] = [
    { value: 'collections', label: 'Collections' },
    { value: 'grades', label: 'By grade' },
];

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

function formatMethod(method: string): string {
    return method === 'GCASH' ? 'GCash' : method === 'CASH' ? 'Cash' : method;
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
            className={`rounded-3xl border border-ink/5 bg-surface p-5 shadow-sm shadow-shade/5 sm:p-6 ${className}`}
        >
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-ink">{title}</h2>
                {action}
            </div>
            {children}
        </section>
    );
}

function PillLink({ href, children }: { href: string; children: ReactNode }) {
    return (
        <Link
            href={href}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-brand/10 px-4 text-sm font-medium text-brand-ink transition-colors hover:bg-brand/15"
        >
            {children}
        </Link>
    );
}

function StatCard({
    label,
    value,
    badge,
    icon: Icon,
    iconClassName,
    badgeClassName,
    children,
}: {
    label: string;
    value: ReactNode;
    badge: string;
    icon: typeof Clock;
    iconClassName: string;
    badgeClassName: string;
    children?: ReactNode;
}) {
    return (
        <div className="flex flex-col rounded-3xl border border-ink/5 bg-surface p-5 shadow-sm shadow-shade/5">
            <div className="flex items-start justify-between gap-3">
                <span
                    className={`flex size-11 shrink-0 items-center justify-center rounded-full ${iconClassName}`}
                >
                    <Icon className="size-5" aria-hidden="true" />
                </span>
                <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${badgeClassName}`}
                >
                    {badge}
                </span>
            </div>
            <p className="mt-6 text-sm text-ink/65">{label}</p>
            <p className="mt-1 text-2xl font-bold text-ink tabular-nums">
                {value}
            </p>
            {children}
        </div>
    );
}

function ProgressRow({
    label,
    value,
    percent,
    color,
}: {
    label: ReactNode;
    value: ReactNode;
    percent: number;
    color: string;
}) {
    return (
        <li>
            <div className="flex items-center justify-between gap-3 text-xs font-medium text-ink">
                <span>{label}</span>
                <span className="tabular-nums">{value}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/10">
                <div
                    className="h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none"
                    style={{ width: `${percent}%`, backgroundColor: color }}
                />
            </div>
        </li>
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
        <div className="rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm shadow-lg">
            <p className="text-xs text-ink/60">{label}</p>
            <p className="font-semibold text-ink tabular-nums">
                {format(payload[0].value)}
            </p>
        </div>
    );
}

function EmptyNote({ children }: { children: ReactNode }) {
    return <p className="py-10 text-center text-sm text-ink/60">{children}</p>;
}

function HeroIllustration() {
    const bars = [44, 72, 56, 96, 80];

    return (
        <svg
            viewBox="0 0 220 140"
            className="hidden h-36 w-56 shrink-0 md:block"
            aria-hidden="true"
        >
            <ellipse
                cx="110"
                cy="128"
                rx="100"
                ry="10"
                fill="#fff"
                opacity="0.18"
            />
            {bars.map((height, index) => (
                <g key={index}>
                    <rect
                        x={22 + index * 38}
                        y={124 - height}
                        width="26"
                        height={height}
                        rx="6"
                        fill={index === 3 ? '#e8a33d' : '#fff'}
                        opacity={index === 3 ? 1 : 0.5}
                    />
                    <rect
                        x={22 + index * 38}
                        y={124 - height}
                        width="26"
                        height="8"
                        rx="4"
                        fill={index === 3 ? '#f3c77f' : '#fff'}
                    />
                </g>
            ))}
            <polyline
                points="35,70 73,42 111,58 149,18 187,34"
                fill="none"
                stroke="#fff"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.9"
            />
            <circle cx="149" cy="18" r="5" fill="#e8a33d" />
        </svg>
    );
}

export default function Dashboard({
    filters,
    schoolYears,
    stats,
    recentEnrollments,
    recentPayments,
}: Props) {
    const [chartView, setChartView] = useState<ChartView>('collections');

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
    const approvedShare =
        statusTotal > 0
            ? Math.round(
                  ((stats.statusBreakdown.APPROVED ?? 0) / statusTotal) * 100,
              )
            : 0;

    const gradeRows = stats.enrollmentsByGrade;
    const hasGradeData = gradeRows.some((row) => row.count > 0);
    const hasCollections = stats.monthlyCollections.some((m) => m.total > 0);
    const methodTotal = stats.paymentMethodBreakdown.reduce(
        (sum, row) => sum + Number(row.total),
        0,
    );

    const today = new Date().toLocaleDateString('en-PH', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Manila',
    });
    setLayoutProps({ title: 'Dashboard', subtitle: today });
    const applicationsHref = route('admin.students.index', {
        school_year: schoolYear,
    });

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
            <div className="bg-cream px-4 py-8">
                <div className="mx-auto flex max-w-6xl flex-col gap-6">
                    <div className="flex justify-end">
                        <div>
                            <label
                                htmlFor="dashboard-school-year"
                                className="sr-only"
                            >
                                School year
                            </label>
                            <select
                                id="dashboard-school-year"
                                value={schoolYear}
                                onChange={(e) =>
                                    changeSchoolYear(e.target.value)
                                }
                                className="min-h-11 rounded-full border border-ink/10 bg-surface px-4 pr-9 text-sm text-ink shadow-sm shadow-shade/5 focus:border-brand focus:ring-2 focus:ring-brand/30 focus:outline-none"
                            >
                                {schoolYears.map((year) => (
                                    <option key={year} value={year}>
                                        S.Y. {year}
                                    </option>
                                ))}
                                <option value="">All school years</option>
                            </select>
                        </div>
                    </div>

                    {/* Banner */}
                    {/* EVIMS green, fixed rather than themed so the white
                        text stays readable in dark mode too. */}
                    <section className="relative flex items-center justify-between gap-6 overflow-hidden rounded-3xl bg-linear-to-r from-[#1d5236] via-[#2f6f4e] to-[#3a8660] px-6 py-7 text-white sm:px-8">
                        <span
                            className="pointer-events-none absolute -top-16 -right-10 size-56 rounded-full bg-warn/25 blur-3xl"
                            aria-hidden="true"
                        />
                        <div className="relative min-w-0">
                            <p className="text-sm font-medium text-[#f3c77f]">
                                {schoolYear
                                    ? `School Year ${schoolYear}`
                                    : 'All school years'}
                            </p>
                            <h2 className="mt-3 max-w-xl text-2xl leading-snug font-medium sm:text-3xl">
                                Enrollment and collections overview
                            </h2>
                            <p className="mt-2 text-sm text-white/85">
                                {pending > 0
                                    ? `${pending} application${pending === 1 ? '' : 's'} waiting for review.`
                                    : 'No applications waiting for review.'}
                            </p>
                            <Link
                                href={applicationsHref}
                                className="mt-5 inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-warn px-4 text-sm font-semibold text-[#1f2a24] transition-colors hover:bg-[#f0b456]"
                            >
                                Review applications
                                <ArrowRight
                                    className="size-4"
                                    aria-hidden="true"
                                />
                            </Link>
                        </div>
                        <div className="relative">
                            <HeroIllustration />
                        </div>
                    </section>

                    {/* Headline numbers */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard
                            label="Total applications"
                            value={stats.totalEnrollments}
                            icon={FileText}
                            iconClassName="bg-warn text-[#1f2a24]"
                            badge={
                                stats.cancelledEnrollments > 0
                                    ? `${stats.cancelledEnrollments} cancelled`
                                    : 'Active'
                            }
                            badgeClassName="bg-brand/10 text-brand-ink"
                        />
                        <StatCard
                            label="Pending review"
                            value={pending}
                            icon={Clock}
                            iconClassName="bg-brand text-on-brand"
                            badge={pending > 0 ? 'Needs review' : 'All clear'}
                            badgeClassName={
                                pending > 0
                                    ? 'bg-warn/15 text-warn-strong'
                                    : 'bg-brand/10 text-brand-ink'
                            }
                        />
                        <StatCard
                            label="Collected"
                            value={formatCurrency(stats.totalCollected)}
                            icon={Wallet}
                            iconClassName="bg-ink text-cream"
                            badge={`${collectionRate.toFixed(1)}% of billed`}
                            badgeClassName="bg-brand/10 text-brand-ink"
                        />
                        <StatCard
                            label="Overdue"
                            value={formatCurrency(stats.overdue.amount)}
                            icon={AlertTriangle}
                            iconClassName={
                                stats.overdue.installments > 0
                                    ? 'bg-danger text-white'
                                    : 'bg-brand/15 text-brand-ink'
                            }
                            badge={
                                stats.overdue.installments > 0
                                    ? `${stats.overdue.students} student${stats.overdue.students === 1 ? '' : 's'}`
                                    : 'On time'
                            }
                            badgeClassName={
                                stats.overdue.installments > 0
                                    ? 'bg-danger/10 text-danger-deep'
                                    : 'bg-brand/10 text-brand-ink'
                            }
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Collections / applications by grade */}
                        <Card
                            title={
                                chartView === 'collections'
                                    ? 'Collections, last 6 months'
                                    : 'Applications by grade level'
                            }
                            className="lg:col-span-2"
                            action={
                                <div
                                    role="group"
                                    aria-label="Chart"
                                    className="flex gap-1 rounded-xl border border-ink/10 bg-ink/[0.03] p-1"
                                >
                                    {CHART_VIEWS.map((view) => (
                                        <button
                                            key={view.value}
                                            type="button"
                                            onClick={() =>
                                                setChartView(view.value)
                                            }
                                            aria-pressed={
                                                chartView === view.value
                                            }
                                            className={`min-h-8 rounded-lg px-3 text-sm font-medium transition-colors ${
                                                chartView === view.value
                                                    ? 'bg-brand text-on-brand shadow-sm'
                                                    : 'text-ink/70 hover:text-ink'
                                            }`}
                                        >
                                            {view.label}
                                        </button>
                                    ))}
                                </div>
                            }
                        >
                            {chartView === 'collections' ? (
                                hasCollections ? (
                                    <>
                                        <div aria-hidden="true">
                                            <ResponsiveContainer
                                                width="100%"
                                                height={260}
                                            >
                                                <AreaChart
                                                    data={
                                                        stats.monthlyCollections
                                                    }
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
                                                                stopColor={
                                                                    GREEN
                                                                }
                                                                stopOpacity={
                                                                    0.22
                                                                }
                                                            />
                                                            <stop
                                                                offset="100%"
                                                                stopColor={
                                                                    GREEN
                                                                }
                                                                stopOpacity={
                                                                    0.02
                                                                }
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
                                                            pesoCompact.format(
                                                                v,
                                                            )
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
                                        {/* A div, not the table, is hidden: a table can't
                                            shrink to sr-only's 1px, so it would stretch the page. */}
                                        <div className="sr-only">
                                            <table>
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
                                        </div>
                                    </>
                                ) : (
                                    <EmptyNote>
                                        No payments collected in the last 6
                                        months.
                                    </EmptyNote>
                                )
                            ) : hasGradeData ? (
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
                                    <div className="sr-only">
                                        <table>
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
                                    </div>
                                </>
                            ) : (
                                <EmptyNote>No applications yet.</EmptyNote>
                            )}
                        </Card>

                        {/* Application status */}
                        <section className="rounded-3xl border border-ink/5 bg-surface p-5 shadow-sm shadow-shade/5 sm:p-6">
                            <h2 className="text-sm text-ink/65">
                                Application status
                            </h2>
                            <div className="mt-3 flex items-center gap-3">
                                <p className="text-2xl font-semibold text-ink tabular-nums">
                                    {statusTotal}
                                </p>
                                {statusTotal > 0 && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand-ink">
                                        <CircleCheck
                                            className="size-3.5"
                                            aria-hidden="true"
                                        />
                                        {approvedShare}% approved
                                    </span>
                                )}
                            </div>
                            <p className="mt-1 text-sm text-ink/60">
                                {stats.cancelledEnrollments > 0
                                    ? `${stats.cancelledEnrollments} cancelled, not counted`
                                    : 'Active applications'}
                            </p>

                            <ul className="mt-5 space-y-5 border-t border-ink/10 pt-5">
                                {STATUSES.map((s) => {
                                    const count =
                                        stats.statusBreakdown[s.key] ?? 0;

                                    return (
                                        <ProgressRow
                                            key={s.key}
                                            label={s.label}
                                            value={count}
                                            percent={
                                                statusTotal > 0
                                                    ? (count / statusTotal) *
                                                      100
                                                    : 0
                                            }
                                            color={s.color}
                                        />
                                    );
                                })}
                            </ul>

                            <div className="mt-6 border-t border-ink/10 pt-5">
                                <div className="flex items-center justify-between gap-3 text-xs font-medium text-ink">
                                    <span>Fees collected</span>
                                    <span className="rounded-md bg-ink px-1.5 py-0.5 text-cream tabular-nums">
                                        {Math.round(collectionRate)}%
                                    </span>
                                </div>
                                <div
                                    className="relative mt-3 h-2.5 rounded-full bg-ink/10"
                                    role="progressbar"
                                    aria-label="Share of billed fees collected"
                                    aria-valuenow={Math.round(collectionRate)}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                >
                                    <div
                                        className="h-full rounded-full bg-brand transition-[width] duration-500 motion-reduce:transition-none"
                                        style={{ width: `${collectionRate}%` }}
                                    />
                                    <span
                                        className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-brand bg-surface"
                                        style={{ left: `${collectionRate}%` }}
                                        aria-hidden="true"
                                    />
                                </div>
                                <p className="mt-2 text-xs text-ink/60">
                                    {formatCurrency(outstanding)} still to
                                    collect
                                </p>
                            </div>
                        </section>
                    </div>

                    {/* Recent applications */}
                    <Card
                        title="Recent applications"
                        action={
                            <PillLink href={applicationsHref}>
                                View all
                            </PillLink>
                        }
                    >
                        {recentEnrollments.length > 0 ? (
                            <div className="-mx-5 overflow-x-auto sm:-mx-6">
                                <table className="w-full min-w-[34rem] text-left text-sm">
                                    <thead>
                                        <tr className="bg-ink/[0.04] text-ink">
                                            <th
                                                scope="col"
                                                className="px-5 py-3 font-medium sm:px-6"
                                            >
                                                Student
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-3 py-3 font-medium"
                                            >
                                                Grade level
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-3 py-3 font-medium"
                                            >
                                                Applied
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-5 py-3 text-right font-medium sm:px-6"
                                            >
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-ink/10">
                                        {recentEnrollments.map((enrollment) => {
                                            const status =
                                                enrollment.cancelled_at
                                                    ? null
                                                    : STATUS_BY_KEY[
                                                          enrollment
                                                              .enrollment_status
                                                      ];
                                            const Icon =
                                                status?.icon ?? CircleX;
                                            const { student } = enrollment;

                                            return (
                                                <tr
                                                    key={enrollment.id}
                                                    className="transition-colors hover:bg-ink/[0.02]"
                                                >
                                                    <td className="px-5 py-3 sm:px-6">
                                                        <Link
                                                            href={route(
                                                                'admin.enrollments.show',
                                                                enrollment.id,
                                                            )}
                                                            className="flex items-center gap-3 font-medium text-ink hover:underline"
                                                        >
                                                            <span
                                                                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-semibold text-brand-ink"
                                                                aria-hidden="true"
                                                            >
                                                                {student.first_name.charAt(
                                                                    0,
                                                                )}
                                                                {student.last_name.charAt(
                                                                    0,
                                                                )}
                                                            </span>
                                                            {student.last_name},{' '}
                                                            {student.first_name}
                                                        </Link>
                                                    </td>
                                                    <td className="px-3 py-3 text-ink/75">
                                                        {
                                                            enrollment
                                                                .grade_level
                                                                .name
                                                        }
                                                    </td>
                                                    <td className="px-3 py-3 text-ink/75 tabular-nums">
                                                        {formatDate(
                                                            enrollment.created_at,
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-3 text-right sm:px-6">
                                                        <span
                                                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                                                                status?.badge ??
                                                                'bg-ink/10 text-ink/70'
                                                            }`}
                                                        >
                                                            <Icon
                                                                className="size-3.5"
                                                                aria-hidden="true"
                                                            />
                                                            {status?.label ??
                                                                'Cancelled'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <EmptyNote>No applications yet.</EmptyNote>
                        )}
                    </Card>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Payment methods */}
                        <Card title="Payment methods">
                            {stats.paymentMethodBreakdown.length > 0 ? (
                                <ul className="space-y-5">
                                    {stats.paymentMethodBreakdown.map((row) => {
                                        const share =
                                            methodTotal > 0
                                                ? (Number(row.total) /
                                                      methodTotal) *
                                                  100
                                                : 0;

                                        return (
                                            <ProgressRow
                                                key={row.method}
                                                label={
                                                    row.method === 'CASH'
                                                        ? 'Cash (counter)'
                                                        : formatMethod(
                                                              row.method,
                                                          )
                                                }
                                                value={`${formatCurrency(row.total)} · ${Math.round(share)}%`}
                                                percent={share}
                                                color={GREEN}
                                            />
                                        );
                                    })}
                                </ul>
                            ) : (
                                <EmptyNote>No payments recorded yet.</EmptyNote>
                            )}
                        </Card>

                        {/* Recent payments */}
                        <Card
                            title="Recent payments"
                            className="lg:col-span-2"
                            action={
                                <PillLink
                                    href={route(
                                        'admin.transaction-history.index',
                                    )}
                                >
                                    View all
                                </PillLink>
                            }
                        >
                            {recentPayments.length > 0 ? (
                                <ul className="divide-y divide-ink/10">
                                    {recentPayments.map((payment) => (
                                        <li
                                            key={payment.id}
                                            className="flex min-h-14 items-center gap-3 py-2"
                                        >
                                            <span
                                                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink/5 text-ink/70"
                                                aria-hidden="true"
                                            >
                                                <Wallet className="size-4" />
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium text-ink">
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
                                                <p className="text-xs text-ink/65">
                                                    {formatMethod(
                                                        payment.method,
                                                    )}{' '}
                                                    ·{' '}
                                                    {formatDate(
                                                        payment.paid_at,
                                                    )}
                                                </p>
                                            </div>
                                            <span className="shrink-0 text-sm font-semibold text-ink tabular-nums">
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
