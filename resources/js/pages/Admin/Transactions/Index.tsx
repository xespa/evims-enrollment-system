import { Head, Link, router } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useState } from 'react';
import DateRangePicker from '@/components/date-range-picker';
import {
    MethodLabel,
    STATUS_LABELS,
    STATUS_STYLES,
    formatCurrency,
    formatDateTime,
    referenceId,
} from '@/lib/transactions';
import type { TransactionStatus as Status } from '@/lib/transactions';

type Transaction = {
    id: number;
    enrollment_id: number;
    amount: string;
    method: 'GCASH' | 'CASH';
    status: Status;
    paymongo_source_id: string | null;
    paymongo_payment_intent_id: string | null;
    paid_at: string | null;
    created_at: string;
    enrollment: {
        student: { first_name: string; last_name: string };
    };
    installment: { installment_number: number };
};

type Props = {
    transactions: {
        data: Transaction[];
        links: { url: string | null; label: string; active: boolean }[];
        from: number | null;
        to: number | null;
        total: number;
    };
    summary: {
        collected: number;
        counts: Record<Status | 'ALL', number>;
    };
    filters: {
        status: string;
        method: string;
        search: string;
        from: string;
        to: string;
    };
};

const TABS: { value: '' | Status; label: string; countKey: Status | 'ALL' }[] =
    [
        { value: '', label: 'All', countKey: 'ALL' },
        { value: 'COMPLETED', label: 'Paid', countKey: 'COMPLETED' },
        { value: 'PENDING', label: 'Pending', countKey: 'PENDING' },
        { value: 'FAILED', label: 'Failed', countKey: 'FAILED' },
    ];

const INPUT_CLASS =
    'min-h-10 rounded-lg border border-[#1F2A24]/15 bg-white px-3 py-2 text-sm text-[#1F2A24] focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none';

