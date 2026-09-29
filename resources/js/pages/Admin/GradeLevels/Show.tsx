import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

const inputClass =
    'rounded-lg border border-[#1F2A24]/15 bg-white px-2 py-1 text-sm text-[#1F2A24] focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none';

export default function Show({ gradeLevel, subjects }) {
    const { props } = usePage();
    const [editingId, setEditingId] = useState(null);

    const createForm = useForm({ name: '', code: '' });
    const editForm = useForm({ name: '', code: '' });

    const addSubject = (e) => {
        e.preventDefault();
        createForm.post(route('admin.subjects.store', gradeLevel.id), {
            preserveScroll: true,
            onSuccess: () => createForm.reset(),
        });
    };

    const startEditing = (subject) => {
        editForm.clearErrors();
        editForm.setData({ name: subject.name, code: subject.code ?? '' });
        setEditingId(subject.id);
    };

    const cancelEditing = () => {
        setEditingId(null);
        editForm.reset();
        editForm.clearErrors();
    };

    const saveSubject = (e, subjectId) => {
        e.preventDefault();
        editForm.patch(route('admin.subjects.update', subjectId), {
            preserveScroll: true,
            onSuccess: () => setEditingId(null),
        });
    };

    const destroy = (subject) => {
        if (!confirm(`Remove "${subject.name}" from ${gradeLevel.name}?`)) {
            return;
        }
        router.delete(route('admin.subjects.destroy', subject.id), {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title={`${gradeLevel.name} Subjects`} />
            <div className="bg-[#FBF8F2] px-4 py-8">
                <div className="mx-auto max-w-6xl">
                    <div className="max-w-2xl">
                        <Link
                            href={route('admin.gradeLevels.index')}
                            className="mb-3 inline-block text-xs font-medium text-[#2F6F4E] hover:underline"
                        >
                            ← Back to grade levels
                        </Link>
                        <h1 className="mb-1 font-serif text-2xl font-semibold text-[#1F2A24]">
                            {gradeLevel.name} Subjects
                        </h1>
                        <p className="mb-6 text-sm text-[#1F2A24]/60">
                            These are the subjects parents can pick from when
                            enrolling a student in {gradeLevel.name}.
                        </p>

                        {props.flash?.success && (
                            <div className="mb-4 rounded-xl border border-[#2F6F4E]/25 bg-[#2F6F4E]/5 px-4 py-3 text-sm text-[#2F6F4E]">
                                {props.flash.success}
                            </div>
                        )}

                        {props.errors?.subject && (
                            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {props.errors.subject}
                            </div>
                        )}

                        <form
                            onSubmit={addSubject}
                            className="mb-4 rounded-2xl border border-[#1F2A24]/10 bg-white p-4"
                        >
                            <p className="mb-3 text-sm font-medium text-[#1F2A24]">
                                Add a subject
                            </p>
                            <div className="flex flex-wrap items-start gap-2">
                                <div className="min-w-0 flex-1">
                                    <input
                                        type="text"
                                        placeholder="Subject name"
                                        value={createForm.data.name}
                                        onChange={(e) =>
                                            createForm.setData(
                                                'name',
                                                e.target.value,
                                            )
                                        }
                                        className={`${inputClass} w-full`}
                                    />
                                    {createForm.errors.name && (
                                        <p className="mt-1 text-xs text-red-600">
                                            {createForm.errors.name}
                                        </p>
                                    )}
                                </div>
                                <div className="w-28">
                                    <input
                                        type="text"
                                        placeholder="Code"
                                        value={createForm.data.code}
                                        onChange={(e) =>
                                            createForm.setData(
                                                'code',
                                                e.target.value,
                                            )
                                        }
                                        className={`${inputClass} w-full`}
                                    />
                                    {createForm.errors.code && (
                                        <p className="mt-1 text-xs text-red-600">
                                            {createForm.errors.code}
                                        </p>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    disabled={createForm.processing}
                                    className="rounded-full bg-[#2F6F4E] px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#25573E] disabled:opacity-50"
                                >
                                    Add
                                </button>
                            </div>
                        </form>

                        <div className="divide-y divide-[#1F2A24]/10 rounded-2xl border border-[#1F2A24]/10 bg-white">
                            {subjects.length === 0 && (
                                <p className="p-4 text-sm text-[#1F2A24]/60">
                                    No subjects yet for {gradeLevel.name}.
                                </p>
                            )}

                            {subjects.map((subject) =>
                                editingId === subject.id ? (
                                    <form
                                        key={subject.id}
                                        onSubmit={(e) =>
                                            saveSubject(e, subject.id)
                                        }
                                        className="flex flex-wrap items-start gap-2 p-4"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <input
                                                type="text"
                                                autoFocus
                                                value={editForm.data.name}
                                                onChange={(e) =>
                                                    editForm.setData(
                                                        'name',
                                                        e.target.value,
                                                    )
                                                }
                                                className={`${inputClass} w-full`}
                                            />
                                            {editForm.errors.name && (
                                                <p className="mt-1 text-xs text-red-600">
                                                    {editForm.errors.name}
                                                </p>
                                            )}
                                        </div>
                                        <div className="w-28">
                                            <input
                                                type="text"
                                                placeholder="Code"
                                                value={editForm.data.code}
                                                onChange={(e) =>
                                                    editForm.setData(
                                                        'code',
                                                        e.target.value,
                                                    )
                                                }
                                                className={`${inputClass} w-full`}
                                            />
                                            {editForm.errors.code && (
                                                <p className="mt-1 text-xs text-red-600">
                                                    {editForm.errors.code}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={editForm.processing}
                                            className="rounded-full bg-[#2F6F4E] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#25573E] disabled:opacity-50"
                                        >
                                            Save
                                        </button>
                                        <button
                                            type="button"
                                            onClick={cancelEditing}
                                            className="py-1.5 text-xs text-[#1F2A24]/60 hover:underline"
                                        >
                                            Cancel
                                        </button>
                                    </form>
                                ) : (
                                    <div
                                        key={subject.id}
                                        className="flex items-center justify-between gap-4 p-4"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-[#1F2A24]">
                                                {subject.name}
                                            </p>
                                            <p className="text-xs text-[#1F2A24]/60">
                                                {subject.code
                                                    ? `${subject.code} · `
                                                    : ''}
                                                {subject.enrollments_count}{' '}
                                                enrollments
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-3">
                                            <button
                                                onClick={() =>
                                                    startEditing(subject)
                                                }
                                                className="text-xs font-medium text-[#2F6F4E] hover:underline"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => destroy(subject)}
                                                disabled={
                                                    subject.enrollments_count >
                                                    0
                                                }
                                                title={
                                                    subject.enrollments_count >
                                                    0
                                                        ? 'In use by existing enrollments'
                                                        : undefined
                                                }
                                                className="text-xs font-medium text-red-600 hover:underline disabled:cursor-not-allowed disabled:text-[#1F2A24]/30 disabled:no-underline"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ),
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
