import { Loader2, Printer } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    STATUS_LABELS,
    STATUS_STYLES,
    formatCurrency,
    formatDateTime,
} from '@/lib/transactions';
import type { TransactionStatus } from '@/lib/transactions';

/** One paper receipt, however many installments it was split across. */
type CounterReceipt = {
    id: number;
    receipt_number: string | null;
    paid_at: string | null;
    amount: number;
    status: TransactionStatus;
    received_from: string | null;
    payment_form: 'CASH' | 'CHECK' | null;
    check_bank: string | null;
    check_number: string | null;
    recorded_by: string | null;
    installment_numbers: number[];
};

type Props = {
    enrollmentId: number;
};

/**
 * The counter payments already recorded on an application, newest first,
 * so the cashier can check what was paid before issuing another receipt.
 */
export default function CounterPaymentHistory({ enrollmentId }: Props) {
    const [receipts, setReceipts] = useState<CounterReceipt[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        const controller = new AbortController();

        (async () => {
            try {
                const response = await fetch(
                    route(
                        'admin.enrollments.cash-payments.index',
                        enrollmentId,
                    ),
                    {
                        headers: {
                            Accept: 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        signal: controller.signal,
                    },
                );

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                setReceipts((await response.json()).receipts);
            } catch (error) {
                if ((error as Error).name !== 'AbortError') {
                    setHasError(true);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        })();

        return () => controller.abort();
    }, [enrollmentId]);

    const activeTotal = receipts
        .filter((receipt) => receipt.status === 'COMPLETED')
        .reduce((sum, receipt) => sum + receipt.amount, 0);

    return (
        <section aria-labelledby="counter-history-heading">
            <div className="mb-2 flex items-baseline justify-between gap-3">
                <h3
                    id="counter-history-heading"
                    className="text-xs font-semibold tracking-wide text-[#1F2A24]/60 uppercase"
                >
                    Earlier counter payments
                </h3>
                {receipts.length > 0 && (
                    <span className="text-xs text-[#1F2A24]/55 tabular-nums">
                        {formatCurrency(activeTotal)} paid at the counter
                    </span>
                )}
            </div>

            {isLoading ? (
                <p className="flex items-center gap-2 rounded-xl border border-[#1F2A24]/10 px-3 py-3 text-sm text-[#1F2A24]/55">
                    <Loader2
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                    />
                    Loading earlier payments…
                </p>
            ) : hasError ? (
                <p className="rounded-xl border border-[#C6473B]/30 bg-[#C6473B]/5 px-3 py-3 text-sm text-[#A83A30]">
                    Couldn't load the earlier payments. You can still record
                    this one.
                </p>
            ) : receipts.length === 0 ? (
                <p className="rounded-xl border border-[#1F2A24]/10 px-3 py-3 text-sm text-[#1F2A24]/55">
                    No counter payments yet. This is the first receipt for this
                    application.
                </p>
            ) : (
                <ul className="max-h-56 divide-y divide-[#1F2A24]/10 overflow-y-auto rounded-xl border border-[#1F2A24]/10">
                    {receipts.map((receipt) => (
                        <li
                            key={receipt.id}
                            className={`flex flex-wrap items-start justify-between gap-x-4 gap-y-1 px-3 py-2.5 text-sm ${receipt.status === 'VOIDED' ? 'text-[#1F2A24]/50' : ''}`}
                        >
                            <div className="min-w-0">
                                <p className="flex flex-wrap items-center gap-2">
                                    <span className="font-medium">
                                        {receipt.receipt_number
                                            ? `OR ${receipt.receipt_number}`
                                            : 'No OR number'}
                                    </span>
                                    <span className="text-xs text-[#1F2A24]/55">
                                        {receipt.payment_form === 'CHECK'
                                            ? `Check${receipt.check_bank ? ` · ${receipt.check_bank}` : ''}${receipt.check_number ? ` #${receipt.check_number}` : ''}`
                                            : 'Cash'}
                                    </span>
                                    {receipt.status !== 'COMPLETED' && (
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[receipt.status]}`}
                                        >
                                            {STATUS_LABELS[receipt.status]}
                                        </span>
                                    )}
                                </p>
                                <p className="text-xs text-[#1F2A24]/55">
                                    {receipt.paid_at
                                        ? formatDateTime(receipt.paid_at)
                                        : '—'}
                                    {receipt.installment_numbers.length > 0 &&
                                        ` · Installment ${receipt.installment_numbers.map((n) => `#${n}`).join(', ')}`}
                                    {receipt.received_from &&
                                        ` · From ${receipt.received_from}`}
                                    {receipt.recorded_by &&
                                        ` · By ${receipt.recorded_by}`}
                                </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span
                                    className={`tabular-nums ${receipt.status === 'VOIDED' ? 'line-through' : 'font-medium'}`}
                                >
                                    {formatCurrency(receipt.amount)}
                                </span>
                                {receipt.status === 'COMPLETED' &&
                                    receipt.receipt_number && (
                                        <a
                                            href={route(
                                                'admin.payments.receipt.show',
                                                receipt.id,
                                            )}
                                            target="_blank"
                                            rel="noopener"
                                            aria-label={`Print OR ${receipt.receipt_number}`}
                                            className="inline-flex items-center gap-1 text-xs font-medium text-[#2F6F4E] underline-offset-4 hover:text-[#25573E] hover:underline"
                                        >
                                            <Printer
                                                className="h-3.5 w-3.5"
                                                aria-hidden="true"
                                            />
                                            Print
                                        </a>
                                    )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
