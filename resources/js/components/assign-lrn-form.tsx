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
                className="min-h-9 rounded-full px-2 text-xs font-semibold text-[#2F6F4E] hover:bg-[#2F6F4E]/5 hover:underline"
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
                className="min-h-9 w-full rounded-lg border border-[#1F2A24]/15 bg-white px-2 py-1 text-xs text-[#1F2A24] tabular-nums focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none"
            />
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => setData('lrn', generateLrn())}
                    className="min-h-8 rounded-full px-1.5 text-xs font-medium text-[#2F6F4E] hover:underline"
                >
                    Generate
                </button>
                <button
                    type="submit"
                    disabled={processing}
                    className="min-h-8 rounded-full bg-[#2F6F4E] px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-[#25573E] disabled:cursor-wait disabled:opacity-50"
                >
                    {processing ? 'Saving…' : 'Save'}
                </button>
                <button
                    type="button"
                    onClick={toggleOpen}
                    className="min-h-8 rounded-full px-1.5 text-xs text-[#1F2A24]/70 hover:text-[#1F2A24]"
                >
                    Cancel
                </button>
            </div>
            {errors.lrn && (
                <p role="alert" className="text-xs text-[#C6473B]">
                    {errors.lrn}
                </p>
            )}
        </form>
    );
}
