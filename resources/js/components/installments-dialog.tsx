import { Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/transactions';
import { cn } from '@/lib/utils';
import { show as enrollmentShow } from '@/routes/admin/enrollments';

export type ScheduledPayment = {
    id: number;
    amount: number;
    method: 'CASH' | 'GCASH';
    receipt_number: string | null;
    status: 'COMPLETED' | 'VOIDED';
    paid_at: string | null;
};

/** One installment as App\Models\Enrollment::installmentSchedule() sends it. */
export type ScheduledInstallment = {
    id: number;
    installment_number: number;
    due_date: string;
    amount_due: number;
    paid: number;
    status: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
    payments: ScheduledPayment[];
};

type Props = {
    enrollmentId: number;
    studentName: string;
    channelLabel: string;
    installments: ScheduledInstallment[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /**
     * Opens the counter payment form, optionally set to settle up to the
     * given installment; left out when staff can't record one.
     */
    onRecordPayment?: (settleThroughInstallmentId?: number) => void;
};

const STATUS = {
    UNPAID: { label: 'Unpaid', className: 'bg-gray-100 text-gray-700' },
    PARTIALLY_PAID: {
        label: 'Partially paid',
        className: 'bg-yellow-100 text-yellow-800',
    },
    PAID: { label: 'Paid', className: 'bg-green-100 text-green-800' },
};

const METHOD_LABELS = { CASH: 'Cash', GCASH: 'GCash' };

function formatShortDate(value: string) {
    return new Date(value).toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

/**
 * An application's installment schedule and the payments made on each,
 * for staff to check at a glance and record a counter payment from.
 */
export default function InstallmentsDialog({
    enrollmentId,
    studentName,
    channelLabel,
    installments,
    open,
    onOpenChange,
    onRecordPayment,
}: Props) {
    const totalDue = installments.reduce((sum, i) => sum + i.amount_due, 0);
    const totalPaid = installments.reduce((sum, i) => sum + i.paid, 0);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-ink/10 bg-surface p-0 text-ink sm:max-w-lg">
                <DialogHeader className="border-b border-ink/10 px-6 py-5 pr-12 text-left">
                    <DialogTitle className="font-serif text-xl font-semibold">
                        Installments · {studentName}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-ink/70">
                        Paid{' '}
                        <span className="font-semibold text-brand-ink tabular-nums">
                            {formatCurrency(totalPaid)}
                        </span>{' '}
                        of{' '}
                        <span className="font-semibold text-ink tabular-nums">
                            {formatCurrency(totalDue)}
                        </span>{' '}
                        · Pays with {channelLabel}
                    </DialogDescription>
                </DialogHeader>

                <ol className="divide-y divide-ink/10 px-6">
                    {installments.map((installment) => {
                        const status = STATUS[installment.status];

                        return (
                            <li key={installment.id} className="py-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <p className="text-sm font-medium">
                                            Installment #
                                            {installment.installment_number}
                                        </p>
                                        <p className="text-xs text-ink/60">
                                            Due{' '}
                                            {formatShortDate(
                                                installment.due_date,
                                            )}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm tabular-nums">
                                            {formatCurrency(installment.paid)}{' '}
                                            <span className="text-ink/55">
                                                /{' '}
                                                {formatCurrency(
                                                    installment.amount_due,
                                                )}
                                            </span>
                                        </span>
                                        <span
                                            className={cn(
                                                'rounded-full px-2.5 py-0.5 text-xs font-medium',
                                                status.className,
                                            )}
                                        >
                                            {status.label}
                                        </span>
                                        {onRecordPayment &&
                                            installment.status !== 'PAID' && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        onRecordPayment(
                                                            installment.id,
                                                        )
                                                    }
                                                    title={`Record a counter payment that settles up to installment #${installment.installment_number}`}
                                                    className="inline-flex min-h-8 items-center gap-1 rounded-full border border-brand/30 px-2.5 text-xs font-semibold text-brand-ink transition-colors hover:bg-brand/5"
                                                >
                                                    <Plus
                                                        className="h-3.5 w-3.5"
                                                        aria-hidden="true"
                                                    />
                                                    Add record
                                                </button>
                                            )}
                                    </div>
                                </div>

                                {installment.payments.length > 0 && (
                                    <ul className="mt-2 space-y-1 rounded-lg bg-ink/[0.03] px-3 py-2">
                                        {installment.payments.map((payment) => {
                                            const isVoided =
                                                payment.status === 'VOIDED';

                                            return (
                                                <li
                                                    key={payment.id}
                                                    className={cn(
                                                        'flex flex-wrap justify-between gap-x-3 text-xs text-ink/75',
                                                        isVoided &&
                                                            'line-through opacity-60',
                                                    )}
                                                >
                                                    <span>
                                                        {METHOD_LABELS[
                                                            payment.method
                                                        ] ?? payment.method}
                                                        {payment.paid_at &&
                                                            ` · ${formatShortDate(payment.paid_at)}`}
                                                        {payment.receipt_number &&
                                                            ` · OR ${payment.receipt_number}`}
                                                        {isVoided &&
                                                            ' · Voided'}
                                                    </span>
                                                    <span className="font-medium tabular-nums">
                                                        {formatCurrency(
                                                            payment.amount,
                                                        )}
                                                    </span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </li>
                        );
                    })}
                </ol>

                <div className="flex flex-wrap items-center justify-end gap-3 border-t border-ink/10 px-6 py-4">
                    {onRecordPayment && (
                        <button
                            type="button"
                            onClick={() => onRecordPayment()}
                            className="min-h-9 rounded-full bg-brand px-4 text-xs font-semibold text-white transition-colors hover:bg-brand-deep"
                        >
                            Record counter payment
                        </button>
                    )}
                    <Link
                        href={enrollmentShow(enrollmentId).url}
                        className="text-sm font-semibold text-brand-ink hover:underline"
                    >
                        Open application
                    </Link>
                </div>
            </DialogContent>
        </Dialog>
    );
}
