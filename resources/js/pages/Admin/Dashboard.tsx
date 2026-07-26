import { Head } from '@inertiajs/react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

function formatCurrency(value) {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);
}

function StatCard({ label, value, sub }) {
    return (
        <div className="rounded-lg bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
            {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
        </div>
    );
}

const STATUS_STYLES = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
};

export default function Dashboard({ stats, recentEnrollments, recentPayments }) {
    const collectionRate = stats.totalBilled > 0
        ? ((stats.totalCollected / stats.totalBilled) * 100).toFixed(1)
        : '0.0';

    return (
        <>
            <Head title="Dashboard" />
            <div className="min-h-screen bg-gray-50 py-8 px-4">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-6 flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    </div>

                    {/* Stat cards */}
                    <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <StatCard label="Total Enrollments" value={stats.totalEnrollments} />
                        <StatCard label="Pending Review" value={stats.statusBreakdown.PENDING ?? 0} />
                        <StatCard label="Total Billed" value={formatCurrency(stats.totalBilled)} />
                        <StatCard
                            label="Total Collected"
                            value={formatCurrency(stats.totalCollected)}
                            sub={`${collectionRate}% of billed`}
                        />
                    </div>

                    <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {/* Enrollments by grade chart */}
                        <div className="rounded-lg bg-white p-4 shadow-sm">
                            <h2 className="mb-3 text-sm font-semibold text-gray-600">Enrollments by Grade Level</h2>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={stats.enrollmentsByGrade}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Status breakdown */}
                        <div className="rounded-lg bg-white p-4 shadow-sm">
                            <h2 className="mb-3 text-sm font-semibold text-gray-600">Application Status</h2>
                            <div className="space-y-3">
                                {['PENDING', 'APPROVED', 'REJECTED'].map((status) => (
                                    <div key={status} className="flex items-center justify-between">
                                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}>
                                            {status}
                                        </span>
                                        <span className="text-sm font-semibold text-gray-800">
                                            {stats.statusBreakdown[status] ?? 0}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <h2 className="mb-3 mt-6 text-sm font-semibold text-gray-600">Payment Methods</h2>
                            <div className="space-y-2">
                                {stats.paymentMethodBreakdown.map((row) => (
                                    <div key={row.method} className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">{row.method} ({row.count})</span>
                                        <span className="font-semibold text-gray-800">{formatCurrency(row.total)}</span>
                                    </div>
                                ))}
                                {stats.paymentMethodBreakdown.length === 0 && (
                                    <p className="text-xs text-gray-400">No payments recorded yet.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {/* Recent enrollments */}
                        <div className="rounded-lg bg-white p-4 shadow-sm">
                            <h2 className="mb-3 text-sm font-semibold text-gray-600">Recent Enrollments</h2>
                            <div className="divide-y divide-gray-100">
                                {recentEnrollments.map((enrollment) => (
                                    <div key={enrollment.id} className="flex items-center justify-between py-2 text-sm">
                                        <div>
                                            <p className="font-medium text-gray-800">
                                                {enrollment.student.last_name}, {enrollment.student.first_name}
                                            </p>
                                            <p className="text-xs text-gray-500">{enrollment.grade_level.name}</p>
                                        </div>
                                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[enrollment.enrollment_status]}`}>
                                            {enrollment.enrollment_status}
                                        </span>
                                    </div>
                                ))}
                                {recentEnrollments.length === 0 && (
                                    <p className="py-2 text-xs text-gray-400">No enrollments yet.</p>
                                )}
                            </div>
                        </div>

                        {/* Recent payments */}
                        <div className="rounded-lg bg-white p-4 shadow-sm">
                            <h2 className="mb-3 text-sm font-semibold text-gray-600">Recent Payments</h2>
                            <div className="divide-y divide-gray-100">
                                {recentPayments.map((payment) => (
                                    <div key={payment.id} className="flex items-center justify-between py-2 text-sm">
                                        <div>
                                            <p className="font-medium text-gray-800">
                                                {payment.enrollment.student.last_name}, {payment.enrollment.student.first_name}
                                            </p>
                                            <p className="text-xs text-gray-500">{payment.method} · {payment.paid_at}</p>
                                        </div>
                                        <span className="font-semibold text-gray-800">{formatCurrency(payment.amount)}</span>
                                    </div>
                                ))}
                                {recentPayments.length === 0 && (
                                    <p className="py-2 text-xs text-gray-400">No payments yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
