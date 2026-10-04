import { useForm } from '@inertiajs/react';
import { BellRing, Loader2 } from 'lucide-react';
import type { FormEvent } from 'react';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { formatDate, isPeriodClosed, periodStatus } from './period';
import { INPUT_CLASS, REMINDER_DAYS_AHEAD } from './types';
import type { EnrollmentPeriod } from './types';

type Props = {
    schoolYear: string;
    enrollmentPeriod: EnrollmentPeriod | null;
    /** Today's date at the school (Y-m-d). */
    today: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

function DateInput({
    id,
    label,
    value,
    min,
    error,
    onChange,
}: {
    id: string;
    label: string;
    value: string;
    min?: string;
    error?: string;
    onChange: (value: string) => void;
}) {
    return (
        <div>
            <label
                htmlFor={id}
                className="mb-1 block text-sm font-medium text-[#1F2A24]/80"
            >
                {label}
            </label>
            <input
                id={id}
                type="date"
                required
                value={value}
                min={min}
                onChange={(e) => onChange(e.target.value)}
                aria-invalid={!!error}
                aria-describedby={error ? `${id}-error` : undefined}
                className={INPUT_CLASS}
            />
            {error && (
                <p id={`${id}-error`} className="mt-1 text-xs text-[#C6473B]">
                    {error}
                </p>
            )}
        </div>
    );
}

/**
 * Sets when applications for one school year open and close. Remount it
 * for each opening so the form starts from the saved dates. Once closed,
 * it reopens the same school year: only a new closing date is needed.
 */
export default function EnrollmentPeriodDialog({
    schoolYear,
    enrollmentPeriod,
    today,
    open,
    onOpenChange,
}: Props) {
    const status = enrollmentPeriod
        ? periodStatus(enrollmentPeriod, today)
        : null;
    const isReopening = isPeriodClosed(enrollmentPeriod, today);

    const { data, setData, put, processing, errors, isDirty } = useForm({
        opens_on: enrollmentPeriod?.opens_on ?? '',
        // Reopening starts with no closing date so a new one is picked.
        closes_on: isReopening ? '' : (enrollmentPeriod?.closes_on ?? ''),
    });

    const save = (e: FormEvent) => {
        e.preventDefault();
        put(route('admin.school-years.enrollment-period.update', schoolYear), {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                aria-describedby={undefined}
                className="max-h-[calc(100vh-2rem)] gap-0 overflow-y-auto rounded-2xl border-[#1F2A24]/10 bg-white p-0 text-[#1F2A24] sm:max-w-md"
            >
                <form onSubmit={save}>
                    <DialogHeader className="border-b border-[#1F2A24]/10 px-6 py-5 pr-12 text-left">
                        <DialogTitle className="font-serif text-xl font-semibold">
                            {isReopening
                                ? 'Reopen enrollment'
                                : 'Enrollment dates'}{' '}
                            · {schoolYear}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-5 px-6 py-5">
                        <div className="rounded-xl bg-[#FBF8F2] p-4">
                            <p className="flex flex-wrap items-center gap-2 text-xs font-semibold tracking-wide text-[#1F2A24]/55 uppercase">
                                Current dates
                                {status && (
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-xs font-medium tracking-normal normal-case ${status.tone}`}
                                    >
                                        {status.label}
                                    </span>
                                )}
                            </p>
                            {enrollmentPeriod ? (
                                <dl className="mt-2 grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <dt className="text-[#1F2A24]/65">
                                            Opens
                                        </dt>
                                        <dd className="font-semibold text-[#1F2A24]">
                                            {formatDate(
                                                enrollmentPeriod.opens_on,
                                            )}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-[#1F2A24]/65">
                                            Closes
                                        </dt>
                                        <dd className="font-semibold text-[#1F2A24]">
                                            {formatDate(
                                                enrollmentPeriod.closes_on,
                                            )}
                                        </dd>
                                    </div>
                                </dl>
                            ) : (
                                <p className="mt-2 text-sm text-[#1F2A24]/70">
                                    No dates set yet.
                                </p>
                            )}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <DateInput
                                id="enrollment-opens-on"
                                label="Opens on"
                                value={data.opens_on}
                                error={errors.opens_on}
                                onChange={(value) => setData('opens_on', value)}
                            />
                            <DateInput
                                id="enrollment-closes-on"
                                label="Closes on"
                                value={data.closes_on}
                                min={
                                    isReopening
                                        ? today
                                        : data.opens_on || undefined
                                }
                                error={errors.closes_on}
                                onChange={(value) =>
                                    setData('closes_on', value)
                                }
                            />
                        </div>

                        <p className="text-sm text-[#1F2A24]/70">
                            {isReopening
                                ? `Enrollment for ${schoolYear} has closed. Pick a new closing date to accept applications for the same school year again, through the end of that day.`
                                : 'Parents can apply from the opening date through the end of the closing date.'}
                        </p>

                        <p className="flex gap-2 rounded-xl border border-[#2F6F4E]/20 bg-[#2F6F4E]/5 px-3 py-2.5 text-xs leading-relaxed text-[#1F2A24]/80">
                            <BellRing
                                className="mt-0.5 h-4 w-4 shrink-0 text-[#2F6F4E]"
                                aria-hidden="true"
                            />
                            <span>
                                Admins are reminded {REMINDER_DAYS_AHEAD} days
                                before enrollment opens and before it closes,
                                and again once it has ended.
                            </span>
                        </p>
                    </div>

                    <div className="flex flex-col-reverse gap-2 border-t border-[#1F2A24]/10 px-6 py-4 sm:flex-row sm:justify-end">
                        <DialogClose asChild>
                            <button
                                type="button"
                                className="min-h-10 rounded-full border border-[#1F2A24]/15 px-5 text-sm font-medium text-[#1F2A24] hover:bg-[#1F2A24]/5"
                            >
                                Cancel
                            </button>
                        </DialogClose>
                        <button
                            type="submit"
                            disabled={processing || !isDirty}
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#2F6F4E] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#25573E] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {processing && (
                                <Loader2
                                    className="h-4 w-4 animate-spin"
                                    aria-hidden="true"
                                />
                            )}
                            {isReopening ? 'Reopen enrollment' : 'Save dates'}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
