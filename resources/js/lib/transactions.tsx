import { Banknote, Smartphone } from 'lucide-react';

export type TransactionStatus = 'COMPLETED' | 'PENDING' | 'FAILED';

export const STATUS_LABELS: Record<TransactionStatus, string> = {
    COMPLETED: 'Paid',
    PENDING: 'Pending',
    FAILED: 'Failed',
};

export const STATUS_STYLES: Record<TransactionStatus, string> = {
    COMPLETED: 'bg-[#2F6F4E]/10 text-[#2F6F4E]',
    PENDING: 'bg-[#E8A33D]/15 text-[#a4670f]',
    FAILED: 'bg-[#C6473B]/10 text-[#A83A30]',
};

export function formatCurrency(value: number | string) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
    }).format(Number(value));
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
 * ID once paid, otherwise the checkout source ID), or a receipt-style
 * number for cash payments recorded at the counter.
 */
export function referenceId(transaction: {
    id: number;
    method: string;
    paymongo_payment_intent_id: string | null;
    paymongo_source_id: string | null;
}) {
    if (transaction.method === 'CASH') {
        return `CASH-${String(transaction.id).padStart(6, '0')}`;
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
        <span className="inline-flex items-center gap-1.5 text-[#1F2A24]/80">
            <Icon className="h-4 w-4 text-[#1F2A24]/50" aria-hidden="true" />
            {method === 'CASH' ? 'Cash' : 'GCash'}
        </span>
    );
}
