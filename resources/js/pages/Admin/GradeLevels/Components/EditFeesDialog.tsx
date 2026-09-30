import { useForm } from '@inertiajs/react';
import { Info, Loader2 } from 'lucide-react';
import type { FormEvent } from 'react';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    BILLABLE_MONTHS,
    formatCurrency,
} from '@/pages/Enrollment/Components/fees';
import { INPUT_CLASS, MONTHLY_FEES, ONE_TIME_FEES } from './types';
import type { Curriculum, FeeName, GradeLevel } from './types';

type Props = {
    gradeLevel: GradeLevel;
    curriculum: Curriculum;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

type Fees = Record<FeeName, string>;

function sum(fees: Fees, names: FeeName[]) {
    return names.reduce((total, name) => total + (Number(fees[name]) || 0), 0);
}

function FeeInput({
    name,
    label,
    value,
    error,
    onChange,
}: {
    name: FeeName;
    label: string;
    value: string;
    error?: string;
    onChange: (value: string) => void;
}) {
    const id = `fee-${name}`;

    return (
        <div>
            <label
                htmlFor={id}
                className="mb-1 block text-sm font-medium text-[#1F2A24]/80"
            >
                {label}
            </label>
            <div className="relative">
                <span
                    className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-[#1F2A24]/50"
                    aria-hidden="true"
                >
                    ₱
                </span>
                <input
                    id={id}
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    required
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${id}-error` : undefined}
                    className={`${INPUT_CLASS} pl-7 tabular-nums`}
                />
            </div>
            {error && (
                <p id={`${id}-error`} className="mt-1 text-xs text-[#C6473B]">
                    {error}
                </p>
            )}
        </div>
    );
}

/**
 * Edits one grade level's fees for one school year, with a live total.
 * Remount it for each opening so the form starts from the saved fees.
 */
export default function EditFeesDialog({
    gradeLevel,
    curriculum,
    open,
    onOpenChange,
}: Props) {
    const { data, setData, patch, processing, errors, isDirty } = useForm<Fees>(
        {
            registration_fee: curriculum.registration_fee,
            miscellaneous_fee: curriculum.miscellaneous_fee,
            books_fee: curriculum.books_fee,
            monthly_tuition: curriculum.monthly_tuition,
            monthly_laboratory_fee: curriculum.monthly_laboratory_fee,
        },
    );

    const oneTime = sum(
        data,
        ONE_TIME_FEES.map((f) => f.name),
    );
    const monthly = sum(
        data,
        MONTHLY_FEES.map((f) => f.name),
    );
    const total = oneTime + BILLABLE_MONTHS * monthly;
    const currentTotal = Number(curriculum.tuition_fee);
    const totalChanged = Math.abs(total - currentTotal) >= 0.005;

    const save = (e: FormEvent) => {
        e.preventDefault();
        patch(route('admin.curricula.update', curriculum.id), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => onOpenChange(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                // No description under the title, on purpose.
                aria-describedby={undefined}
                className="max-h-[calc(100vh-2rem)] gap-0 overflow-y-auto rounded-2xl border-[#1F2A24]/10 bg-white p-0 text-[#1F2A24] sm:max-w-xl"
            >
                <form onSubmit={save}>
                    <DialogHeader className="border-b border-[#1F2A24]/10 px-6 py-5 pr-12 text-left">
                        <DialogTitle className="font-serif text-xl font-semibold">
                            Edit {gradeLevel.name} fees ·{' '}
                            {curriculum.school_year}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 px-6 py-5">
                        <fieldset>
                            <legend className="mb-3 text-xs font-semibold tracking-wide text-[#1F2A24]/55 uppercase">
                                One-time fees
                            </legend>
                            <div className="grid gap-4 sm:grid-cols-3">
                                {ONE_TIME_FEES.map((fee) => (
                                    <FeeInput
                                        key={fee.name}
                                        name={fee.name}
                                        label={fee.label}
                                        value={data[fee.name]}
                                        error={errors[fee.name]}
                                        onChange={(value) =>
                                            setData(fee.name, value)
                                        }
                                    />
                                ))}
                            </div>
                        </fieldset>

                        <fieldset>
                            <legend className="mb-3 text-xs font-semibold tracking-wide text-[#1F2A24]/55 uppercase">
                                Monthly fees · billed {BILLABLE_MONTHS} months
                            </legend>
                            <div className="grid gap-4 sm:grid-cols-3">
                                {MONTHLY_FEES.map((fee) => (
                                    <FeeInput
                                        key={fee.name}
                                        name={fee.name}
                                        label={fee.label}
                                        value={data[fee.name]}
                                        error={errors[fee.name]}
                                        onChange={(value) =>
                                            setData(fee.name, value)
                                        }
                                    />
                                ))}
                            </div>
                        </fieldset>

                        <dl className="space-y-2 rounded-xl bg-[#FBF8F2] p-4 text-sm">
                            <div className="flex justify-between gap-4">
                                <dt className="text-[#1F2A24]/70">
                                    One-time fees
                                </dt>
                                <dd className="tabular-nums">
                                    {formatCurrency(oneTime)}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-4">
                                <dt className="text-[#1F2A24]/70">
                                    Monthly fees ({formatCurrency(monthly)} ×{' '}
                                    {BILLABLE_MONTHS})
                                </dt>
                                <dd className="tabular-nums">
                                    {formatCurrency(BILLABLE_MONTHS * monthly)}
                                </dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-4 border-t border-[#1F2A24]/10 pt-2">
                                <dt className="font-semibold">
                                    Total per school year
                                </dt>
                                <dd className="text-right">
                                    <span className="text-lg font-semibold text-[#2F6F4E] tabular-nums">
                                        {formatCurrency(total)}
                                    </span>
                                    {totalChanged && (
                                        <span className="block text-xs text-[#1F2A24]/55 tabular-nums">
                                            was {formatCurrency(currentTotal)}
                                        </span>
                                    )}
                                </dd>
                            </div>
                        </dl>

                        <p className="flex gap-2 rounded-xl border border-[#2F6F4E]/20 bg-[#2F6F4E]/5 px-3 py-2.5 text-xs leading-relaxed text-[#1F2A24]/80">
                            <Info
                                className="mt-0.5 h-4 w-4 shrink-0 text-[#2F6F4E]"
                                aria-hidden="true"
                            />
                            <span>
                                Only new {curriculum.school_year}{' '}
                                {gradeLevel.name} applications will use these
                                fees.{' '}
                                {curriculum.enrollments_count > 0
                                    ? `The ${curriculum.enrollments_count} ${curriculum.enrollments_count === 1 ? 'application' : 'applications'} already made ${curriculum.enrollments_count === 1 ? 'keeps its' : 'keep their'} original price.`
                                    : 'No one has applied for it yet.'}
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
                            Save fees
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
