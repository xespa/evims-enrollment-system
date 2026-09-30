import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/transactions';

export type UnpaidInstallment = {
    id: number;
    installment_number: number;
    /** What's still owed on it. */
    owed: number;
};

type Props = {
    enrollmentId: number;
    /** Shown under the title, e.g. on the Students list where many rows share one dialog. */
    studentName?: string;
    /** Unpaid installments in due-date order. */
    unpaidInstallments: UnpaidInstallment[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

function toDateInputValue(date: Date) {
    const pad = (n: number) => String(n).padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const INPUT_CLASS =
    'min-h-10 w-full rounded-lg border border-[#1F2A24]/15 bg-white px-3 py-2 text-sm focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none aria-[invalid=true]:border-[#C6473B]';

/**
 * Records money paid at the school cashier. The amount is applied to the
 * unpaid installments in due-date order (the server does the same split),
 * so a single payment can settle several installments at once, and their
 * statuses update. Remount it per opening so it starts from the latest
 * balance.
 */
export default function RecordCounterPaymentDialog({
    enrollmentId,
    studentName,
    unpaidInstallments,
    open,
    onOpenChange,
}: Props) {
    const today = toDateInputValue(new Date());
    const nextAmount = unpaidInstallments[0]?.owed ?? 0;
    const fullBalance = unpaidInstallments.reduce((s, i) => s + i.owed, 0);

    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            amount: nextAmount.toFixed(2),
            receipt_number: '',
            paid_on: today,
        });

    // How the entered amount would be split, shown before saving.
    let left = Math.round(Number(data.amount || 0) * 100) / 100;
    const allocation: {
        installment: UnpaidInstallment;
        applied: number;
        settles: boolean;
    }[] = [];
    for (const installment of unpaidInstallments) {
        if (left <= 0) break;
        const applied = Math.min(left, installment.owed);
        allocation.push({
            installment,
            applied,
            settles: applied >= installment.owed - 0.004,
        });
        left = Math.round((left - applied) * 100) / 100;
    }
    const exceedsBalance = Number(data.amount) > fullBalance + 0.004;

    const close = (isOpen: boolean) => {
        if (!isOpen) {
            reset();
            clearErrors();
        }
        onOpenChange(isOpen);
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('admin.enrollments.cash-payments.store', enrollmentId), {
            preserveScroll: true,
            onSuccess: () => close(false),
        });
    };

    const amountButtonClass = (active: boolean) =>
        `min-h-9 rounded-full border px-3 text-xs font-medium transition-colors ${
            active
                ? 'border-[#2F6F4E] bg-[#2F6F4E]/10 text-[#2F6F4E]'
                : 'border-[#1F2A24]/15 text-[#1F2A24]/70 hover:bg-[#1F2A24]/5'
        }`;

    return (
        <Dialog open={open} onOpenChange={close}>
            <DialogContent
                // With no student line there's no description; say so, so
                // the dialog doesn't warn about a missing one.
                {...(studentName ? {} : { 'aria-describedby': undefined })}
                className="max-h-[calc(100vh-2rem)] gap-0 overflow-y-auto rounded-2xl border-[#1F2A24]/10 bg-white p-0 text-[#1F2A24] sm:max-w-lg"
            >
                <form onSubmit={submit}>
                    <DialogHeader className="border-b border-[#1F2A24]/10 px-6 py-5 pr-12 text-left">
                        <DialogTitle className="font-serif text-xl font-semibold">
                            Record counter payment
                        </DialogTitle>
                        {studentName && (
                            <DialogDescription className="text-sm text-[#1F2A24]/65">
                                {studentName} · Application #{enrollmentId}
                            </DialogDescription>
                        )}
                    </DialogHeader>

                    <div className="space-y-5 px-6 py-5">
                        <div>
                            <label
                                htmlFor="counter-amount"
                                className="mb-1 block text-sm font-medium text-[#1F2A24]/80"
                            >
                                Amount received
                            </label>
                            <div className="relative">
                                <span
                                    className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-[#1F2A24]/50"
                                    aria-hidden="true"
                                >
                                    ₱
                                </span>
                                <input
                                    id="counter-amount"
                                    type="number"
                                    inputMode="decimal"
                                    step="0.01"
                                    min="0.01"
                                    max={fullBalance.toFixed(2)}
                                    required
                                    autoFocus
                                    value={data.amount}
                                    onChange={(e) =>
                                        setData('amount', e.target.value)
                                    }
                                    aria-invalid={
                                        errors.amount || exceedsBalance
                                            ? true
                                            : undefined
                                    }
                                    aria-describedby="counter-amount-help"
                                    className={`${INPUT_CLASS} pl-7 tabular-nums`}
                                />
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setData('amount', nextAmount.toFixed(2))
                                    }
                                    className={amountButtonClass(
                                        Number(data.amount) ===
                                            Number(nextAmount.toFixed(2)),
                                    )}
                                >
                                    Next installment ·{' '}
                                    {formatCurrency(nextAmount)}
                                </button>
                                {unpaidInstallments.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setData(
                                                'amount',
                                                fullBalance.toFixed(2),
                                            )
                                        }
                                        className={amountButtonClass(
                                            Number(data.amount) ===
                                                Number(fullBalance.toFixed(2)),
                                        )}
                                    >
                                        Full balance ·{' '}
                                        {formatCurrency(fullBalance)}
                                    </button>
                                )}
                            </div>
                            <p
                                id="counter-amount-help"
                                className={`mt-1 text-xs ${errors.amount || exceedsBalance ? 'text-[#C6473B]' : 'text-[#1F2A24]/55'}`}
                            >
                                {errors.amount ??
                                    (exceedsBalance
                                        ? `That's more than the remaining balance of ${formatCurrency(fullBalance)}.`
                                        : `Remaining balance: ${formatCurrency(fullBalance)}`)}
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="counter-receipt"
                                    className="mb-1 block text-sm font-medium text-[#1F2A24]/80"
                                >
                                    OR / receipt no.{' '}
                                    <span
                                        className="text-[#C6473B]"
                                        aria-hidden="true"
                                    >
                                        *
                                    </span>
                                </label>
                                <input
                                    id="counter-receipt"
                                    type="text"
                                    required
                                    autoComplete="off"
                                    placeholder="From the official receipt"
                                    maxLength={50}
                                    value={data.receipt_number}
                                    onChange={(e) =>
                                        setData(
                                            'receipt_number',
                                            e.target.value,
                                        )
                                    }
                                    aria-invalid={
                                        errors.receipt_number ? true : undefined
                                    }
                                    className={INPUT_CLASS}
                                />
                                {errors.receipt_number && (
                                    <p className="mt-1 text-xs text-[#C6473B]">
                                        {errors.receipt_number}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label
                                    htmlFor="counter-paid-on"
                                    className="mb-1 block text-sm font-medium text-[#1F2A24]/80"
                                >
                                    Date paid
                                </label>
                                <input
                                    id="counter-paid-on"
                                    type="date"
                                    max={today}
                                    required
                                    value={data.paid_on}
                                    onChange={(e) =>
                                        setData('paid_on', e.target.value)
                                    }
                                    aria-invalid={
                                        errors.paid_on ? true : undefined
                                    }
                                    className={INPUT_CLASS}
                                />
                                {errors.paid_on && (
                                    <p className="mt-1 text-xs text-[#C6473B]">
                                        {errors.paid_on}
                                    </p>
                                )}
                            </div>
                        </div>

                        {allocation.length > 0 && !exceedsBalance && (
                            <div className="rounded-xl bg-[#FBF8F2] p-4">
                                <p className="mb-2 text-xs font-semibold tracking-wide text-[#1F2A24]/55 uppercase">
                                    This will pay
                                </p>
                                <ul className="space-y-1.5 text-sm">
                                    {allocation.map(
                                        ({ installment, applied, settles }) => (
                                            <li
                                                key={installment.id}
                                                className="flex justify-between gap-3"
                                            >
                                                <span>
                                                    Installment #
                                                    {
                                                        installment.installment_number
                                                    }
                                                    <span className="ml-2 text-xs text-[#1F2A24]/55">
                                                        {settles
                                                            ? '→ Paid'
                                                            : '→ Partially paid'}
                                                    </span>
                                                </span>
                                                <span className="tabular-nums">
                                                    {formatCurrency(applied)}
                                                </span>
                                            </li>
                                        ),
                                    )}
                                </ul>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col-reverse gap-2 border-t border-[#1F2A24]/10 px-6 py-4 sm:flex-row sm:justify-end">
                        <DialogClose asChild>
                            <button
                                type="button"
                                className="min-h-10 rounded-full border border-[#1F2A24]/15 px-5 text-sm font-medium hover:bg-[#1F2A24]/5"
                            >
                                Cancel
                            </button>
                        </DialogClose>
                        <button
                            type="submit"
                            disabled={
                                processing ||
                                exceedsBalance ||
                                !(Number(data.amount) > 0) ||
                                !data.receipt_number.trim()
                            }
                            className="min-h-10 rounded-full bg-[#2F6F4E] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#25573E] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {processing ? 'Saving…' : 'Record payment'}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
