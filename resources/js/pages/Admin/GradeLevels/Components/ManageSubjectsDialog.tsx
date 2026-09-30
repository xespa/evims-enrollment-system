import { router, useForm, usePage } from '@inertiajs/react';
import {
    BookOpen,
    CheckCircle2,
    Loader2,
    Pencil,
    Plus,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useConfirm } from '@/hooks/use-confirm';
import { INPUT_CLASS } from './types';
import type { Curriculum, GradeLevel, Subject } from './types';

type Props = {
    /** Always the latest copy from page props, so the list stays in sync after each save. */
    gradeLevel: GradeLevel;
    /** The selected school year's fees and subjects for this grade level. */
    curriculum: Curriculum;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

const VISIT_OPTIONS = { preserveScroll: true, preserveState: true } as const;

function SubjectRow({
    subject,
    onSaved,
    onRemove,
}: {
    subject: Subject;
    onSaved: (message: string) => void;
    onRemove: (subject: Subject) => void;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const form = useForm({ name: subject.name, code: subject.code ?? '' });

    const startEditing = () => {
        form.setData({ name: subject.name, code: subject.code ?? '' });
        form.clearErrors();
        setIsEditing(true);
    };

    const save = (e: FormEvent) => {
        e.preventDefault();
        form.patch(route('admin.subjects.update', subject.id), {
            ...VISIT_OPTIONS,
            onSuccess: () => {
                setIsEditing(false);
                onSaved(`${form.data.name} updated.`);
            },
        });
    };

    const inUse = subject.enrollments_count > 0;

    if (isEditing) {
        return (
            <li className="bg-[#FBF8F2] px-4 py-3">
                <form
                    onSubmit={save}
                    className="flex flex-wrap items-start gap-2"
                >
                    <div className="min-w-0 flex-1 basis-48">
                        <input
                            type="text"
                            autoFocus
                            aria-label="Subject name"
                            value={form.data.name}
                            onChange={(e) =>
                                form.setData('name', e.target.value)
                            }
                            aria-invalid={!!form.errors.name}
                            className={INPUT_CLASS}
                        />
                        {form.errors.name && (
                            <p className="mt-1 text-xs text-[#C6473B]">
                                {form.errors.name}
                            </p>
                        )}
                    </div>
                    <div className="w-28">
                        <input
                            type="text"
                            aria-label="Subject code (optional)"
                            placeholder="Code"
                            value={form.data.code}
                            onChange={(e) =>
                                form.setData('code', e.target.value)
                            }
                            aria-invalid={!!form.errors.code}
                            className={INPUT_CLASS}
                        />
                        {form.errors.code && (
                            <p className="mt-1 text-xs text-[#C6473B]">
                                {form.errors.code}
                            </p>
                        )}
                    </div>
                    <div className="flex gap-1">
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-[#2F6F4E] px-4 text-sm font-semibold text-white hover:bg-[#25573E] disabled:opacity-50"
                        >
                            {form.processing && (
                                <Loader2
                                    className="h-4 w-4 animate-spin"
                                    aria-hidden="true"
                                />
                            )}
                            Save
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="min-h-10 rounded-full px-3 text-sm text-[#1F2A24]/65 hover:text-[#1F2A24]"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </li>
        );
    }

    return (
        <li className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[#1F2A24]">
                    {subject.name}
                    {subject.code && (
                        <span className="ml-2 rounded bg-[#1F2A24]/5 px-1.5 py-0.5 font-mono text-xs text-[#1F2A24]/65">
                            {subject.code}
                        </span>
                    )}
                </p>
                <p className="text-xs text-[#1F2A24]/55">
                    {subject.enrollments_count === 1
                        ? 'Used by 1 enrollment'
                        : `Used by ${subject.enrollments_count} enrollments`}
                </p>
            </div>
            <div className="flex shrink-0 items-center">
                <button
                    type="button"
                    onClick={startEditing}
                    aria-label={`Edit ${subject.name}`}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#1F2A24]/60 hover:bg-[#2F6F4E]/10 hover:text-[#2F6F4E]"
                >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                    type="button"
                    onClick={() => onRemove(subject)}
                    disabled={inUse}
                    aria-label={`Remove ${subject.name}`}
                    title={
                        inUse
                            ? "Can't remove: it's part of existing enrollments"
                            : undefined
                    }
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#1F2A24]/60 hover:bg-[#C6473B]/10 hover:text-[#A83A30] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#1F2A24]/60"
                >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
            </div>
        </li>
    );
}

export default function ManageSubjectsDialog({
    gradeLevel,
    curriculum,
    open,
    onOpenChange,
}: Props) {
    const { props } = usePage();
    const serverError = (props.errors as Record<string, string> | undefined)
        ?.subject;

    const [confirm, confirmDialog] = useConfirm();
    // Feedback shown inside the modal; the page's own banner is hidden behind it.
    const [notice, setNotice] = useState('');

    const addForm = useForm({ name: '', code: '' });

    const add = (e: FormEvent) => {
        e.preventDefault();
        addForm.post(route('admin.curricula.subjects.store', curriculum.id), {
            ...VISIT_OPTIONS,
            onSuccess: () => {
                setNotice(`${addForm.data.name} added.`);
                addForm.reset();
            },
        });
    };

    const remove = async (subject: Subject) => {
        const confirmed = await confirm({
            title: `Remove "${subject.name}"?`,
            description: `Parents will no longer be able to pick this subject when enrolling in ${gradeLevel.name}.`,
            confirmLabel: 'Remove subject',
            destructive: true,
        });

        if (!confirmed) {
            return;
        }

        router.delete(route('admin.subjects.destroy', subject.id), {
            ...VISIT_OPTIONS,
            onSuccess: () => setNotice(`${subject.name} removed.`),
        });
    };

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            setNotice('');
            addForm.reset();
            addForm.clearErrors();
        }

        onOpenChange(isOpen);
    };

    const subjects = curriculum.subjects;

    return (
        <>
            {confirmDialog}
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent
                    // No description under the title, on purpose.
                    aria-describedby={undefined}
                    className="flex max-h-[calc(100vh-2rem)] flex-col gap-0 overflow-hidden rounded-2xl border-[#1F2A24]/10 bg-white p-0 text-[#1F2A24] sm:max-w-lg"
                >
                    <DialogHeader className="border-b border-[#1F2A24]/10 px-6 py-5 pr-12 text-left">
                        <DialogTitle className="font-serif text-xl font-semibold">
                            {gradeLevel.name} subjects ·{' '}
                            {curriculum.school_year}
                        </DialogTitle>
                    </DialogHeader>

                    <form
                        onSubmit={add}
                        className="border-b border-[#1F2A24]/10 px-6 py-4"
                    >
                        <p className="mb-2 text-sm font-medium text-[#1F2A24]/80">
                            Add a subject
                        </p>
                        <div className="flex flex-wrap items-start gap-2">
                            <div className="min-w-0 flex-1 basis-48">
                                <input
                                    type="text"
                                    aria-label="New subject name"
                                    placeholder="Subject name, e.g. Mathematics"
                                    value={addForm.data.name}
                                    onChange={(e) =>
                                        addForm.setData('name', e.target.value)
                                    }
                                    aria-invalid={!!addForm.errors.name}
                                    className={INPUT_CLASS}
                                />
                                {addForm.errors.name && (
                                    <p className="mt-1 text-xs text-[#C6473B]">
                                        {addForm.errors.name}
                                    </p>
                                )}
                            </div>
                            <div className="w-28">
                                <input
                                    type="text"
                                    aria-label="New subject code (optional)"
                                    placeholder="Code"
                                    value={addForm.data.code}
                                    onChange={(e) =>
                                        addForm.setData('code', e.target.value)
                                    }
                                    aria-invalid={!!addForm.errors.code}
                                    className={INPUT_CLASS}
                                />
                                {addForm.errors.code && (
                                    <p className="mt-1 text-xs text-[#C6473B]">
                                        {addForm.errors.code}
                                    </p>
                                )}
                            </div>
                            <button
                                type="submit"
                                disabled={
                                    addForm.processing ||
                                    !addForm.data.name.trim()
                                }
                                className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-[#2F6F4E] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#25573E] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {addForm.processing ? (
                                    <Loader2
                                        className="h-4 w-4 animate-spin"
                                        aria-hidden="true"
                                    />
                                ) : (
                                    <Plus
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                    />
                                )}
                                Add
                            </button>
                        </div>
                    </form>

                    <div role="status" aria-live="polite">
                        {notice && !serverError && (
                            <p className="flex items-center gap-2 border-b border-[#2F6F4E]/15 bg-[#2F6F4E]/5 px-6 py-2 text-sm text-[#2F6F4E]">
                                <CheckCircle2
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                />
                                {notice}
                            </p>
                        )}
                        {serverError && (
                            <p className="border-b border-[#C6473B]/20 bg-[#C6473B]/5 px-6 py-2 text-sm text-[#A83A30]">
                                {serverError}
                            </p>
                        )}
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto">
                        {subjects.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                                <BookOpen
                                    className="h-8 w-8 text-[#1F2A24]/25"
                                    aria-hidden="true"
                                />
                                <p className="text-sm text-[#1F2A24]/65">
                                    No subjects yet. Add the first one above.
                                </p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-[#1F2A24]/10">
                                {subjects.map((subject) => (
                                    <SubjectRow
                                        key={subject.id}
                                        subject={subject}
                                        onSaved={setNotice}
                                        onRemove={remove}
                                    />
                                ))}
                            </ul>
                        )}
                    </div>

                    <p className="border-t border-[#1F2A24]/10 px-6 py-3 text-xs text-[#1F2A24]/55">
                        {subjects.length}{' '}
                        {subjects.length === 1 ? 'subject' : 'subjects'} ·
                        Subjects already used by {curriculum.school_year}{' '}
                        applications can be renamed but not removed. To drop
                        one, remove it from the next school year instead.
                    </p>
                </DialogContent>
            </Dialog>
        </>
    );
}
