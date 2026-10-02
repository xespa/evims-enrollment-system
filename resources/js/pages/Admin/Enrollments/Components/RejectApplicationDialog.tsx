import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

type RejectionReasonOption = { value: string; label: string };

interface RejectApplicationDialogProps {
    enrollmentId: number;
    studentName: string;
    reasons: RejectionReasonOption[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

/**
 * Rejects an enrollment application. The chosen reasons — each with what
 * to do about it — and the note are emailed to the parent and shown in
 * their portal notifications.
 */
export default function RejectApplicationDialog({
    enrollmentId,
    studentName,
    reasons,
    open,
    onOpenChange,
}: RejectApplicationDialogProps) {
    const { data, setData, patch, processing, errors, reset, clearErrors } =
        useForm<{
            enrollment_status: 'REJECTED';
            rejection_reasons: string[];
            rejection_note: string;
        }>({
            enrollment_status: 'REJECTED',
            rejection_reasons: [],
            rejection_note: '',
        });

    const needsNote = data.rejection_reasons.includes('OTHER');
    const reasonsError =
        errors.rejection_reasons ??
        (errors as Record<string, string | undefined>)['rejection_reasons.0'];

    const toggleReason = (reason: string, checked: boolean) => {
        setData(
            'rejection_reasons',
            checked
                ? [...data.rejection_reasons, reason]
                : data.rejection_reasons.filter((r) => r !== reason),
        );
    };

    const close = (isOpen: boolean) => {
        if (!isOpen) {
            reset();
            clearErrors();
        }
        onOpenChange(isOpen);
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        patch(route('admin.enrollments.status.update', enrollmentId), {
            preserveScroll: true,
            onSuccess: () => close(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={close}>
            <DialogContent
                aria-describedby="reject-application-summary"
                className="rounded-2xl border-[#1F2A24]/10 bg-white p-0 text-[#1F2A24] sm:max-w-md"
            >
                <form onSubmit={submit}>
                    <DialogHeader className="border-b border-[#1F2A24]/10 px-6 py-5 pr-12 text-left">
                        <DialogTitle className="font-serif text-xl font-semibold">
                            Reject {studentName}'s application?
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 px-6 py-5">
                        <p
                            id="reject-application-summary"
                            className="text-sm text-[#1F2A24]/75"
                        >
                            The parent will be emailed and notified in their
                            portal with the reasons below and what to do next.
                        </p>

                        <fieldset>
                            <legend className="mb-2 text-sm font-medium text-[#1F2A24]/80">
                                Why is it being rejected?{' '}
                                <span
                                    className="text-[#C6473B]"
                                    aria-hidden="true"
                                >
                                    *
                                </span>
                            </legend>
                            <div className="space-y-0.5">
                                {reasons.map((reason) => {
                                    const checkboxId = `rejection-reason-${reason.value}`;

                                    return (
                                        <div
                                            key={reason.value}
                                            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-[#1F2A24]/5"
                                        >
                                            <Checkbox
                                                id={checkboxId}
                                                checked={data.rejection_reasons.includes(
                                                    reason.value,
                                                )}
                                                onCheckedChange={(checked) =>
                                                    toggleReason(
                                                        reason.value,
                                                        checked === true,
                                                    )
                                                }
                                                className="data-[state=checked]:border-[#C6473B] data-[state=checked]:bg-[#C6473B]"
                                            />
                                            <label
                                                htmlFor={checkboxId}
                                                className="flex-1 cursor-pointer text-sm text-[#1F2A24]"
                                            >
                                                {reason.label}
                                            </label>
                                        </div>
                                    );
                                })}
                            </div>
                            {reasonsError && (
                                <p className="mt-1 text-xs text-[#C6473B]">
                                    {reasonsError}
                                </p>
                            )}
                        </fieldset>

                        <div>
                            <label
                                htmlFor="rejection-note"
                                className="mb-1 block text-sm font-medium text-[#1F2A24]/80"
                            >
                                Note to the parent{' '}
                                {needsNote ? (
                                    <span
                                        className="text-[#C6473B]"
                                        aria-hidden="true"
                                    >
                                        *
                                    </span>
                                ) : (
                                    <span className="font-normal text-[#1F2A24]/50">
                                        (optional)
                                    </span>
                                )}
                            </label>
                            <textarea
                                id="rejection-note"
                                required={needsNote}
                                rows={3}
                                maxLength={500}
                                placeholder="e.g. Grades in Math and Science are still incomplete."
                                value={data.rejection_note}
                                onChange={(e) =>
                                    setData('rejection_note', e.target.value)
                                }
                                aria-invalid={
                                    errors.rejection_note ? true : undefined
                                }
                                className="w-full rounded-lg border border-[#1F2A24]/15 bg-white px-3 py-2 text-sm focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none aria-[invalid=true]:border-[#C6473B]"
                            />
                            {errors.rejection_note && (
                                <p className="mt-1 text-xs text-[#C6473B]">
                                    {errors.rejection_note}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 border-t border-[#1F2A24]/10 px-6 py-4">
                        <button
                            type="button"
                            onClick={() => close(false)}
                            className="min-h-10 rounded-full border border-[#1F2A24]/15 px-5 text-sm font-semibold text-[#1F2A24]/80 hover:bg-[#1F2A24]/5"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={
                                processing ||
                                data.rejection_reasons.length === 0
                            }
                            className="min-h-10 rounded-full bg-[#C6473B] px-5 text-sm font-semibold text-white hover:bg-[#A93A30] disabled:opacity-60"
                        >
                            Reject &amp; Notify
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
