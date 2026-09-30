import { Loader2, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { UnpaidInstallment } from '@/components/record-counter-payment-dialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/transactions';

export type PayableEnrollment = {
    id: number;
    student_name: string;
    lrn: string | null;
    grade_level: string | null;
    school_year: string;
    payment: {
        status: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
        channel: 'COUNTER' | 'GCASH';
        total: number;
        paid: number;
        balance: number;
        unpaid_installments: UnpaidInstallment[];
    };
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (enrollment: PayableEnrollment) => void;
};

const SEARCH_DELAY_MS = 250;

/**
 * Step one of recording a counter payment from Transactions: find who is
 * paying. Only approved applications that still owe money are listed.
 */
export default function PayableEnrollmentLookupDialog({
    open,
    onOpenChange,
    onSelect,
}: Props) {
    const [search, setSearch] = useState('');
    const [results, setResults] = useState<PayableEnrollment[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false);

    const trimmed = search.trim();

    useEffect(() => {
        if (trimmed.length < 2) {
            setResults([]);
            setIsLoading(false);

            return;
        }

        // Only the latest search counts; slower earlier ones are cancelled.
        const controller = new AbortController();
        setIsLoading(true);
        setHasError(false);

        const timer = setTimeout(async () => {
            try {
                const response = await fetch(
                    route('admin.payable-enrollments.index', {
                        search: trimmed,
                    }),
                    {
                        headers: {
                            Accept: 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        signal: controller.signal,
                    },
                );

                if (!response.ok) throw new Error(String(response.status));

                const body = await response.json();
                setResults(body.results ?? []);
            } catch (error) {
                if ((error as Error).name !== 'AbortError') {
                    setHasError(true);
                    setResults([]);
                }
            } finally {
                if (!controller.signal.aborted) setIsLoading(false);
            }
        }, SEARCH_DELAY_MS);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [trimmed]);

    const close = (isOpen: boolean) => {
        if (!isOpen) {
            setSearch('');
            setResults([]);
            setHasError(false);
        }
        onOpenChange(isOpen);
    };

    return (
        <Dialog open={open} onOpenChange={close}>
            <DialogContent className="flex max-h-[calc(100vh-2rem)] flex-col gap-0 overflow-hidden rounded-2xl border-[#1F2A24]/10 bg-white p-0 text-[#1F2A24] sm:max-w-lg">
                <DialogHeader className="border-b border-[#1F2A24]/10 px-6 py-5 pr-12 text-left">
                    <DialogTitle className="font-serif text-xl font-semibold">
                        Record counter payment
                    </DialogTitle>
                    <DialogDescription className="text-sm text-[#1F2A24]/65">
                        Who is paying?
                    </DialogDescription>
                </DialogHeader>

                <div className="border-b border-[#1F2A24]/10 px-6 py-4">
                    <label htmlFor="payable-search" className="sr-only">
                        Search by student, LRN, reference no. or email
                    </label>
                    <div className="relative">
                        <Search
                            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#1F2A24]/40"
                            aria-hidden="true"
                        />
                        <input
                            id="payable-search"
                            type="search"
                            autoFocus
                            autoComplete="off"
                            placeholder="Student name, LRN, reference no. or email"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="min-h-10 w-full rounded-lg border border-[#1F2A24]/15 bg-white py-2 pr-9 pl-9 text-sm focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none"
                        />
                        {isLoading && (
                            <Loader2
                                className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-[#1F2A24]/40"
                                aria-hidden="true"
                            />
                        )}
                    </div>
                </div>

                <div
                    className="min-h-0 flex-1 overflow-y-auto"
                    aria-live="polite"
                    aria-busy={isLoading}
                >
                    {trimmed.length < 2 ? (
                        <p className="px-6 py-8 text-center text-sm text-[#1F2A24]/55">
                            Type at least 2 characters to search.
                        </p>
                    ) : hasError ? (
                        <p className="px-6 py-8 text-center text-sm text-[#A83A30]">
                            Couldn't search right now. Please try again.
                        </p>
                    ) : !isLoading && results.length === 0 ? (
                        <p className="px-6 py-8 text-center text-sm text-[#1F2A24]/55">
                            No approved application with a balance matches “
                            {trimmed}”.
                        </p>
                    ) : (
                        <ul className="divide-y divide-[#1F2A24]/10">
                            {results.map((result) => (
                                <li key={result.id}>
                                    <button
                                        type="button"
                                        onClick={() => onSelect(result)}
                                        className="flex w-full items-center justify-between gap-4 px-6 py-3 text-left transition-colors hover:bg-[#2F6F4E]/5 focus-visible:bg-[#2F6F4E]/5 focus-visible:outline-none"
                                    >
                                        <span className="min-w-0">
                                            <span className="block truncate text-sm font-medium text-[#1F2A24]">
                                                {result.student_name}
                                            </span>
                                            <span className="block text-xs text-[#1F2A24]/60">
                                                #{result.id}
                                                {result.grade_level &&
                                                    ` · ${result.grade_level}`}{' '}
                                                · S.Y. {result.school_year}
                                                {result.lrn &&
                                                    ` · LRN ${result.lrn}`}
                                            </span>
                                        </span>
                                        <span className="shrink-0 text-right">
                                            <span className="block text-sm font-semibold text-[#1F2A24] tabular-nums">
                                                {formatCurrency(
                                                    result.payment.balance,
                                                )}
                                            </span>
                                            <span className="block text-xs text-[#1F2A24]/55">
                                                balance ·{' '}
                                                {result.payment.channel ===
                                                'GCASH'
                                                    ? 'GCash'
                                                    : 'Counter'}
                                            </span>
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
