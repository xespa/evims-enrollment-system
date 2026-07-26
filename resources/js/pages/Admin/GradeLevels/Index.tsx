import { Head, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

function formatCurrency(value) {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);
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
            <div className="min-h-screen bg-gray-50 py-8 px-4">
                <div className="mx-auto max-w-2xl">
                    <h1 className="mb-1 text-2xl font-bold text-gray-900">Tuition Fees</h1>
                    <p className="mb-6 text-sm text-gray-500">
                        Set the total school-year tuition fee per grade level. This is what parents see during enrollment and what determines their installment schedule.
                    </p>

                    {props.flash?.success && (
                        <div className="mb-4 rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700">
                            {props.flash.success}
                        </div>
                    )}

                    <div className="divide-y divide-gray-100 rounded-lg bg-white shadow-sm">
                        {gradeLevels.map((gradeLevel) => (
                            <div key={gradeLevel.id} className="flex items-center justify-between p-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-800">{gradeLevel.name}</p>
                                    <p className="text-xs text-gray-500">{gradeLevel.subjects_count} subjects</p>
                                </div>

                                {editingId === gradeLevel.id ? (
                                    <form onSubmit={(e) => saveFee(e, gradeLevel.id)} className="flex items-center gap-2">
                                        <span className="text-sm text-gray-500">₱</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            autoFocus
                                            value={data.tuition_fee}
                                            onChange={(e) => setData('tuition_fee', e.target.value)}
                                            className="w-28 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900"
                                        />
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                                        >
                                            Save
                                        </button>
                                        <button
                                            type="button"
                                            onClick={cancelEditing}
                                            className="text-xs text-gray-500 hover:underline"
                                        >
                                            Cancel
                                        </button>
                                        {errors.tuition_fee && (
                                            <span className="text-xs text-red-600">{errors.tuition_fee}</span>
                                        )}
                                    </form>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-semibold text-gray-900">
                                            {formatCurrency(gradeLevel.tuition_fee)}
                                        </span>
                                        <button
                                            onClick={() => startEditing(gradeLevel)}
                                            className="text-xs text-blue-600 hover:underline"
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
        </>
    );
}
