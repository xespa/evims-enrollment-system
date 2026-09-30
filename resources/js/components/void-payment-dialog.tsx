import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/transactions';

type Props = {
    payment: { id: number; receipt_number: string | null };
    /** The whole receipt: a payment split across installments shares one OR. */
    receiptTotal: number;
    receiptParts: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

/**
 * Voids a counter payment recorded by mistake. The whole receipt is voided;
 * it stays on record (with who, when and why), and its installments reopen.
 */
export default function VoidPaymentDialog({
    payment,
    receiptTotal,
    receiptParts,
    open,
    onOpenChange,
}: Props) {
    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({ reason: '' });

    const close = (isOpen: boolean) => {
        if (!isOpen) {
            reset();
            clearErrors();
        }
        onOpenChange(isOpen);
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('admin.payments.void', payment.id), {
            preserveScroll: true,
            onSuccess: () => close(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={close}>
            <DialogContent
                aria-describedby="void-payment-summary"
                className="rounded-2xl border-[#1F2A24]/10 bg-white p-0 text-[#1F2A24] sm:max-w-md"
            >
                <form onSubmit={submit}>
                    <DialogHeader className="border-b border-[#1F2A24]/10 px-6 py-5 pr-12 text-left">
                        <DialogTitle className="font-serif text-xl font-semibold">
                            Void{' '}
                            {payment.receipt_number
                                ? `OR ${payment.receipt_number}`
                                : 'this payment'}
                            ?
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 px-6 py-5">
                        <p
                            id="void-payment-summary"
                            className="text-sm text-[#1F2A24]/75"
                        >
                            <span className="font-semibold tabular-nums">
                                {formatCurrency(receiptTotal)}
                            </span>
                            {receiptParts > 1 &&
                                ` across ${receiptParts} installments`}{' '}
                            will stop counting as paid and the balance goes back
                            up. The payment stays on record as voided — it isn't
                            deleted.
                        </p>

                        <div>
                            <label
                                htmlFor="void-reason"
                                className="mb-1 block text-sm font-medium text-[#1F2A24]/80"
                            >
                                Reason{' '}
                                <span
                                    className="text-[#C6473B]"
                                    aria-hidden="true"
                                >
                                    *
                                </span>
                            </label>
                            <textarea
                                id="void-reason"
                                required
                                autoFocus
                                rows={3}
                                maxLength={255}
                                placeholder="e.g. Recorded on the wrong student"
                                value={data.reason}
                                onChange={(e) =>
                                    setData('reason', e.target.value)
                                }
                                aria-invalid={errors.reason ? true : undefined}
                                className="w-full rounded-lg border border-[#1F2A24]/15 bg-white px-3 py-2 text-sm focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none aria-[invalid=true]:border-[#C6473B]"
                            />
                            {errors.reason ? (
                                <p className="mt-1 text-xs text-[#C6473B]">
                                    {errors.reason}
                                </p>
                            ) : (
                                <p className="mt-1 text-xs text-[#1F2A24]/55">
                                    The parent is notified, and this reason is
                                    kept with the payment.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col-reverse gap-2 border-t border-[#1F2A24]/10 px-6 py-4 sm:flex-row sm:justify-end">
                        <DialogClose asChild>
                            <button
                                type="button"
                                className="min-h-10 rounded-full border border-[#1F2A24]/15 px-5 text-sm font-medium hover:bg-[#1F2A24]/5"
                            >
                                Keep payment
                            </button>
                        </DialogClose>
                        <button
                            type="submit"
                            disabled={
                                processing || data.reason.trim().length < 5
                            }
                            className="min-h-10 rounded-full bg-[#C6473B] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#A83A30] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {processing ? 'Voiding…' : 'Void payment'}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
