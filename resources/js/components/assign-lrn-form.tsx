import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import type { FormEvent } from 'react';

const LRN_PREFIX = '452501';

function generateLrn() {
    let suffix = '';
    for (let i = 0; i < 8; i++) {
        suffix += Math.floor(Math.random() * 10);
    }
    return `${LRN_PREFIX}${suffix}`;
}

interface AssignLrnFormProps {
    studentId: number;
}

export default function AssignLrnForm({ studentId }: AssignLrnFormProps) {
    const [open, setOpen] = useState(false);
    const { data, setData, patch, processing, errors, reset } = useForm({
        lrn: '',
    });

    const toggleOpen = () => {
        setOpen((o) => !o);
        reset();
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        patch(route('admin.students.lrn.update', studentId), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setOpen(false);
                reset();
            },
        });
    };

    if (!open) {
        return (
            <button
                type="button"
                onClick={toggleOpen}
                className="min-h-9 rounded-full px-2 text-xs font-semibold text-brand-ink hover:bg-brand/5 hover:underline"
            >
                Assign LRN
            </button>
        );
    }

    return (
        <form onSubmit={submit} className="min-w-[160px] space-y-1.5">
            <input
                type="text"
                inputMode="numeric"
                maxLength={14}
                autoFocus
                aria-label="Learner Reference Number (14 digits)"
                aria-invalid={errors.lrn ? true : undefined}
                placeholder="452501XXXXXXXX"
                value={data.lrn}
                onChange={(e) =>
                    setData(
                        'lrn',
                        e.target.value.replace(/\D/g, '').slice(0, 14),
                    )
                }
                className="min-h-9 w-full rounded-lg border border-ink/15 bg-surface px-2 py-1 text-xs text-ink tabular-nums focus:border-brand focus:ring-2 focus:ring-brand/30 focus:outline-none"
            />
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => setData('lrn', generateLrn())}
                    className="min-h-8 rounded-full px-1.5 text-xs font-medium text-brand-ink hover:underline"
                >
                    Generate
                </button>
                <button
                    type="submit"
                    disabled={processing}
                    className="min-h-8 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-brand-deep disabled:cursor-wait disabled:opacity-50"
                >
                    {processing ? 'Saving…' : 'Save'}
                </button>
                <button
                    type="button"
                    onClick={toggleOpen}
                    className="min-h-8 rounded-full px-1.5 text-xs text-ink/70 hover:text-ink"
                >
                    Cancel
                </button>
            </div>
            {errors.lrn && (
                <p role="alert" className="text-xs text-danger-ink">
                    {errors.lrn}
                </p>
            )}
        </form>
    );
}
