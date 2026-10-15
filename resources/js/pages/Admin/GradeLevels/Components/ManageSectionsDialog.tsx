import { useForm } from '@inertiajs/react';
import { Info, Loader2, Plus, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import sectionRoutes from '@/routes/admin/curricula/sections';
import { INPUT_CLASS } from './types';
import type { Curriculum, GradeLevel } from './types';

type Props = {
    gradeLevel: GradeLevel;
    curriculum: Curriculum;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

type SectionRow = {
    /** Null for a section added in this dialog. */
    id: number | null;
    name: string;
    slots: string;
};

/** Mirrors Section::DEFAULT_NAMES and Section::DEFAULT_SLOTS. */
const DEFAULT_NAMES = ['A', 'B', 'C'];
const DEFAULT_SLOTS = '30';

/** The next letter not taken yet: after A, B, C comes D. */
function nextSectionName(rows: SectionRow[]): string {
    const taken = new Set(rows.map((row) => row.name.trim().toUpperCase()));
    const letter = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        .split('')
        .find((candidate) => !taken.has(candidate));

    return letter ?? '';
}

/**
 * Edits one grade level's sections for one school year: how many students
 * each takes, plus adding and removing sections. Together their slots cap
 * how many can apply. Remount it for each opening so it starts from the
 * saved sections.
 */
export default function ManageSectionsDialog({
    gradeLevel,
    curriculum,
    open,
    onOpenChange,
}: Props) {
    const studentCounts = new Map(
        curriculum.sections.map((section) => [
            section.id,
            section.students_count,
        ]),
    );

    const { data, setData, put, processing, errors, isDirty } = useForm<{
        sections: SectionRow[];
    }>({
        sections: curriculum.sections.map((section) => ({
            id: section.id,
            name: section.name,
            slots: String(section.slots),
        })),
    });

    const fieldErrors = errors as Record<string, string | undefined>;
    const total = data.sections.reduce(
        (sum, row) => sum + (Number(row.slots) || 0),
        0,
    );

    const updateRow = (index: number, changes: Partial<SectionRow>) =>
        setData(
            'sections',
            data.sections.map((row, rowIndex) =>
                rowIndex === index ? { ...row, ...changes } : row,
            ),
        );

    const addSection = () =>
        setData('sections', [
            ...data.sections,
            {
                id: null,
                name: nextSectionName(data.sections),
                slots: DEFAULT_SLOTS,
            },
        ]);

    const addDefaultSections = () =>
        setData(
            'sections',
            DEFAULT_NAMES.map((name) => ({
                id: null,
                name,
                slots: DEFAULT_SLOTS,
            })),
        );

    const removeSection = (index: number) =>
        setData(
            'sections',
            data.sections.filter((_, rowIndex) => rowIndex !== index),
        );

    const save = (e: FormEvent) => {
        e.preventDefault();
        put(sectionRoutes.update.url(curriculum.id), {
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
                className="max-h-[calc(100vh-2rem)] gap-0 overflow-y-auto rounded-2xl border-[#1F2A24]/10 bg-white p-0 text-[#1F2A24] sm:max-w-lg"
            >
                <form onSubmit={save}>
                    <DialogHeader className="border-b border-[#1F2A24]/10 px-6 py-5 pr-12 text-left">
                        <DialogTitle className="font-serif text-xl font-semibold">
                            {gradeLevel.name} sections ·{' '}
                            {curriculum.school_year}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 px-6 py-5">
                        {data.sections.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-[#1F2A24]/15 px-4 py-6 text-center">
                                <p className="text-sm text-[#1F2A24]/70">
                                    No sections, so there’s no limit on how many
                                    can apply.
                                </p>
                                <button
                                    type="button"
                                    onClick={addDefaultSections}
                                    className="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[#2F6F4E]/30 px-4 text-sm font-semibold text-[#2F6F4E] hover:bg-[#2F6F4E]/5"
                                >
                                    <Plus
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                    />
                                    Add sections A, B and C
                                </button>
                            </div>
                        ) : (
                            <table className="w-full text-left text-sm">
                                <thead className="text-xs tracking-wide text-[#1F2A24]/55 uppercase">
                                    <tr>
                                        <th className="pb-2 font-semibold">
                                            Section
                                        </th>
                                        <th className="pb-2 font-semibold">
                                            Slots
                                        </th>
                                        <th className="pb-2 text-right font-semibold">
                                            Placed
                                        </th>
                                        <th className="pb-2">
                                            <span className="sr-only">
                                                Remove
                                            </span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.sections.map((row, index) => {
                                        const placed =
                                            row.id === null
                                                ? 0
                                                : (studentCounts.get(row.id) ??
                                                  0);
                                        const nameError =
                                            fieldErrors[
                                                `sections.${index}.name`
                                            ];
                                        const slotsError =
                                            fieldErrors[
                                                `sections.${index}.slots`
                                            ];

                                        return (
                                            <tr
                                                key={row.id ?? `new-${index}`}
                                                className="align-top"
                                            >
                                                <td className="py-1.5 pr-2">
                                                    <input
                                                        value={row.name}
                                                        onChange={(e) =>
                                                            updateRow(index, {
                                                                name: e.target
                                                                    .value,
                                                            })
                                                        }
                                                        maxLength={20}
                                                        required
                                                        aria-label={`Section ${index + 1} name`}
                                                        aria-invalid={
                                                            !!nameError
                                                        }
                                                        className={INPUT_CLASS}
                                                    />
                                                    {nameError && (
                                                        <p className="mt-1 text-xs text-[#C6473B]">
                                                            {nameError}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="py-1.5 pr-2">
                                                    <input
                                                        type="number"
                                                        inputMode="numeric"
                                                        min={Math.max(
                                                            1,
                                                            placed,
                                                        )}
                                                        max={500}
                                                        required
                                                        value={row.slots}
                                                        onChange={(e) =>
                                                            updateRow(index, {
                                                                slots: e.target
                                                                    .value,
                                                            })
                                                        }
                                                        aria-label={`Slots in section ${row.name || index + 1}`}
                                                        aria-invalid={
                                                            !!slotsError
                                                        }
                                                        className={`${INPUT_CLASS} tabular-nums`}
                                                    />
                                                    {slotsError && (
                                                        <p className="mt-1 text-xs text-[#C6473B]">
                                                            {slotsError}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="py-1.5 pt-3.5 text-right text-[#1F2A24]/70 tabular-nums">
                                                    {placed}
                                                </td>
                                                <td className="py-1.5 pl-1 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            removeSection(index)
                                                        }
                                                        disabled={placed > 0}
                                                        title={
                                                            placed > 0
                                                                ? 'Move its students to another section first.'
                                                                : undefined
                                                        }
                                                        aria-label={`Remove section ${row.name}`}
                                                        className="inline-flex size-10 items-center justify-center rounded-full text-[#1F2A24]/45 hover:bg-[#C6473B]/10 hover:text-[#A3372D] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                                                    >
                                                        <Trash2
                                                            className="h-4 w-4"
                                                            aria-hidden="true"
                                                        />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}

                        {fieldErrors.sections && (
                            <p role="alert" className="text-sm text-[#C6473B]">
                                {fieldErrors.sections}
                            </p>
                        )}

                        {data.sections.length > 0 && (
                            <button
                                type="button"
                                onClick={addSection}
                                disabled={data.sections.length >= 26}
                                className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-[#2F6F4E] hover:bg-[#2F6F4E]/5 disabled:opacity-50"
                            >
                                <Plus className="h-4 w-4" aria-hidden="true" />
                                Add section
                            </button>
                        )}

                        <p className="flex gap-2 rounded-xl border border-[#2F6F4E]/20 bg-[#2F6F4E]/5 px-3 py-2.5 text-xs leading-relaxed text-[#1F2A24]/80">
                            <Info
                                className="mt-0.5 h-4 w-4 shrink-0 text-[#2F6F4E]"
                                aria-hidden="true"
                            />
                            <span>
                                {data.sections.length === 0
                                    ? 'Without sections, every application is accepted.'
                                    : `${total} slots in all. ${curriculum.slots_taken} ${curriculum.slots_taken === 1 ? 'application holds' : 'applications hold'} one now; once every slot is taken, the admission form stops taking ${gradeLevel.name} applications for ${curriculum.school_year}.`}
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
                            Save sections
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
