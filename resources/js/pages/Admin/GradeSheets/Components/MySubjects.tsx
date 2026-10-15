import { Link } from '@inertiajs/react';
import { BookOpen, ChevronRight, Plus, Settings2 } from 'lucide-react';
import admin from '@/routes/admin';
import gradeSheetRoutes from '@/routes/admin/grade-sheets';

export type TaughtSubject = {
    id: number;
    name: string;
    code: string | null;
    grade_level: string;
    school_year: string;
    /** Approved students taking it that school year. */
    enrolled_students_count: number;
    /** The teacher's grade sheet for this subject, if they've made one. */
    grade_sheet_id: number | null;
};

/**
 * The subjects a teacher said they teach (in Settings), each ready to open
 * its grade sheet or start one with the subject already picked.
 */
export default function MySubjects({
    subjects,
}: {
    subjects: TaughtSubject[];
}) {
    const editLink = (
        <Link
            href={admin.settings.subjects.edit.url()}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-[#2F6F4E] hover:bg-[#2F6F4E]/5"
        >
            <Settings2 className="h-4 w-4" aria-hidden="true" />
            {subjects.length === 0 ? 'Choose my subjects' : 'Edit my subjects'}
        </Link>
    );

    return (
        <section
            aria-labelledby="my-subjects-heading"
            className="mb-6 rounded-2xl border border-[#1F2A24]/10 bg-white p-5"
        >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2
                    id="my-subjects-heading"
                    className="flex items-center gap-2 text-xs font-semibold tracking-[0.1em] text-[#2F6F4E] uppercase"
                >
                    <BookOpen className="h-4 w-4" aria-hidden="true" />
                    My subjects
                </h2>
                {editLink}
            </div>

            {subjects.length === 0 ? (
                <p className="text-sm text-[#1F2A24]/65">
                    Tell us which subjects you teach and they'll show here,
                    ready to start a grade sheet for.
                </p>
            ) : (
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {subjects.map((subject) => (
                        <li
                            key={subject.id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-[#1F2A24]/10 px-4 py-3"
                        >
                            <div className="min-w-0">
                                <p className="truncate font-medium text-[#1F2A24]">
                                    {subject.name}
                                    {subject.code && (
                                        <span className="ml-1.5 text-xs font-normal text-[#1F2A24]/55">
                                            {subject.code}
                                        </span>
                                    )}
                                </p>
                                <p className="text-xs text-[#1F2A24]/60">
                                    {subject.grade_level} · SY{' '}
                                    {subject.school_year} ·{' '}
                                    {subject.enrolled_students_count === 0 ? (
                                        <span className="font-semibold text-[#a4670f]">
                                            No students this year
                                        </span>
                                    ) : subject.enrolled_students_count ===
                                      1 ? (
                                        '1 student'
                                    ) : (
                                        `${subject.enrolled_students_count} students`
                                    )}
                                </p>
                            </div>
                            {subject.grade_sheet_id !== null ? (
                                <Link
                                    href={gradeSheetRoutes.show.url(
                                        subject.grade_sheet_id,
                                    )}
                                    className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-full px-3 text-sm font-semibold text-[#2F6F4E] hover:bg-[#2F6F4E]/5"
                                >
                                    Open
                                    <span className="sr-only">
                                        {' '}
                                        {subject.name} grade sheet
                                    </span>
                                    <ChevronRight
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                    />
                                </Link>
                            ) : (
                                <Link
                                    href={gradeSheetRoutes.create.url({
                                        query: { subject_id: subject.id },
                                    })}
                                    className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-full border border-[#2F6F4E]/30 px-3 text-sm font-semibold text-[#2F6F4E] hover:bg-[#2F6F4E]/5"
                                >
                                    <Plus
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                    />
                                    Create
                                    <span className="sr-only">
                                        {' '}
                                        a {subject.name} grade sheet
                                    </span>
                                </Link>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