export default function Index({ transactions, summary, filters }: Props) {
    const [search, setSearch] = useState(filters.search);
    const [method, setMethod] = useState(filters.method);
    const [from, setFrom] = useState(filters.from);
    const [to, setTo] = useState(filters.to);

    const applyFilters = (overrides: Partial<Props['filters']> = {}) => {
        router.get(
            route('admin.transactions.index'),
            { status: filters.status, search, method, from, to, ...overrides },
            { preserveState: true, replace: true },
        );
    };

    const hasFilters = !!(
        filters.search ||
        filters.method ||
        filters.from ||
        filters.to
    );

    const clearFilters = () => {
        setSearch('');
        setMethod('');
        setFrom('');
        setTo('');
        router.get(
            route('admin.transactions.index'),
            { status: filters.status },
            { preserveState: true, replace: true },
        );
    };

    return (
        <>
            <Head title="Transactions" />

            <div className="bg-[#FBF8F2] px-4 py-8">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-6">
                        <h1 className="font-serif text-2xl font-semibold text-[#1F2A24]">
                            Transactions
                        </h1>
                        <p className="mt-1 text-sm text-[#1F2A24]/65">
                            Every GCash and cash tuition payment, newest first.
                        </p>
                    </div>

                    {/* Summary */}
                    <dl className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                        <div className="col-span-2 rounded-2xl border border-[#1F2A24]/10 bg-white p-4 lg:col-span-1">
                            <dt className="text-xs font-medium text-[#1F2A24]/60">
                                Collected
                            </dt>
                            <dd className="mt-1 text-xl font-semibold text-[#2F6F4E] tabular-nums">
                                {formatCurrency(summary.collected)}
                            </dd>
                        </div>
                        <div className="rounded-2xl border border-[#1F2A24]/10 bg-white p-4">
                            <dt className="text-xs font-medium text-[#1F2A24]/60">
                                Successful payments
                            </dt>
                            <dd className="mt-1 text-xl font-semibold text-[#1F2A24] tabular-nums">
                                {summary.counts.COMPLETED}
                            </dd>
                        </div>
                        <div className="rounded-2xl border border-[#1F2A24]/10 bg-white p-4">
                            <dt className="text-xs font-medium text-[#1F2A24]/60">
                                Pending
                            </dt>
                            <dd className="mt-1 text-xl font-semibold text-[#1F2A24] tabular-nums">
                                {summary.counts.PENDING}
                            </dd>
                        </div>
                        <div className="rounded-2xl border border-[#1F2A24]/10 bg-white p-4">
                            <dt className="text-xs font-medium text-[#1F2A24]/60">
                                Failed
                            </dt>
                            <dd className="mt-1 text-xl font-semibold text-[#1F2A24] tabular-nums">
                                {summary.counts.FAILED}
                            </dd>
                        </div>
                    </dl>

                    {/* Status tabs */}
                    <nav
                        aria-label="Filter by status"
                        className="mb-4 flex gap-1 overflow-x-auto border-b border-[#1F2A24]/10"
                    >
                        {TABS.map((tab) => {
                            const isActive = filters.status === tab.value;

                            return (
                                <button
                                    key={tab.label}
                                    type="button"
                                    onClick={() =>
                                        applyFilters({ status: tab.value })
                                    }
                                    aria-current={isActive ? 'page' : undefined}
                                    className={`-mb-px inline-flex min-h-10 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-medium transition-colors ${
                                        isActive
                                            ? 'border-[#2F6F4E] text-[#2F6F4E]'
                                            : 'border-transparent text-[#1F2A24]/60 hover:text-[#1F2A24]'
                                    }`}
                                >
                                    {tab.label}
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${
                                            isActive
                                                ? 'bg-[#2F6F4E]/10'
                                                : 'bg-[#1F2A24]/5'
                                        }`}
                                    >
                                        {summary.counts[tab.countKey]}
                                    </span>
                                </button>
                            );
                        })}
                    </nav>

                    {/* Filters */}
                    <form
                        role="search"
                        onSubmit={(e) => {
                            e.preventDefault();
                            applyFilters();
                        }}
                        className="mb-4 flex flex-wrap items-end gap-3 rounded-2xl border border-[#1F2A24]/10 bg-white p-4"
                    >
                        <label className="flex min-w-[220px] flex-1 flex-col gap-1 text-xs font-medium text-[#1F2A24]/60">
                            Search
                            <span className="relative">
                                <Search
                                    className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#1F2A24]/40"
                                    aria-hidden="true"
                                />
                                <input
                                    type="search"
                                    placeholder="Student, LRN, email, reference or payment ID"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className={`${INPUT_CLASS} w-full pl-9`}
                                />
                            </span>
                        </label>

                        <label className="flex flex-col gap-1 text-xs font-medium text-[#1F2A24]/60">
                            Method
                            <select
                                value={method}
                                onChange={(e) => {
                                    setMethod(e.target.value);
                                    applyFilters({ method: e.target.value });
                                }}
                                className={INPUT_CLASS}
                            >
                                <option value="">All methods</option>
                                <option value="GCASH">GCash</option>
                                <option value="CASH">Cash</option>
                            </select>
                        </label>

                        <DateRangePicker
                            from={from}
                            to={to}
                            onChange={(range) => {
                                setFrom(range.from);
                                setTo(range.to);
                                applyFilters(range);
                            }}
                        />

                        <button
                            type="submit"
                            className="min-h-10 rounded-full bg-[#2F6F4E] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#25573E]"
                        >
                            Search
                        </button>

                        {hasFilters && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="min-h-10 rounded-full px-3 text-sm font-medium text-[#1F2A24]/60 hover:text-[#1F2A24]"
                            >
                                Clear
                            </button>
                        )}
                    </form>

                    {/* Table */}
                    <div className="overflow-x-auto rounded-2xl border border-[#1F2A24]/10 bg-white">
                        <table className="min-w-full divide-y divide-[#1F2A24]/10 text-sm">
                            <thead className="bg-[#2F6F4E]/5">
                                <tr>
                                    <th
                                        scope="col"
                                        className="px-4 py-3 text-right font-semibold text-[#1F2A24]/70"
                                    >
                                        Amount
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-4 py-3 text-left font-semibold text-[#1F2A24]/70"
                                    >
                                        Status
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-4 py-3 text-left font-semibold text-[#1F2A24]/70"
                                    >
                                        Method
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-4 py-3 text-left font-semibold text-[#1F2A24]/70"
                                    >
                                        Description
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-4 py-3 text-left font-semibold text-[#1F2A24]/70"
                                    >
                                        Reference
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-4 py-3 text-left font-semibold text-[#1F2A24]/70"
                                    >
                                        Date
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#1F2A24]/10">
                                {transactions.data.map((transaction) => {
                                    const student =
                                        transaction.enrollment.student;
                                    const href = route(
                                        'admin.transactions.show',
                                        transaction.id,
                                    );

                                    return (
                                        <tr
                                            key={transaction.id}
                                            onClick={() => router.visit(href)}
                                            className="cursor-pointer hover:bg-[#2F6F4E]/5"
                                        >
                                            <td className="px-4 py-3 text-right font-semibold whitespace-nowrap text-[#1F2A24] tabular-nums">
                                                <Link
                                                    href={href}
                                                    className="hover:underline focus-visible:underline"
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    {formatCurrency(
                                                        transaction.amount,
                                                    )}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[transaction.status]}`}
                                                >
                                                    {
                                                        STATUS_LABELS[
                                                            transaction.status
                                                        ]
                                                    }
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <MethodLabel
                                                    method={transaction.method}
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-[#1F2A24]">
                                                {student.last_name},{' '}
                                                {student.first_name}
                                                <span className="block text-xs text-[#1F2A24]/60">
                                                    Installment #
                                                    {
                                                        transaction.installment
                                                            .installment_number
                                                    }{' '}
                                                    · Application #
                                                    {transaction.enrollment_id}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-[#1F2A24]/70">
                                                {referenceId(transaction)}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-[#1F2A24]/70">
                                                {formatDateTime(
                                                    transaction.created_at,
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}

                                {transactions.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-4 py-10 text-center text-[#1F2A24]/65"
                                        >
                                            No transactions found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-[#1F2A24]/60">
                            {transactions.total > 0
                                ? `Showing ${transactions.from}–${transactions.to} of ${transactions.total}`
                                : 'Showing 0 results'}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {transactions.links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url ?? '#'}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
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
            </div>
        </>
    );
}
