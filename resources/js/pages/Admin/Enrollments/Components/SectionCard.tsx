import { useForm } from '@inertiajs/react';
import { Loader2, Users } from 'lucide-react';
import type { FormEvent } from 'react';
import sectionRoutes from '@/routes/admin/enrollments/section';

export type SectionOption = {
    id: number;
    name: string;
    slots: number;
    /** Students placed in it and holding a slot. */
    students_count: number;
};

/**
 * The section an approved student is placed in. Staff choose one of the
 * grade level's sections for that school year; a full one can't be chosen.
 */
export default function SectionCard({
    enrollmentId,
    sectionId,
    sections,
    isApproved,
    canManage,
}: {
    enrollmentId: number;
    sectionId: number | null;
    sections: SectionOption[];
    isApproved: boolean;
    canManage: boolean;
}) {
    const { data, setData, put, processing, errors, isDirty } = useForm<{
        section_id: string;
    }>({ section_id: sectionId === null ? '' : String(sectionId) });

    const current = sections.find((section) => section.id === sectionId);

    const save = (e: FormEvent) => {
        e.preventDefault();
        put(sectionRoutes.update.url(enrollmentId), { preserveScroll: true });
    };

    return (
        <div className="rounded-2xl border border-[#1F2A24]/10 bg-white p-5">
            <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-[0.1em] text-[#2F6F4E] uppercase">
                <Users className="h-3.5 w-3.5" aria-hidden="true" />
                Section
            </h2>

            {sections.length === 0 ? (
                <p className="py-2 text-sm text-[#1F2A24]/65">
                    This grade level has no sections for the school year. Add
                    them in School Year Setup.
                </p>
            ) : !isApproved ? (
                <p className="py-2 text-sm text-[#1F2A24]/65">
                    Place the student in a section once the application is
                    approved.
                </p>
            ) : !canManage ? (
                <p className="py-2 text-sm font-medium text-[#1F2A24]">
                    {current ? `Section ${current.name}` : 'Not placed yet'}
                </p>
            ) : (
                <form onSubmit={save} className="space-y-3">
                    <div>
                        <label htmlFor="section_id" className="sr-only">
                            Section
                        </label>
                        <select
                            id="section_id"
                            value={data.section_id}
                            onChange={(e) =>
                                setData('section_id', e.target.value)
                            }
                            aria-invalid={!!errors.section_id}
                            aria-describedby={
                                errors.section_id
                                    ? 'section_id-error'
                                    : undefined
                            }
                            className="min-h-10 w-full rounded-lg border border-[#1F2A24]/15 bg-white px-3 py-2 text-sm text-[#1F2A24] focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none aria-[invalid=true]:border-[#C6473B]"
                        >
                            <option value="">Not placed yet</option>
                            {sections.map((section) => {
                                const isFull =
                                    section.students_count >= section.slots &&
                                    section.id !== sectionId;

                                return (
                                    <option
                                        key={section.id}
                                        value={section.id}
                                        disabled={isFull}
                                    >
                                        Section {section.name} ·{' '}
                                        {section.students_count}/{section.slots}
                                        {isFull ? ' · Full' : ''}
                                    </option>
                                );
                            })}
                        </select>
                        {errors.section_id && (
                            <p
                                id="section_id-error"
                                className="mt-1 text-xs text-[#C6473B]"
                            >
                                {errors.section_id}
                            </p>
                        )}
                    </div>
                    <button
                        type="submit"
                        disabled={processing || !isDirty}
                        className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full bg-[#2F6F4E] px-4 text-sm font-semibold text-white hover:bg-[#25573E] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {processing && (
                            <Loader2
                                className="h-4 w-4 animate-spin"
                                aria-hidden="true"
                            />
                        )}
                        Save section
                    </button>
                </form>
            )}
        </div>
    );
}
