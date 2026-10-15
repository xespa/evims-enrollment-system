import { Head, Link, router, usePage } from '@inertiajs/react';
import { ChevronRight, ClipboardList, Plus } from 'lucide-react';
import gradeSheetRoutes from '@/routes/admin/grade-sheets';
import MySubjects from './Components/MySubjects';
import type { TaughtSubject } from './Components/MySubjects';
import { SELECT_CLASS } from './Components/types';
import type { GradeSheetSummary } from './Components/types';

type PaginationLink = { url: string | null; label: string; active: boolean };

type Props = {
    gradeSheets: {
        data: (GradeSheetSummary & { students_count: number })[];
        links: PaginationLink[];
        total: number;
    };
    schoolYears: string[];
    filters: { school_year: string };
    /** A teacher's own subjects; null for admins, who teach none. */
    mySubjects: TaughtSubject[] | null;
};

export default function Index({
    gradeSheets,
    schoolYears,
    filters,
    mySubjects,
}: Props) {
    const { props } = usePage<{ flash?: { success?: string } }>();

    const changeSchoolYear = (schoolYear: string) => {
        router.get(
            gradeSheetRoutes.index.url({
                query: { school_year: schoolYear || undefined },
            }),
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    return (
        <>
            <Head title="Grade Sheets" />

            <div className="bg-[#FBF8F2] px-4 py-8">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <h1 className="font-serif text-2xl font-semibold text-[#1F2A24]">
                                Grade Sheets
                            </h1>
                            <p className="text-sm text-[#1F2A24]/70">
                                Record each student's Term 1, 2 and 3 grades,
                                one sheet per subject.
                            </p>
                        </div>
                        <Link
                            href={gradeSheetRoutes.create.url()}
                            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#2F6F4E] px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#25573E] focus-visible:ring-2 focus-visible:ring-[#2F6F4E]/40 focus-visible:outline-none"
                        >
                            <Plus className="h-4 w-4" aria-hidden="true" />
                            New Grade Sheet
                        </Link>
                    </div>

                    {props.flash?.success && (
                        <div
                            role="status"
                            className="mb-4 rounded-xl border border-[#2F6F4E]/25 bg-[#2F6F4E]/5 px-4 py-3 text-sm text-[#2F6F4E]"
                        >
                            {props.flash.success}
                        </div>
                    )}

                    {mySubjects !== null && (
                        <MySubjects subjects={mySubjects} />
                    )}

                    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-[#1F2A24]/10 bg-white p-4">
                        <select
                            aria-label="Filter by school year"
                            value={filters.school_year}
                            onChange={(e) => changeSchoolYear(e.target.value)}
                            className={`${SELECT_CLASS} sm:w-56`}
                        >
                            <option value="">All school years</option>
                            {schoolYears.map((schoolYear) => (
                                <option key={schoolYear} value={schoolYear}>
                                    SY {schoolYear}
                                </option>
                            ))}
                        </select>
                        <p
                            aria-live="polite"
                            className="text-sm text-[#1F2A24]/65 sm:ml-auto"
                        >
                            {gradeSheets.total === 1
                                ? '1 grade sheet'
                                : `${gradeSheets.total} grade sheets`}
                        </p>
                    </div>

                    {gradeSheets.data.length === 0 ? (
                        <div className="flex flex-col items-center rounded-2xl border border-dashed border-[#1F2A24]/15 bg-white px-6 py-14 text-center">
                            <ClipboardList
                                className="h-10 w-10 text-[#2F6F4E]/60"
                                aria-hidden="true"
                            />
                            <p className="mt-3 font-medium text-[#1F2A24]">
                                No grade sheets yet
                            </p>
                            <p className="mt-1 text-sm text-[#1F2A24]/65">
                                Create one for a subject you teach to start
                                recording grades.
                            </p>
                            <Link
                                href={gradeSheetRoutes.create.url()}
                                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-[#2F6F4E]/30 px-5 text-sm font-semibold text-[#2F6F4E] hover:bg-[#2F6F4E]/5"
                            >
                                <Plus className="h-4 w-4" aria-hidden="true" />
                                New Grade Sheet
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border border-[#1F2A24]/10 bg-white">
                            <table className="w-full min-w-[720px] text-left text-sm">
                                <thead className="border-b border-[#1F2A24]/10 bg-[#1F2A24]/[0.03] text-xs tracking-wide text-[#1F2A24]/60 uppercase">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">
                                            Grade Sheet No.
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            Subject
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            School Year
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            Teacher
                                        </th>
                                        <th className="px-4 py-3 text-right font-semibold">
                                            Students
                                        </th>
                                        <th className="px-4 py-3">
                                            <span className="sr-only">
                                                Open
                                            </span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#1F2A24]/10">
                                    {gradeSheets.data.map((gradeSheet) => (
                                        <tr
                                            key={gradeSheet.id}
                                            className="hover:bg-[#1F2A24]/[0.02]"
                                        >
                                            <td className="px-4 py-3 font-mono font-semibold text-[#2F6F4E]">
                                                {gradeSheet.number}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="block font-medium text-[#1F2A24]">
                                                    {gradeSheet.subject}
                                                </span>
                                                <span className="text-xs text-[#1F2A24]/60">
                                                    {gradeSheet.grade_level}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-[#1F2A24]/80">
                                                {gradeSheet.school_year}
                                            </td>
                                            <td className="px-4 py-3 text-[#1F2A24]/80">
                                                {gradeSheet.teacher}
                                            </td>
                                            <td className="px-4 py-3 text-right text-[#1F2A24]/80 tabular-nums">
                                                {gradeSheet.students_count}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Link
                                                    href={gradeSheetRoutes.show.url(
                                                        gradeSheet.id,
                                                    )}
                                                    className="inline-flex min-h-10 items-center gap-1 rounded-full px-3 text-sm font-semibold text-[#2F6F4E] hover:bg-[#2F6F4E]/5"
                                                >
                                                    Open
                                                    <span className="sr-only">
                                                        {' '}
                                                        {gradeSheet.number}
                                                    </span>
                                                    <ChevronRight
                                                        className="h-4 w-4"
                                                        aria-hidden="true"
                                                    />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {gradeSheets.links.length > 3 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {gradeSheets.links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url ?? '#'}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                    preserveScroll
                                    className={`inline-flex min-h-10 min-w-10 items-center justify-center rounded-full border px-3 py-1.5 text-sm ${
                                        link.active
                                            ? 'border-[#2F6F4E] bg-[#2F6F4E] text-white'
                                            : 'border-[#1F2A24]/10 bg-white text-[#1F2A24]/70 hover:bg-[#1F2A24]/5'
                                    } ${!link.url ? 'pointer-events-none opacity-40' : ''}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
