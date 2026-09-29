import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    BILLABLE_MONTHS,
    formatCurrency,
} from '@/pages/Enrollment/Components/fees';

const FEE_FIELDS = [
    { name: 'registration_fee', label: 'Registration Fee' },
    { name: 'miscellaneous_fee', label: 'Miscellaneous Fee' },
    { name: 'books_fee', label: 'Books' },
    { name: 'monthly_tuition', label: 'Monthly Tuition' },
    { name: 'monthly_laboratory_fee', label: 'Monthly Laboratory Fee' },
];

const EMPTY_FEES = Object.fromEntries(FEE_FIELDS.map((f) => [f.name, '']));

function totalOf(fees) {
    const amount = (name) => Number(fees[name]) || 0;

    return (
        amount('registration_fee') +
        amount('miscellaneous_fee') +
        amount('books_fee') +
        BILLABLE_MONTHS *
            (amount('monthly_tuition') + amount('monthly_laboratory_fee'))
    );
}

export default function Index({ gradeLevels }) {
    const { props } = usePage();
    const [editingId, setEditingId] = useState(null);

    const { data, setData, patch, processing, errors, reset, clearErrors } =
        useForm(EMPTY_FEES);

    const startEditing = (gradeLevel) => {
        clearErrors();
        setData(
            Object.fromEntries(
                FEE_FIELDS.map((f) => [f.name, gradeLevel[f.name]]),
            ),
        );
        setEditingId(gradeLevel.id);
    };

    const cancelEditing = () => {
        setEditingId(null);
        reset();
        clearErrors();
    };

    const saveFees = (e, gradeLevelId) => {
        e.preventDefault();
        patch(route('admin.gradeLevels.update', gradeLevelId), {
            preserveScroll: true,
            onSuccess: () => setEditingId(null),
        });
    };

    return (
        <>
            <Head title="Grade Levels" />
            <div className="bg-[#FBF8F2] px-4 py-8">
                <div className="mx-auto max-w-6xl">
                    <div className="max-w-2xl">
                        <h1 className="mb-1 font-serif text-2xl font-semibold text-[#1F2A24]">
                            Grade Levels
                        </h1>
                        <p className="mb-6 text-sm text-[#1F2A24]/70">
                            Set the school fees and manage the subjects offered
                            per grade level. The total (one-time fees + books +{' '}
                            {BILLABLE_MONTHS} months of monthly fees) is what
                            parents see during enrollment and what they pay.
                        </p>

                        {props.flash?.success && (
                            <div role="status" className="mb-4 rounded-xl border border-[#2F6F4E]/25 bg-[#2F6F4E]/5 px-4 py-3 text-sm text-[#2F6F4E]">
                                {props.flash.success}
                            </div>
                        )}

                        <div className="divide-y divide-[#1F2A24]/10 rounded-2xl border border-[#1F2A24]/10 bg-white">
                            {gradeLevels.map((gradeLevel) => (
                                <div key={gradeLevel.id} className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-[#1F2A24]">
                                                {gradeLevel.name}
                                            </p>
                                            <Link
                                                href={route(
                                                    'admin.gradeLevels.show',
                                                    gradeLevel.id,
                                                )}
                                                className="text-xs text-[#2F6F4E] hover:underline"
                                            >
                                                {gradeLevel.subjects_count}{' '}
                                                subjects · Manage
                                            </Link>
                                        </div>

                                        {editingId !== gradeLevel.id && (
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

                                    {editingId === gradeLevel.id && (
                                        <form
                                            onSubmit={(e) =>
                                                saveFees(e, gradeLevel.id)
                                            }
                                            className="mt-3 rounded-xl bg-[#FBF8F2] p-3"
                                        >
                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                {FEE_FIELDS.map((field) => (
                                                    <label
                                                        key={field.name}
                                                        className="block"
                                                    >
                                                        <span className="mb-1 block text-xs text-[#1F2A24]/70">
                                                            {field.label} (₱)
                                                        </span>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={
                                                                data[field.name]
                                                            }
                                                            onChange={(e) =>
                                                                setData(
                                                                    field.name,
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            className="w-full rounded-lg border border-[#1F2A24]/15 bg-white px-2 py-1 text-sm text-[#1F2A24] focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none"
                                                        />
                                                        {errors[field.name] && (
                                                            <span className="mt-1 block text-xs text-red-600">
                                                                {
                                                                    errors[
                                                                        field
                                                                            .name
                                                                    ]
                                                                }
                                                            </span>
                                                        )}
                                                    </label>
                                                ))}
                                            </div>

                                            <p className="mt-3 rounded-lg bg-[#E8A33D]/10 px-3 py-2 text-xs text-[#1F2A24]/80">
                                                Saving also updates the unpaid
                                                installments of this school
                                                year's applications for{' '}
                                                {gradeLevel.name}, so their next
                                                payment (including GCash) uses
                                                the new fees. Payments already
                                                made are not changed.
                                            </p>

                                            <div className="mt-3 flex items-center justify-between border-t border-[#1F2A24]/10 pt-3">
                                                <p className="text-sm text-[#1F2A24]">
                                                    Total:{' '}
                                                    <span className="font-semibold">
                                                        {formatCurrency(
                                                            totalOf(data),
                                                        )}
                                                    </span>
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={cancelEditing}
                                                        className="text-xs text-[#1F2A24]/70 hover:underline"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        disabled={processing}
                                                        className="rounded-full bg-[#2F6F4E] px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-[#25573E] disabled:opacity-50"
                                                    >
                                                        Save
                                                    </button>
                                                </div>
                                            </div>
                                        </form>
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
