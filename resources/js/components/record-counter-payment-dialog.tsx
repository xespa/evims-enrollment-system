import { useForm, usePage } from '@inertiajs/react';
import type { FormEvent, ReactNode } from 'react';
import CounterPaymentHistory from '@/components/counter-payment-history';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { amountInWords, formatCurrency } from '@/lib/transactions';

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

type PaymentForm = 'CASH' | 'CHECK';

function toDateInputValue(date: Date) {
    const pad = (n: number) => String(n).padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const INPUT_CLASS =
    'min-h-10 w-full rounded-lg border border-[#1F2A24]/15 bg-white px-3 py-2 text-sm focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none aria-[invalid=true]:border-[#C6473B] disabled:bg-[#1F2A24]/5 disabled:text-[#1F2A24]/40';

const LABEL_CLASS = 'mb-1 block text-sm font-medium text-[#1F2A24]/80';

function FieldError({ message }: { message?: string }) {
    return message ? (
        <p className="mt-1 text-xs text-[#C6473B]">{message}</p>
    ) : null;
}

function RequiredMark() {
    return (
        <span className="text-[#C6473B]" aria-hidden="true">
            *
        </span>
    );
}

/** A labelled row of the "In settlement of the following" box. */
function SettlementRow({
    label,
    children,
    emphasis = false,
}: {
    label: ReactNode;
    children: ReactNode;
    emphasis?: boolean;
}) {
    return (
        <div
            className={`flex justify-between gap-3 border-t border-[#1F2A24]/10 px-3 py-2 text-sm ${emphasis ? 'font-semibold' : ''}`}
        >
            <span>{label}</span>
            <span className="tabular-nums">{children}</span>
        </div>
    );
}

/**
 * Records money paid at the school cashier, laid out like the paper
 * acknowledgement receipt the cashier fills in. The amount is applied to the
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
    const { auth } = usePage().props;
    const today = toDateInputValue(new Date());
    const nextAmount = unpaidInstallments[0]?.owed ?? 0;
    const fullBalance = unpaidInstallments.reduce((s, i) => s + i.owed, 0);

    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            amount: nextAmount.toFixed(2),
            receipt_number: '',
            paid_on: today,
            received_from: '',
            payment_form: 'CASH' as PaymentForm,
            check_bank: '',
            check_number: '',
            check_date: '',
        });

    const isCheck = data.payment_form === 'CHECK';
    const amount = Number(data.amount || 0);

    // How the entered amount would be split, shown before saving.
    let left = Math.round(amount * 100) / 100;
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
    const exceedsBalance = amount > fullBalance + 0.004;
    const settlesInFull = !exceedsBalance && amount >= fullBalance - 0.004;

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

    const formButtonClass = (active: boolean) =>
        `flex min-h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#2F6F4E]/30 ${
            active
                ? 'border-[#2F6F4E] bg-[#2F6F4E]/10 text-[#2F6F4E]'
                : 'border-[#1F2A24]/15 text-[#1F2A24]/70 hover:bg-[#1F2A24]/5'
        }`;

    const checkDetailsMissing =
        isCheck &&
        (!data.check_bank.trim() ||
            !data.check_number.trim() ||
            !data.check_date);

    return (
        <Dialog open={open} onOpenChange={close}>
            <DialogContent
                // With no student line there's no description; say so, so
                // the dialog doesn't warn about a missing one.
                {...(studentName ? {} : { 'aria-describedby': undefined })}
                className="max-h-[calc(100vh-2rem)] gap-0 overflow-y-auto rounded-2xl border-[#1F2A24]/10 bg-white p-0 text-[#1F2A24] sm:max-w-3xl"
            >
                <form onSubmit={submit}>
                    <DialogHeader className="border-b border-[#1F2A24]/10 px-6 py-5 pr-12 text-left">
                        <div className="flex items-center gap-3">
                            <img
                                src="/images/logoevims.png"
                                alt=""
                                className="h-12 w-12 shrink-0 rounded-full object-contain"
                            />
                            <div className="min-w-0">
                                <p className="text-xs font-semibold tracking-wide text-[#1F2A24]/60 uppercase">
                                    Eastern Visayas International Montessori
                                    School
                                </p>
                                <DialogTitle className="font-serif text-xl font-semibold">
                                    Acknowledgement Receipt
                                </DialogTitle>
                                {studentName && (
                                    <DialogDescription className="text-sm text-[#1F2A24]/65">
                                        {studentName} · Application #
                                        {enrollmentId}
                                    </DialogDescription>
                                )}
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="grid gap-6 px-6 py-5 md:grid-cols-2">
                        <div className="space-y-4 md:order-2">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label
                                        htmlFor="counter-receipt"
                                        className={LABEL_CLASS}
                                    >
                                        No. <RequiredMark />
                                    </label>
                                    <input
                                        id="counter-receipt"
                                        type="text"
                                        required
                                        autoComplete="off"
                                        placeholder="e.g. 0210"
                                        maxLength={50}
                                        value={data.receipt_number}
                                        onChange={(e) =>
                                            setData(
                                                'receipt_number',
                                                e.target.value,
                                            )
                                        }
                                        aria-invalid={
                                            errors.receipt_number
                                                ? true
                                                : undefined
                                        }
                                        className={`${INPUT_CLASS} font-mono tracking-wider text-[#C6473B]`}
                                    />
                                    <FieldError
                                        message={errors.receipt_number}
                                    />
                                </div>
                                <div>
                                    <label
                                        htmlFor="counter-paid-on"
                                        className={LABEL_CLASS}
                                    >
                                        Date
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
                                    <FieldError message={errors.paid_on} />
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor="counter-received-from"
                                    className={LABEL_CLASS}
                                >
                                    Received from
                                </label>
                                <input
                                    id="counter-received-from"
                                    type="text"
                                    autoComplete="off"
                                    placeholder="Parent or guardian who paid"
                                    maxLength={150}
                                    value={data.received_from}
                                    onChange={(e) =>
                                        setData('received_from', e.target.value)
                                    }
                                    aria-invalid={
                                        errors.received_from ? true : undefined
                                    }
                                    className={INPUT_CLASS}
                                />
                                <FieldError message={errors.received_from} />
                            </div>

                            <div>
                                <label
                                    htmlFor="counter-amount"
                                    className={LABEL_CLASS}
                                >
                                    The sum of
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
                                        aria-describedby="counter-amount-words counter-amount-help"
                                        className={`${INPUT_CLASS} pl-7 tabular-nums`}
                                    />
                                </div>
                                {amount > 0 && (
                                    <p
                                        id="counter-amount-words"
                                        className="mt-1.5 border-b border-dashed border-[#1F2A24]/20 pb-1 text-sm text-[#1F2A24]/80 italic"
                                    >
                                        {amountInWords(amount)} Pesos (
                                        {formatCurrency(amount)})
                                    </p>
                                )}
                                <div className="mt-2 flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setData(
                                                'amount',
                                                nextAmount.toFixed(2),
                                            )
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
                                                    Number(
                                                        fullBalance.toFixed(2),
                                                    ),
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
                                            : `In ${settlesInFull ? 'full' : 'partial'} payment for tuition and fees.`)}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4 md:order-1">
                            <div className="overflow-hidden rounded-xl border border-[#1F2A24]/15">
                                <p className="bg-[#FBF8F2] px-3 py-2 text-xs font-semibold tracking-wide text-[#1F2A24]/60 uppercase">
                                    In settlement of the following
                                </p>
                                <div className="grid grid-cols-[1fr_auto_auto] gap-3 border-t border-[#1F2A24]/10 px-3 py-1.5 text-xs font-medium text-[#1F2A24]/55">
                                    <span>Particular</span>
                                    <span className="w-20 text-right">
                                        Unpaid
                                    </span>
                                    <span className="w-20 text-right">
                                        This payment
                                    </span>
                                </div>
                                <ul className="max-h-64 overflow-y-auto">
                                    {unpaidInstallments.map(
                                        (installment, index) => {
                                            const share = exceedsBalance
                                                ? undefined
                                                : allocation.find(
                                                      (a) =>
                                                          a.installment.id ===
                                                          installment.id,
                                                  );
                                            const owedThroughHere =
                                                unpaidInstallments
                                                    .slice(0, index + 1)
                                                    .reduce(
                                                        (s, i) => s + i.owed,
                                                        0,
                                                    );

                                            return (
                                                <li
                                                    key={installment.id}
                                                    className="border-t border-[#1F2A24]/10"
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setData(
                                                                'amount',
                                                                owedThroughHere.toFixed(
                                                                    2,
                                                                ),
                                                            )
                                                        }
                                                        title={`Pay ${formatCurrency(owedThroughHere)} to settle up to installment #${installment.installment_number}`}
                                                        className={`grid w-full grid-cols-[1fr_auto_auto] items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-[#2F6F4E]/5 focus-visible:bg-[#2F6F4E]/5 focus-visible:outline-none ${share ? '' : 'text-[#1F2A24]/55'}`}
                                                    >
                                                        <span>
                                                            Installment #
                                                            {
                                                                installment.installment_number
                                                            }
                                                            {share && (
                                                                <span className="ml-2 text-xs text-[#2F6F4E]">
                                                                    {share.settles
                                                                        ? '→ Paid'
                                                                        : '→ Partially paid'}
                                                                </span>
                                                            )}
                                                        </span>
                                                        <span className="w-20 text-right tabular-nums">
                                                            {formatCurrency(
                                                                installment.owed,
                                                            )}
                                                        </span>
                                                        <span
                                                            className={`w-20 text-right tabular-nums ${share ? 'font-medium' : ''}`}
                                                        >
                                                            {share
                                                                ? formatCurrency(
                                                                      share.applied,
                                                                  )
                                                                : '—'}
                                                        </span>
                                                    </button>
                                                </li>
                                            );
                                        },
                                    )}
                                </ul>
                                <SettlementRow label="Amount due">
                                    {formatCurrency(fullBalance)}
                                </SettlementRow>
                                <SettlementRow label="Total payment" emphasis>
                                    {exceedsBalance
                                        ? '—'
                                        : formatCurrency(amount)}
                                </SettlementRow>
                            </div>

                            <fieldset>
                                <legend className={LABEL_CLASS}>Paid in</legend>
                                <div className="flex gap-2">
                                    {(['CASH', 'CHECK'] as const).map(
                                        (form) => (
                                            <label
                                                key={form}
                                                className={formButtonClass(
                                                    data.payment_form === form,
                                                )}
                                            >
                                                <input
                                                    type="radio"
                                                    name="payment_form"
                                                    value={form}
                                                    checked={
                                                        data.payment_form ===
                                                        form
                                                    }
                                                    onChange={() =>
                                                        setData(
                                                            'payment_form',
                                                            form,
                                                        )
                                                    }
                                                    className="sr-only"
                                                />
                                                {form === 'CASH'
                                                    ? 'Cash'
                                                    : 'Check'}
                                            </label>
                                        ),
                                    )}
                                </div>
                                <FieldError message={errors.payment_form} />
                            </fieldset>

                            {isCheck && (
                                <div className="space-y-3 rounded-xl bg-[#FBF8F2] p-4">
                                    <div>
                                        <label
                                            htmlFor="counter-check-bank"
                                            className={LABEL_CLASS}
                                        >
                                            Bank <RequiredMark />
                                        </label>
                                        <input
                                            id="counter-check-bank"
                                            type="text"
                                            required
                                            autoComplete="off"
                                            maxLength={100}
                                            value={data.check_bank}
                                            onChange={(e) =>
                                                setData(
                                                    'check_bank',
                                                    e.target.value,
                                                )
                                            }
                                            aria-invalid={
                                                errors.check_bank
                                                    ? true
                                                    : undefined
                                            }
                                            className={INPUT_CLASS}
                                        />
                                        <FieldError
                                            message={errors.check_bank}
                                        />
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div>
                                            <label
                                                htmlFor="counter-check-number"
                                                className={LABEL_CLASS}
                                            >
                                                Check no. <RequiredMark />
                                            </label>
                                            <input
                                                id="counter-check-number"
                                                type="text"
                                                required
                                                autoComplete="off"
                                                maxLength={50}
                                                value={data.check_number}
                                                onChange={(e) =>
                                                    setData(
                                                        'check_number',
                                                        e.target.value,
                                                    )
                                                }
                                                aria-invalid={
                                                    errors.check_number
                                                        ? true
                                                        : undefined
                                                }
                                                className={INPUT_CLASS}
                                            />
                                            <FieldError
                                                message={errors.check_number}
                                            />
                                        </div>
                                        <div>
                                            <label
                                                htmlFor="counter-check-date"
                                                className={LABEL_CLASS}
                                            >
                                                Check date <RequiredMark />
                                            </label>
                                            <input
                                                id="counter-check-date"
                                                type="date"
                                                required
                                                value={data.check_date}
                                                onChange={(e) =>
                                                    setData(
                                                        'check_date',
                                                        e.target.value,
                                                    )
                                                }
                                                aria-invalid={
                                                    errors.check_date
                                                        ? true
                                                        : undefined
                                                }
                                                className={INPUT_CLASS}
                                            />
                                            <FieldError
                                                message={errors.check_date}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="px-6 pb-5">
                        <CounterPaymentHistory enrollmentId={enrollmentId} />
                    </div>

                    <div className="flex flex-col gap-4 border-t border-[#1F2A24]/10 px-6 py-4 sm:flex-row sm:items-end sm:justify-between">
                        <div className="text-sm">
                            <p>
                                <span className="text-[#1F2A24]/60">By: </span>
                                <span className="font-medium">
                                    {auth.user.name}
                                </span>
                            </p>
                            <p className="text-xs text-[#1F2A24]/55">
                                Cashier / Authorized Representative
                            </p>
                        </div>
                        <div className="flex flex-col-reverse gap-2 sm:flex-row">
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
                                    !(amount > 0) ||
                                    !data.receipt_number.trim() ||
                                    checkDetailsMissing
                                }
                                className="min-h-10 rounded-full bg-[#2F6F4E] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#25573E] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {processing ? 'Saving…' : 'Record payment'}
                            </button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
