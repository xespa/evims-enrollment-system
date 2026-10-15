import { Banknote, Smartphone, Receipt } from 'lucide-react';
import {
    STATUS_LABELS,
    STATUS_STYLES,
    formatCurrency,
} from '@/lib/transactions';
import { studentName } from '@/lib/portal-enrollment';
import { cn } from '@/lib/utils';
import type { PortalEnrollment, PortalPayment } from '@/types/portal';

type PaymentRow = PortalPayment & {
    installment_number: number;
    student_name: string;
};

const METHOD_LABELS: Record<PortalPayment['method'], string> = {
    GCASH: 'GCash',
    CASH: 'Cash',
};

function paymentDate(payment: PortalPayment): string {
    return new Date(payment.paid_at ?? payment.created_at).toLocaleDateString(
        'en-PH',
        { year: 'numeric', month: 'short', day: 'numeric' },
    );
}

/** Every payment across every enrollment, newest first. */
export function paymentRows(enrollments: PortalEnrollment[]): PaymentRow[] {
    return enrollments
        .flatMap((enrollment) =>
            (enrollment.billing_contract?.installments ?? []).flatMap(
                (installment) =>
                    installment.payments.map((payment) => ({
                        ...payment,
                        installment_number: installment.installment_number,
                        student_name: studentName(enrollment),
                    })),
            ),
        )
        .sort(
            (a, b) =>
                new Date(b.paid_at ?? b.created_at).getTime() -
                new Date(a.paid_at ?? a.created_at).getTime(),
        );
}

function StatusPill({ status }: { status: PortalPayment['status'] }) {
    return (
        <span
            className={cn(
                'rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
                STATUS_STYLES[status],
            )}
        >
            {STATUS_LABELS[status] ?? status}
        </span>
    );
}

function MethodLabel({ method }: { method: PortalPayment['method'] }) {
    const Icon = method === 'GCASH' ? Smartphone : Banknote;

    return (
        <span className="inline-flex items-center gap-1.5">
            <Icon
                className="h-3.5 w-3.5 text-ink/50"
                aria-hidden="true"
            />
            {METHOD_LABELS[method] ?? method}
        </span>
    );
}

export default function PaymentHistory({ rows }: { rows: PaymentRow[] }) {
    if (rows.length === 0) {
        return (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-ink/20 bg-surface px-6 py-10 text-center">
                <Receipt
                    className="h-8 w-8 text-ink/30"
                    aria-hidden="true"
                />
                <p className="text-sm font-medium text-ink">
                    No payments yet
                </p>
                <p className="max-w-sm text-sm text-ink/65">
                    Payments appear here once an application is approved and
                    tuition is paid online or at the cashier.
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-ink/10 bg-surface shadow-sm">
            <ul className="divide-y divide-ink/5 sm:hidden">
                {rows.map((payment) => (
                    <li key={payment.id} className="flex flex-col gap-1 p-4">
                        <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-ink tabular-nums">
                                {formatCurrency(payment.amount)}
                            </span>
                            <StatusPill status={payment.status} />
                        </div>
                        <p className="text-sm text-ink/80">
                            {payment.student_name} · Installment #
                            {payment.installment_number}
                        </p>
                        <p className="flex flex-wrap items-center gap-x-2 text-xs text-ink/65">
                            <span>{paymentDate(payment)}</span>
                            <span aria-hidden="true">·</span>
                            <MethodLabel method={payment.method} />
                            {payment.receipt_number && (
                                <>
                                    <span aria-hidden="true">·</span>
                                    <span>
                                        Receipt No. {payment.receipt_number}
                                    </span>
                                </>
                            )}
                        </p>
                    </li>
                ))}
            </ul>

            <div className="hidden overflow-x-auto p-5 sm:block">
                <table className="w-full text-left text-sm">
                    <caption className="sr-only">Payment history</caption>
                    <thead>
                        <tr className="text-xs text-ink/65">
                            <th scope="col" className="pb-2 font-medium">
                                Date
                            </th>
                            <th scope="col" className="pb-2 font-medium">
                                Student
                            </th>
                            <th scope="col" className="pb-2 font-medium">
                                Installment
                            </th>
                            <th scope="col" className="pb-2 font-medium">
                                Method
                            </th>
                            <th scope="col" className="pb-2 font-medium">
                                Receipt No.
                            </th>
                            <th
                                scope="col"
                                className="pb-2 text-right font-medium"
                            >
                                Amount
                            </th>
                            <th scope="col" className="pb-2 pl-4 font-medium">
                                Status
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-ink/5">
                        {rows.map((payment) => (
                            <tr key={payment.id}>
                                <td className="py-2.5 whitespace-nowrap text-ink/80">
                                    {paymentDate(payment)}
                                </td>
                                <td className="py-2.5 text-ink/80">
                                    {payment.student_name}
                                </td>
                                <td className="py-2.5 text-ink/80 tabular-nums">
                                    #{payment.installment_number}
                                </td>
                                <td className="py-2.5 text-ink/80">
                                    <MethodLabel method={payment.method} />
                                </td>
                                <td className="py-2.5 text-ink/80 tabular-nums">
                                    {payment.receipt_number ?? '—'}
                                </td>
                                <td className="py-2.5 text-right font-medium whitespace-nowrap text-ink tabular-nums">
                                    {formatCurrency(payment.amount)}
                                </td>
                                <td className="py-2.5 pl-4">
                                    <StatusPill status={payment.status} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
