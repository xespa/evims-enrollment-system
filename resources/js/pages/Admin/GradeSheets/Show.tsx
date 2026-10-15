import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Pencil, Plus, Printer, Trash2, Users } from 'lucide-react';
import { useConfirm } from '@/hooks/use-confirm';
import gradeSheetRoutes from '@/routes/admin/grade-sheets';
import studentGradeRoutes from '@/routes/admin/student-grades';
import { TERMS, formatGrade } from './Components/types';
import type { GradeSheetSummary, StudentGradeRow } from './Components/types';

type Props = {
    gradeSheet: GradeSheetSummary;
    studentGrades: StudentGradeRow[];
    /** Enrolled students not on the sheet yet; Create is off at zero. */
    ungradedStudentsCount: number;
};

function RemarksBadge({ remarks }: { remarks: StudentGradeRow['remarks'] }) {
    if (remarks === null) {
        return <span className="text-[#1F2A24]/40">—</span>;
    }

    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                remarks === 'Passed'
                    ? 'bg-[#2F6F4E]/10 text-[#2F6F4E]'
                    : 'bg-[#C6473B]/10 text-[#A3372D]'
            }`}
        >
            {remarks}
        </span>
    );
}

export default function Show({
    gradeSheet,
    studentGrades,
    ungradedStudentsCount,
}: Props) {
    const { props } = usePage<{ flash?: { success?: string } }>();
    const [confirm, confirmDialog] = useConfirm();

    const canAddStudent = ungradedStudentsCount > 0;

    const removeStudent = async (studentGrade: StudentGradeRow) => {
        const confirmed = await confirm({
            title: `Remove ${studentGrade.student_name}?`,
            description:
                'Their grades on this sheet will be deleted. You can add them again later.',
            confirmLabel: 'Remove Student',
            destructive: true,
        });

        if (confirmed) {
            router.delete(studentGradeRoutes.destroy.url(studentGrade.id), {
                preserveScroll: true,
            });
        }
    };

    const deleteGradeSheet = async () => {
        const confirmed = await confirm({
            title: `Delete grade sheet ${gradeSheet.number}?`,
            description:
                'Every student grade on it will be deleted. This cannot be undone.',
            confirmLabel: 'Delete Grade Sheet',
            destructive: true,
        });

        if (confirmed) {
            router.delete(gradeSheetRoutes.destroy.url(gradeSheet.id));
        }
    };

    const details = [
        { label: 'Grade Sheet No.', value: gradeSheet.number, mono: true },
        {
            label: 'Subject',
            value: `${gradeSheet.subject} · ${gradeSheet.grade_level}`,
        },
        { label: 'School Year', value: gradeSheet.school_year },
        { label: 'Teacher', value: gradeSheet.teacher },
    ];

    return (
        <>
            <Head title={`Grade Sheet ${gradeSheet.number}`} />
            {confirmDialog}

            <div className="bg-[#FBF8F2] px-4 py-8">
                <div className="mx-auto max-w-6xl">
                    <Link
                        href={gradeSheetRoutes.index.url()}
                        className="mb-4 inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-[#1F2A24]/70 hover:text-[#1F2A24]"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Grade Sheets
                    </Link>

                    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                        <h1 className="font-serif text-2xl font-semibold text-[#1F2A24]">
                            {gradeSheet.subject}{' '}
                            <span className="text-[#1F2A24]/50">
                                · {gradeSheet.grade_level}
                            </span>
                        </h1>
                        <div className="flex flex-wrap gap-2">
                            <a
                                href={gradeSheetRoutes.print.show.url(
                                    gradeSheet.id,
                                )}
                                target="_blank"
                                rel="noopener"
                                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#2F6F4E]/30 bg-white px-5 text-sm font-semibold text-[#2F6F4E] hover:bg-[#2F6F4E]/5"
                            >
                                <Printer
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                />
                                Print
                            </a>
                            {canAddStudent ? (
                                <Link
                                    href={gradeSheetRoutes.studentGrades.create.url(
                                        gradeSheet.id,
                                    )}
                                    className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#2F6F4E] px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#25573E]"
                                >
                                    <Plus
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                    />
                                    Create
                                </Link>
                            ) : (
                                <span
                                    aria-disabled="true"
                                    title="Every enrolled student is already on this grade sheet."
                                    className="inline-flex min-h-11 cursor-not-allowed items-center gap-2 rounded-full bg-[#2F6F4E]/40 px-5 text-sm font-semibold text-white"
                                >
                                    <Plus
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                    />
                                    Create
                                </span>
                            )}
                        </div>
                    </div>

                    {props.flash?.success && (
                        <div
                            role="status"
                            className="mb-4 rounded-xl border border-[#2F6F4E]/25 bg-[#2F6F4E]/5 px-4 py-3 text-sm text-[#2F6F4E]"
                        >
                            {props.flash.success}
                        </div>
                    )}

                    <dl className="mb-6 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[#1F2A24]/10 bg-[#1F2A24]/10 sm:grid-cols-2 lg:grid-cols-4">
                        {details.map((detail) => (
                            <div key={detail.label} className="bg-white p-4">
                                <dt className="text-xs font-semibold tracking-wide text-[#1F2A24]/55 uppercase">
                                    {detail.label}
                                </dt>
                                <dd
                                    className={`mt-1 font-semibold text-[#1F2A24] ${detail.mono ? 'font-mono text-[#2F6F4E]' : ''}`}
                                >
                                    {detail.value}
                                </dd>
                            </div>
                        ))}
                    </dl>

                    {studentGrades.length === 0 ? (
                        <div className="flex flex-col items-center rounded-2xl border border-dashed border-[#1F2A24]/15 bg-white px-6 py-14 text-center">
                            <Users
                                className="h-10 w-10 text-[#2F6F4E]/60"
                                aria-hidden="true"
                            />
                            <p className="mt-3 font-medium text-[#1F2A24]">
                                No students on this grade sheet yet
                            </p>
                            <p className="mt-1 max-w-md text-sm text-[#1F2A24]/65">
                                {canAddStudent
                                    ? 'Press Create to choose a student and enter their grades.'
                                    : 'No approved students are enrolled in this subject for this school year yet.'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border border-[#1F2A24]/10 bg-white">
                            <table className="w-full min-w-[820px] text-left text-sm">
                                <thead className="border-b border-[#1F2A24]/10 bg-[#1F2A24]/[0.03] text-xs tracking-wide text-[#1F2A24]/60 uppercase">
                                    <tr>
                                        <th className="w-10 px-4 py-3 font-semibold">
                                            #
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            Student
                                        </th>
                                        {TERMS.map((term) => (
                                            <th
                                                key={term.key}
                                                className="px-4 py-3 text-right font-semibold"
                                            >
                                                {term.label}
                                            </th>
                                        ))}
                                        <th className="px-4 py-3 text-right font-semibold">
                                            Final
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            Remarks
                                        </th>
                                        <th className="px-4 py-3">
                                            <span className="sr-only">
                                                Actions
                                            </span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#1F2A24]/10">
                                    {studentGrades.map(
                                        (studentGrade, index) => (
                                            <tr key={studentGrade.id}>
                                                <td className="px-4 py-3 text-[#1F2A24]/50 tabular-nums">
                                                    {index + 1}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="block font-medium text-[#1F2A24]">
                                                        {
                                                            studentGrade.student_name
                                                        }
                                                    </span>
                                                    <span className="text-xs text-[#1F2A24]/60">
                                                        {studentGrade.lrn
                                                            ? `LRN ${studentGrade.lrn}`
                                                            : 'No LRN yet'}
                                                    </span>
                                                </td>
                                                {TERMS.map((term) => (
                                                    <td
                                                        key={term.key}
                                                        className="px-4 py-3 text-right text-[#1F2A24]/80 tabular-nums"
                                                    >
                                                        {formatGrade(
                                                            studentGrade[
                                                                term.key
                                                            ],
                                                        )}
                                                    </td>
                                                ))}
                                                <td className="px-4 py-3 text-right font-semibold text-[#1F2A24] tabular-nums">
                                                    {formatGrade(
                                                        studentGrade.final_grade,
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <RemarksBadge
                                                        remarks={
                                                            studentGrade.remarks
                                                        }
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex justify-end gap-1">
                                                        <Link
                                                            href={studentGradeRoutes.edit.url(
                                                                studentGrade.id,
                                                            )}
                                                            className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-[#2F6F4E] hover:bg-[#2F6F4E]/5"
                                                        >
                                                            <Pencil
                                                                className="h-4 w-4"
                                                                aria-hidden="true"
                                                            />
                                                            Edit
                                                            <span className="sr-only">
                                                                {' '}
                                                                {
                                                                    studentGrade.student_name
                                                                }
                                                            </span>
                                                        </Link>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                removeStudent(
                                                                    studentGrade,
                                                                )
                                                            }
                                                            aria-label={`Remove ${studentGrade.student_name}`}
                                                            className="inline-flex size-10 items-center justify-center rounded-full text-[#1F2A24]/50 hover:bg-[#C6473B]/10 hover:text-[#A3372D]"
                                                        >
                                                            <Trash2
                                                                className="h-4 w-4"
                                                                aria-hidden="true"
                                                            />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ),
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="mt-8 border-t border-[#1F2A24]/10 pt-4">
                        <button
                            type="button"
                            onClick={deleteGradeSheet}
                            className="inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold text-[#A3372D] hover:bg-[#C6473B]/10"
                        >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                            Delete grade sheet
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
