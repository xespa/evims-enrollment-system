import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Search } from 'lucide-react';
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
import { index as transactionHistoryIndex } from '@/routes/admin/transaction-history';
import {
    index as transactionsIndex,
    show as transactionShow,
} from '@/routes/admin/transactions';

type Payment = {
    id: number;
    enrollment_id: number;
    amount: string;
    method: 'GCASH' | 'CASH';
    receipt_number: string | null;
    status: 'COMPLETED' | 'VOIDED';
    paymongo_source_id: string | null;
    paymongo_payment_intent_id: string | null;
    created_at: string;
    enrollment: {
        student: { first_name: string; last_name: string };
    };
    installment: { installment_number: number };
};

type Filters = {
    status: string;
    method: string;
    school_year: string;
    grade_level_id: string;
    search: string;
    from: string;
    to: string;
};

type Props = {
    payments: {
        data: Payment[];
        links: { url: string | null; label: string; active: boolean }[];
        from: number | null;
        to: number | null;
        total: number;
    };
    schoolYears: string[];
    gradeLevels: { id: number; name: string }[];
    filters: Filters;
};

const INPUT_CLASS =
    'min-h-10 rounded-lg border border-[#1F2A24]/15 bg-white px-3 py-2 text-sm text-[#1F2A24] focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none';

const TH_CLASS = 'px-4 py-3 text-left font-semibold text-[#1F2A24]/70';

const EMPTY_FILTERS: Filters = {
    status: '',
    method: '',
    school_year: '',
    grade_level_id: '',
    search: '',
    from: '',
    to: '',
};

