import { Banknote, Smartphone } from 'lucide-react';

export type TransactionStatus = 'COMPLETED' | 'PENDING' | 'FAILED' | 'VOIDED';

export const STATUS_LABELS: Record<TransactionStatus, string> = {
    COMPLETED: 'Paid',
    PENDING: 'Pending',
    FAILED: 'Failed',
    VOIDED: 'Voided',
};

export const STATUS_STYLES: Record<TransactionStatus, string> = {
    COMPLETED: 'bg-brand/10 text-brand-ink',
    PENDING: 'bg-warn/15 text-warn-ink',
    FAILED: 'bg-danger/10 text-danger-alert',
    VOIDED: 'bg-ink/10 text-ink/70',
};

export function formatCurrency(value: number | string) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
    }).format(Number(value));
}

/** Formats a calendar date ("2026-10-01") without shifting it across time zones. */
export function formatDate(value: string) {
    return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString(
        'en-PH',
        { month: 'short', day: 'numeric', year: 'numeric' },
    );
}

const ONES = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
];
const TENS = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
];
const SCALES = ['', 'Thousand', 'Million', 'Billion'];

function belowThousandInWords(n: number) {
    const words: string[] = [];

    if (n >= 100) {
        words.push(`${ONES[Math.floor(n / 100)]} Hundred`);
        n %= 100;
    }

    if (n >= 20) {
        words.push(
            n % 10
                ? `${TENS[Math.floor(n / 10)]}-${ONES[n % 10]}`
                : TENS[n / 10],
        );
    } else if (n > 0) {
        words.push(ONES[n]);
    }

    return words.join(' ');
}

/**
 * Spells out a peso amount the way it's written on a receipt's "the sum of"
 * line, e.g. 2500.5 → "Two Thousand Five Hundred and 50/100".
 */
export function amountInWords(value: number) {
    const cents = Math.round(value * 100);
    let pesos = Math.floor(cents / 100);
    const centavos = cents % 100;

    const groups: string[] = [];
    for (let scale = 0; pesos > 0; scale++, pesos = Math.floor(pesos / 1000)) {
        const group = pesos % 1000;
        if (group > 0) {
            groups.unshift(
                [belowThousandInWords(group), SCALES[scale]]
                    .filter(Boolean)
                    .join(' '),
            );
        }
    }

    const words = groups.join(' ') || 'Zero';

    return centavos > 0
        ? `${words} and ${String(centavos).padStart(2, '0')}/100`
        : words;
}

export function formatDateTime(value: string) {
    return new Date(value).toLocaleString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

/**
 * The ID a registrar would look up in the PayMongo dashboard (the payment
 * ID once paid, otherwise the checkout source ID), or for counter payments
 * the official receipt (OR) number, falling back to a receipt-style number.
 */
export function referenceId(transaction: {
    id: number;
    method: string;
    receipt_number?: string | null;
    paymongo_payment_intent_id: string | null;
    paymongo_source_id: string | null;
}) {
    if (transaction.method === 'CASH') {
        return transaction.receipt_number
            ? `OR ${transaction.receipt_number}`
            : `CASH-${String(transaction.id).padStart(6, '0')}`;
    }

    return (
        transaction.paymongo_payment_intent_id ??
        transaction.paymongo_source_id ??
        '—'
    );
}

export function MethodLabel({ method }: { method: string }) {
    const Icon = method === 'CASH' ? Banknote : Smartphone;

    return (
        <span className="inline-flex items-center gap-1.5 text-ink/80">
            <Icon className="h-4 w-4 text-ink/50" aria-hidden="true" />
            {method === 'CASH' ? 'Cash' : 'GCash'}
        </span>
    );
}
