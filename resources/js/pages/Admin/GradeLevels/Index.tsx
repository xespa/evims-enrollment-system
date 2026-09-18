import { Head, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

function formatCurrency(value) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
    }).format(value);
}

export default function Index({ gradeLevels }) {
    const { props } = usePage();
    const [editingId, setEditingId] = useState(null);

    const { data, setData, patch, processing, errors, reset } = useForm({
        tuition_fee: '',
    });

    const startEditing = (gradeLevel) => {
        setEditingId(gradeLevel.id);
        setData('tuition_fee', gradeLevel.tuition_fee);
    };

    const cancelEditing = () => {
        setEditingId(null);
        reset();
    };

    const saveFee = (e, gradeLevelId) => {
        e.preventDefault();
        patch(route('admin.gradeLevels.update', gradeLevelId), {
            preserveScroll: true,
            onSuccess: () => setEditingId(null),
        });
    };

    return (
        <>
            <Head title="Tuition Fees" />
            <div className="bg-[#FBF8F2] px-4 py-8">
                <div className="mx-auto max-w-6xl">
                    <div className="max-w-2xl">
                        <h1 className="mb-1 font-serif text-2xl font-semibold text-[#1F2A24]">
                            Tuition Fees
                        </h1>
                        <p className="mb-6 text-sm text-[#1F2A24]/60">
                            Set the total school-year tuition fee per grade
                            level. This is what parents see during enrollment
                            and what determines their installment schedule.
                        </p>

                        {props.flash?.success && (
                            <div className="mb-4 rounded-xl border border-[#2F6F4E]/25 bg-[#2F6F4E]/5 px-4 py-3 text-sm text-[#2F6F4E]">
                                {props.flash.success}
                            </div>
                        )}

                        <div className="divide-y divide-[#1F2A24]/10 rounded-2xl border border-[#1F2A24]/10 bg-white">
                            {gradeLevels.map((gradeLevel) => (
                                <div
                                    key={gradeLevel.id}
                                    className="flex items-center justify-between p-4"
                                >
                                    <div>
                                        <p className="text-sm font-medium text-[#1F2A24]">
                                            {gradeLevel.name}
                                        </p>
                                        <p className="text-xs text-[#1F2A24]/60">
                                            {gradeLevel.subjects_count} subjects
                                        </p>
                                    </div>

                                    {editingId === gradeLevel.id ? (
                                        <form
                                            onSubmit={(e) =>
                                                saveFee(e, gradeLevel.id)
                                            }
                                            className="flex items-center gap-2"
                                        >
                                            <span className="text-sm text-[#1F2A24]/60">
                                                ₱
                                            </span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                autoFocus
                                                value={data.tuition_fee}
                                                onChange={(e) =>
                                                    setData(
                                                        'tuition_fee',
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-28 rounded-lg border border-[#1F2A24]/15 bg-white px-2 py-1 text-sm text-[#1F2A24] focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none"
                                            />
                                            <button
                                                type="submit"
                                                disabled={processing}
                                                className="rounded-full bg-[#2F6F4E] px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-[#25573E] disabled:opacity-50"
                                            >
                                                Save
                                            </button>
                                            <button
                                                type="button"
                                                onClick={cancelEditing}
                                                className="text-xs text-[#1F2A24]/60 hover:underline"
                                            >
                                                Cancel
                                            </button>
                                            {errors.tuition_fee && (
                                                <span className="text-xs text-red-600">
                                                    {errors.tuition_fee}
                                                </span>
                                            )}
                                        </form>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-semibold text-[#1F2A24]">
                                                {formatCurrency(
                                                    gradeLevel.tuition_fee,
                                                )}
                                            </span>
                                            <button
                                                onClick={() =>
                                                    startEditing(gradeLevel)
                                                }
                                                className="text-xs font-medium text-[#2F6F4E] hover:underline"
                                            >
                                                Edit
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