/** Every payment taken, one row each, newest first. */
export default function History({
    payments,
    schoolYears,
    gradeLevels,
    filters,
}: Props) {
    const [draft, setDraft] = useState<Filters>(filters);

    const visit = (query: Partial<Filters>) => {
        router.get(
            transactionHistoryIndex().url,
            Object.fromEntries(
                Object.entries({ ...draft, ...query }).filter(
                    // An empty school year is kept: it means "All school
                    // years", while leaving it out starts on the current one.
                    ([key, value]) => value !== '' || key === 'school_year',
                ),
            ),
            { preserveState: true, replace: true },
        );
    };

    const update = (changes: Partial<Filters>) => {
        setDraft((current) => ({ ...current, ...changes }));
        visit(changes);
    };

    const hasFilters = Object.values(filters).some((value) => value !== '');

    const selects: {
        key: keyof Filters;
        label: string;
        allLabel: string;
        options: { value: string; label: string }[];
    }[] = [
        {
            key: 'status',
            label: 'Status',
            allLabel: 'Paid and voided',
            options: [
                { value: 'COMPLETED', label: 'Paid' },
                { value: 'VOIDED', label: 'Voided' },
            ],
        },
        {
            key: 'method',
            label: 'Method',
            allLabel: 'All methods',
            options: [
                { value: 'GCASH', label: 'GCash' },
                { value: 'CASH', label: 'Cash' },
            ],
        },
        {
            key: 'school_year',
            label: 'School year',
            allLabel: 'All school years',
            options: schoolYears.map((year) => ({ value: year, label: year })),
        },
        {
            key: 'grade_level_id',
            label: 'Grade level',
            allLabel: 'All grade levels',
            options: gradeLevels.map((gradeLevel) => ({
                value: String(gradeLevel.id),
                label: gradeLevel.name,
            })),
        },
    ];

    return (
        <>
            <Head title="Payment History" />

            <div className="bg-[#FBF8F2] px-4 py-8">
                <div className="mx-auto max-w-6xl">
                    <Link
                        href={transactionsIndex().url}
                        className="mb-3 inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-[#2F6F4E] hover:underline"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Billing &amp; Collections
                    </Link>
                    <div className="mb-6">
                        <h1 className="font-serif text-2xl font-semibold text-[#1F2A24]">
                            Payment History
                        </h1>
                        <p className="mt-1 text-sm text-[#1F2A24]/65">
                            Every GCash and cash payment, newest first. Voided
                            payments stay listed so the record is complete.
                        </p>
                    </div>

                    {/* Filters */}
                    <form
                        role="search"
                        onSubmit={(e) => {
                            e.preventDefault();
                            visit({});
                        }}
                        className="mb-4 flex flex-wrap items-end gap-3 rounded-2xl border border-[#1F2A24]/10 bg-white p-4"
                    >
                        <label className="flex w-full flex-col gap-1 text-xs font-medium text-[#1F2A24]/60 sm:w-auto sm:min-w-[220px] sm:flex-1">
                            Search
                            <span className="relative">
                                <Search
                                    className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#1F2A24]/40"
                                    aria-hidden="true"
                                />
                                <input
                                    type="search"
                                    placeholder="Student, LRN, email, OR no., reference or payment ID"
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

                        {selects.map((select) => (
                            <label
                                key={select.key}
                                className="flex w-[calc(50%-0.375rem)] flex-col gap-1 text-xs font-medium text-[#1F2A24]/60 sm:w-auto"
                            >
                                {select.label}
                                <select
                                    value={draft[select.key]}
                                    onChange={(e) =>
                                        update({ [select.key]: e.target.value })
                                    }
                                    className={`${INPUT_CLASS} w-full`}
                                >
                                    <option value="">{select.allLabel}</option>
                                    {select.options.map((option) => (
                                        <option
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        ))}

                        <DateRangePicker
                            from={draft.from}
                            to={draft.to}
                            onChange={(range) => update(range)}
                        />

                        <button
                            type="submit"
                            className="min-h-11 flex-1 rounded-full bg-[#2F6F4E] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#25573E] sm:flex-none"
                        >
                            Search
                        </button>

                        {hasFilters && (
                            <button
                                type="button"
                                onClick={() => {
                                    setDraft(EMPTY_FILTERS);
                                    visit(EMPTY_FILTERS);
                                }}
                                className="min-h-10 rounded-full px-3 text-sm font-medium text-[#1F2A24]/60 hover:text-[#1F2A24]"
                            >
                                Clear
                            </button>
                        )}
                    </form>

                    {/* Cards on phones */}
                    <ul className="space-y-3 md:hidden">
                        {payments.data.map((payment) => {
                            const student = payment.enrollment.student;
                            const isVoided = payment.status === 'VOIDED';

                            return (
                                <li key={payment.id}>
                                    <Link
                                        href={transactionShow(payment.id).url}
                                        className="block rounded-2xl border border-[#1F2A24]/10 bg-white p-4 transition-colors hover:bg-[#2F6F4E]/5 focus-visible:ring-2 focus-visible:ring-[#2F6F4E] focus-visible:outline-none"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <span
                                                className={`text-lg font-semibold tabular-nums ${isVoided ? 'text-[#1F2A24]/50 line-through' : 'text-[#1F2A24]'}`}
                                            >
                                                {formatCurrency(payment.amount)}
                                            </span>
                                            <span
                                                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[payment.status]}`}
                                            >
                                                {STATUS_LABELS[payment.status]}
                                            </span>
                                        </div>
                                        <p className="mt-1 font-medium break-words text-[#1F2A24]">
                                            {student.last_name},{' '}
                                            {student.first_name}
                                        </p>
                                        <p className="text-xs text-[#1F2A24]/60">
                                            Installment #
                                            {
                                                payment.installment
                                                    .installment_number
                                            }{' '}
                                            · Application #
                                            {payment.enrollment_id}
                                        </p>
                                        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-[#1F2A24]/10 pt-3 text-xs text-[#1F2A24]/70">
                                            <MethodLabel
                                                method={payment.method}
                                            />
                                            <span>
                                                {formatDateTime(
                                                    payment.created_at,
                                                )}
                                            </span>
                                            <span className="w-full truncate font-mono text-[#1F2A24]/60">
                                                {referenceId(payment)}
                                            </span>
                                        </div>
                                    </Link>
                                </li>
                            );
                        })}

                        {payments.data.length === 0 && (
                            <li className="rounded-2xl border border-[#1F2A24]/10 bg-white px-4 py-10 text-center text-sm text-[#1F2A24]/65">
                                No payments found.
                            </li>
                        )}
                    </ul>

                    {/* Table from tablet width up */}
                    <div className="hidden overflow-x-auto rounded-2xl border border-[#1F2A24]/10 bg-white md:block">
                        <table className="min-w-full divide-y divide-[#1F2A24]/10 text-sm">
                            <thead className="bg-[#2F6F4E]/5">
                                <tr>
                                    <th
                                        scope="col"
                                        className={`${TH_CLASS} text-right`}
                                    >
                                        Amount
                                    </th>
                                    <th scope="col" className={TH_CLASS}>
                                        Status
                                    </th>
                                    <th scope="col" className={TH_CLASS}>
                                        Method
                                    </th>
                                    <th scope="col" className={TH_CLASS}>
                                        Description
                                    </th>
                                    <th scope="col" className={TH_CLASS}>
                                        Reference
                                    </th>
                                    <th scope="col" className={TH_CLASS}>
                                        Date
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#1F2A24]/10">
                                {payments.data.map((payment) => {
                                    const student = payment.enrollment.student;
                                    const href = transactionShow(
                                        payment.id,
                                    ).url;
                                    const isVoided =
                                        payment.status === 'VOIDED';

                                    return (
                                        <tr
                                            key={payment.id}
                                            onClick={() => router.visit(href)}
                                            className="cursor-pointer hover:bg-[#2F6F4E]/5"
                                        >
                                            <td
                                                className={`px-4 py-3 text-right font-semibold whitespace-nowrap tabular-nums ${isVoided ? 'text-[#1F2A24]/50 line-through' : 'text-[#1F2A24]'}`}
                                            >
                                                <Link
                                                    href={href}
                                                    className="hover:underline focus-visible:underline"
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    {formatCurrency(
                                                        payment.amount,
                                                    )}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[payment.status]}`}
                                                >
                                                    {
                                                        STATUS_LABELS[
                                                            payment.status
                                                        ]
                                                    }
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <MethodLabel
                                                    method={payment.method}
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-[#1F2A24]">
                                                {student.last_name},{' '}
                                                {student.first_name}
                                                <span className="block text-xs text-[#1F2A24]/60">
                                                    Installment #
                                                    {
                                                        payment.installment
                                                            .installment_number
                                                    }{' '}
                                                    · Application #
                                                    {payment.enrollment_id}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-[#1F2A24]/70">
                                                {referenceId(payment)}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-[#1F2A24]/70">
                                                {formatDateTime(
                                                    payment.created_at,
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}

                                {payments.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-4 py-10 text-center text-[#1F2A24]/65"
                                        >
                                            No payments found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-[#1F2A24]/60">
                            {payments.total > 0
                                ? `Showing ${payments.from}–${payments.to} of ${payments.total}`
                                : 'Showing 0 results'}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {payments.links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url ?? '#'}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                    preserveScroll
                                    className={`inline-flex min-h-10 min-w-10 items-center justify-center rounded-full border px-3 text-sm ${
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
