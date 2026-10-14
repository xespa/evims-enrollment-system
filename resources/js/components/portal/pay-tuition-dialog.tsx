import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { studentName } from '@/lib/portal-enrollment';
import { formatCurrency } from '@/lib/transactions';
import { cn } from '@/lib/utils';
import { update as updatePaymentMethod } from '@/routes/portal/enrollments/payment-method';
import type {
    PaymentChannel,
    PortalEnrollment,
    PortalPaymentMethod,
} from '@/types/portal';

type Props = {
    enrollment: PortalEnrollment;
    paymentMethods: PortalPaymentMethod[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

/**
 * Pay Tuition: the parent picks an online method and continues to its
 * payment page. Methods not wired up yet are shown as coming soon.
 */
export default function PayTuitionDialog({
    enrollment,
    paymentMethods,
    open,
    onOpenChange,
}: Props) {
    const error = usePage().props.errors?.payment_channel;
    const current = enrollment.billing_contract?.payment_channel;
    const choosable = paymentMethods.filter((method) => method.available);
    const [selected, setSelected] = useState<PaymentChannel | null>(
        (choosable.find((method) => method.value === current) ?? choosable[0])
            ?.value ?? null,
    );
    const [processing, setProcessing] = useState(false);

    const submit = (e: FormEvent) => {
        e.preventDefault();

        if (!selected) {
            return;
        }

        router.put(
            updatePaymentMethod.url(enrollment.id),
            { payment_channel: selected },
            {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-[#1F2A24]/10 bg-white p-0 text-[#1F2A24] sm:max-w-md">
                <DialogHeader className="border-b border-[#1F2A24]/10 px-6 py-5 pr-12 text-left">
                    <DialogTitle className="font-serif text-xl font-semibold">
                        Pay Tuition
                    </DialogTitle>
                    <DialogDescription className="text-sm text-[#1F2A24]/70">
                        {studentName(enrollment)} · Remaining{' '}
                        <span className="font-semibold text-[#2F6F4E] tabular-nums">
                            {formatCurrency(enrollment.remaining_balance ?? 0)}
                        </span>
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-4 px-6 py-5">
                    <fieldset disabled={processing}>
                        <legend className="mb-2 text-sm font-medium text-[#1F2A24]">
                            Method of payment
                        </legend>
                        <div className="space-y-2">
                            {paymentMethods.map((method) => {
                                const isSelected = selected === method.value;

                                return (
                                    <label
                                        key={method.value}
                                        className={cn(
                                            'flex min-h-11 items-center gap-3 rounded-lg border p-3 transition-colors focus-within:ring-2 focus-within:ring-[#2F6F4E]/30',
                                            !method.available
                                                ? 'cursor-not-allowed border-[#1F2A24]/10 bg-[#1F2A24]/[0.02] opacity-60'
                                                : isSelected
                                                  ? 'cursor-pointer border-[#2F6F4E] bg-[#2F6F4E]/5'
                                                  : 'cursor-pointer border-[#1F2A24]/15 hover:bg-[#1F2A24]/[0.03]',
                                        )}
                                    >
                                        <input
                                            type="radio"
                                            className="h-4 w-4 shrink-0 accent-[#2F6F4E]"
                                            name="payment_channel"
                                            value={method.value}
                                            checked={isSelected}
                                            disabled={!method.available}
                                            onChange={() =>
                                                setSelected(method.value)
                                            }
                                        />
                                        <span className="min-w-0 flex-1">
                                            <span className="flex h-7 items-center">
                                                {method.logo ? (
                                                    <img
                                                        src={method.logo}
                                                        alt={method.label}
                                                        className={cn(
                                                            'h-6 w-auto max-w-28 object-contain',
                                                            !method.available &&
                                                                'grayscale',
                                                        )}
                                                    />
                                                ) : (
                                                    <span className="text-sm font-medium text-[#1F2A24]">
                                                        {method.label}
                                                    </span>
                                                )}
                                            </span>
                                            <span className="mt-0.5 block text-xs text-[#1F2A24]/70">
                                                {method.description}
                                            </span>
                                        </span>
                                        {!method.available && (
                                            <span className="shrink-0 rounded-full bg-[#1F2A24]/5 px-2 py-0.5 text-xs font-medium text-[#1F2A24]/60">
                                                Coming soon
                                            </span>
                                        )}
                                    </label>
                                );
                            })}
                        </div>
                        {error && (
                            <p className="mt-2 text-sm text-[#C6473B]">
                                {error}
                            </p>
                        )}
                    </fieldset>

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="min-h-11 rounded-full px-5 text-sm font-semibold text-[#1F2A24]/70 hover:bg-[#1F2A24]/5"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!selected || processing}
                            className="min-h-11 rounded-full bg-[#2F6F4E] px-5 text-sm font-semibold text-[#FBF8F2] transition-colors hover:bg-[#25573E] disabled:opacity-50"
                        >
                            {processing ? 'Please wait…' : 'Continue'}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
