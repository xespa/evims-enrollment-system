import { Head } from '@inertiajs/react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

function formatCurrency(value) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
    }).format(value);
}

function StatCard({ label, value, sub }) {
    return (
        <div className="rounded-2xl border border-[#1F2A24]/10 bg-white p-5">
            <p className="text-sm text-[#1F2A24]/60">{label}</p>
            <p className="mt-1 font-serif text-2xl font-semibold text-[#1F2A24]">
                {value}
            </p>
            {sub && <p className="mt-1 text-xs text-[#1F2A24]/40">{sub}</p>}
        </div>
    );
}

const STATUS_STYLES = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
};

export default function Dashboard({
    stats,
    recentEnrollments,
    recentPayments,
}) {
    const collectionRate =
        stats.totalBilled > 0
            ? ((stats.totalCollected / stats.totalBilled) * 100).toFixed(1)
            : '0.0';

    return (
        <>
            <Head title="Dashboard" />
            <div className="bg-[#FBF8F2] px-4 py-8">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-6 flex items-center justify-between">
                        <h1 className="font-serif text-2xl font-semibold text-[#1F2A24]">
                            Dashboard
                        </h1>
                    </div>

                    {/* Stat cards */}
                    <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <StatCard
                            label="Total Enrollments"
                            value={stats.totalEnrollments}
                        />
                        <StatCard
                            label="Pending Review"
                            value={stats.statusBreakdown.PENDING ?? 0}
                        />
                        <StatCard
                            label="Total Billed"
                            value={formatCurrency(stats.totalBilled)}
                        />
                        <StatCard
                            label="Total Collected"
                            value={formatCurrency(stats.totalCollected)}
                            sub={`${collectionRate}% of billed`}
                        />
                    </div>

                    <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {/* Enrollments by grade chart */}
                        <div className="rounded-2xl border border-[#1F2A24]/10 bg-white p-5">
                            <h2 className="mb-3 text-xs font-semibold tracking-[0.1em] text-[#2F6F4E] uppercase">
                                Enrollments by Grade Level
                            </h2>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={stats.enrollmentsByGrade}>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#1F2A24"
                                        strokeOpacity={0.08}
                                    />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 11 }}
                                        angle={-30}
                                        textAnchor="end"
                                        height={60}
                                    />
                                    <YAxis
                                        allowDecimals={false}
                                        tick={{ fontSize: 11 }}
                                    />
                                    <Tooltip />
                                    <Bar
                                        dataKey="count"
                                        fill="#2F6F4E"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Status breakdown */}
                        <div className="rounded-2xl border border-[#1F2A24]/10 bg-white p-5">
                            <h2 className="mb-3 text-xs font-semibold tracking-[0.1em] text-[#2F6F4E] uppercase">
                                Application Status
                            </h2>
                            <div className="space-y-3">
                                {['PENDING', 'APPROVED', 'REJECTED'].map(
                                    (status) => (
                                        <div
                                            key={status}
                                            className="flex items-center justify-between"
                                        >
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}
                                            >
                                                {status}
                                            </span>
                                            <span className="text-sm font-semibold text-[#1F2A24]">
                                                {stats.statusBreakdown[
                                                    status
                                                ] ?? 0}
                                            </span>
                                        </div>
                                    ),
                                )}
                            </div>

                            <h2 className="mt-6 mb-3 text-xs font-semibold tracking-[0.1em] text-[#2F6F4E] uppercase">
                                Payment Methods
                            </h2>
                            <div className="space-y-2">
                                {stats.paymentMethodBreakdown.map((row) => (
                                    <div
                                        key={row.method}
                                        className="flex items-center justify-between text-sm"
                                    >
                                        <span className="text-[#1F2A24]/70">
                                            {row.method} ({row.count})
                                        </span>
                                        <span className="font-semibold text-[#1F2A24]">
                                            {formatCurrency(row.total)}
                                        </span>
                                    </div>
                                ))}
                                {stats.paymentMethodBreakdown.length === 0 && (
                                    <p className="text-xs text-[#1F2A24]/40">
                                        No payments recorded yet.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {/* Recent enrollments */}
                        <div className="rounded-2xl border border-[#1F2A24]/10 bg-white p-5">
                            <h2 className="mb-3 text-xs font-semibold tracking-[0.1em] text-[#2F6F4E] uppercase">
                                Recent Enrollments
                            </h2>
                            <div className="divide-y divide-[#1F2A24]/10">
                                {recentEnrollments.map((enrollment) => (
                                    <div
                                        key={enrollment.id}
                                        className="flex items-center justify-between py-2 text-sm"
                                    >
                                        <div>
                                            <p className="font-medium text-[#1F2A24]">
                                                {enrollment.student.last_name},{' '}
                                                {enrollment.student.first_name}
                                            </p>
                                            <p className="text-xs text-[#1F2A24]/60">
                                                {enrollment.grade_level.name}
                                            </p>
                                        </div>
                                        <span
                                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[enrollment.enrollment_status]}`}
                                        >
                                            {enrollment.enrollment_status}
                                        </span>
                                    </div>
                                ))}
                                {recentEnrollments.length === 0 && (
                                    <p className="py-2 text-xs text-[#1F2A24]/40">
                                        No enrollments yet.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Recent payments */}
                        <div className="rounded-2xl border border-[#1F2A24]/10 bg-white p-5">
                            <h2 className="mb-3 text-xs font-semibold tracking-[0.1em] text-[#2F6F4E] uppercase">
                                Recent Payments
                            </h2>
                            <div className="divide-y divide-[#1F2A24]/10">
                                {recentPayments.map((payment) => (
                                    <div
                                        key={payment.id}
                                        className="flex items-center justify-between py-2 text-sm"
                                    >
                                        <div>
                                            <p className="font-medium text-[#1F2A24]">
                                                {
                                                    payment.enrollment.student
                                                        .last_name
                                                }
                                                ,{' '}
                                                {
                                                    payment.enrollment.student
                                                        .first_name
                                                }
                                            </p>
                                            <p className="text-xs text-[#1F2A24]/60">
                                                {payment.method} ·{' '}
                                                {payment.paid_at}
                                            </p>
                                        </div>
                                        <span className="font-semibold text-[#1F2A24]">
                                            {formatCurrency(payment.amount)}
                                        </span>
                                    </div>
                                ))}
                                {recentPayments.length === 0 && (
                                    <p className="py-2 text-xs text-[#1F2A24]/40">
                                        No payments yet.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
