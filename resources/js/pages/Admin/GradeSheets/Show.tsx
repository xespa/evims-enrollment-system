import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Pencil,
    Plus,
    Printer,
    Trash2,
    UserPlus,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import { useConfirm } from '@/hooks/use-confirm';
import gradeSheetRoutes from '@/routes/admin/grade-sheets';
import studentGradeRoutes from '@/routes/admin/student-grades';
import type { StudentOption } from '../StudentGrades/Components/StudentCombobox';
import AddStudentsDialog from './Components/AddStudentsDialog';
import GradesTable from './Components/GradesTable';
import EditScheduleDialog from './Components/EditScheduleDialog';
import type { GradeSheetSummary, StudentGradeRow } from './Components/types';

type Props = {
    gradeSheet: GradeSheetSummary;
    studentGrades: StudentGradeRow[];
    /** Enrolled students not on the sheet yet; adding is off when empty. */
    ungradedStudents: StudentOption[];
};

export default function Show({
    gradeSheet,
    studentGrades,
    ungradedStudents,
}: Props) {
    const { props } = usePage<{ flash?: { success?: string } }>();
    const [confirm, confirmDialog] = useConfirm();
    const [isAddingStudents, setIsAddingStudents] = useState(false);
    const [isEditingSchedule, setIsEditingSchedule] = useState(false);

    const canAddStudent = ungradedStudents.length > 0;

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
        { label: 'Teacher', value: gradeSheet.teacher },
        {
            label: 'Subject',
            value: `${gradeSheet.subject} · ${gradeSheet.grade_level}`,
        },
        { label: 'Subject Code', value: gradeSheet.subject_code ?? '—' },
        { label: 'School Year', value: gradeSheet.school_year },
        { label: 'Prepared by', value: gradeSheet.prepared_by ?? '—' },
    ];

    return (
        <>
            <Head title={`Grade Sheet ${gradeSheet.number}`} />
            {confirmDialog}
            {isEditingSchedule && (
                <EditScheduleDialog
                    gradeSheet={gradeSheet}
                    open={isEditingSchedule}
                    onOpenChange={setIsEditingSchedule}
                />
            )}
            {isAddingStudents && (
                <AddStudentsDialog
                    gradeSheetId={gradeSheet.id}
                    students={ungradedStudents}
                    open={isAddingStudents}
                    onOpenChange={setIsAddingStudents}
                />
            )}

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
                            {canAddStudent && (
                                <button
                                    type="button"
                                    onClick={() => setIsAddingStudents(true)}
                                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#2F6F4E]/30 bg-white px-5 text-sm font-semibold text-[#2F6F4E] hover:bg-[#2F6F4E]/5"
                                >
                                    <UserPlus
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                    />
                                    Add students
                                    <span className="rounded-full bg-[#2F6F4E]/10 px-1.5 text-xs tabular-nums">
                                        {ungradedStudents.length}
                                    </span>
                                </button>
                            )}
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

                    <dl className="mb-6 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[#1F2A24]/10 bg-[#1F2A24]/10 sm:grid-cols-2 lg:grid-cols-3">
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
                        <div className="flex items-start justify-between gap-2 bg-white p-4 sm:col-span-2 lg:col-span-3">
                            <div className="min-w-0">
                                <dt className="text-xs font-semibold tracking-wide text-[#1F2A24]/55 uppercase">
                                    Schedule
                                </dt>
                                <dd className="mt-1 font-semibold text-[#1F2A24]">
                                    {gradeSheet.schedule ?? (
                                        <span className="font-normal text-[#1F2A24]/50">
                                            Not set
                                        </span>
                                    )}
                                </dd>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsEditingSchedule(true)}
                                className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-[#2F6F4E] hover:bg-[#2F6F4E]/10"
                            >
                                <Pencil
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                />
                                <span className="sr-only">Edit schedule</span>
                            </button>
                        </div>
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
                                    ? 'Use Add students to add the whole class at once, or Create to add one student with their grades.'
                                    : 'No approved students are enrolled in this subject for this school year yet.'}
                            </p>
                        </div>
                    ) : (
                        <GradesTable
                            // Starts over from the saved grades after each save.
                            key={JSON.stringify(studentGrades)}
                            gradeSheetId={gradeSheet.id}
                            studentGrades={studentGrades}
                            onRemove={removeStudent}
                        />
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
