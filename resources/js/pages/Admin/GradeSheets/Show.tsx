import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Archive,
    ArchiveRestore,
    ArrowLeft,
    Download,
    Pencil,
    Plus,
    Printer,
    Send,
    Trophy,
    UserPlus,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import { useConfirm } from '@/hooks/use-confirm';
import gradeSheetRoutes from '@/routes/admin/grade-sheets';
import studentGradeRoutes from '@/routes/admin/student-grades';
import type { StudentOption } from '../StudentGrades/Components/StudentCombobox';
import AddStudentsDialog from './Components/AddStudentsDialog';
import SendGradesDialog from './Components/SendGradesDialog';
import type { SendGrades } from './Components/SendGradesDialog';
import AwardsDialog from './Components/AwardsDialog';
import type {
    AwardCriterion,
    GradeLevelAwards,
    RecognitionOption,
} from './Components/AwardsDialog';
import GradesTable from './Components/GradesTable';
import EditScheduleDialog from './Components/EditScheduleDialog';
import type { GradeSheetSummary, StudentGradeRow } from './Components/types';

type Props = {
    gradeSheet: GradeSheetSummary;
    studentGrades: StudentGradeRow[];
    /** Enrolled students not on the sheet yet; adding is off when empty. */
    ungradedStudents: StudentOption[];
    /** Students who applied for the next school year; null while archived. */
    sendGrades: SendGrades | null;
    /** Grade 4 and up, for staff who can see awards. */
    showsAwards: boolean;
    /** Loaded when the Awards dialog opens; undefined until then. */
    awards?: GradeLevelAwards | null;
    awardCriteria: AwardCriterion[];
    recognitionOptions: RecognitionOption[];
};

export default function Show({
    gradeSheet,
    studentGrades,
    ungradedStudents,
    sendGrades,
    showsAwards,
    awards,
    awardCriteria,
    recognitionOptions,
}: Props) {
    const { props } = usePage<{ flash?: { success?: string } }>();
    const [confirm, confirmDialog] = useConfirm();
    const [isAddingStudents, setIsAddingStudents] = useState(false);
    const [isEditingSchedule, setIsEditingSchedule] = useState(false);
    const [isSendingGrades, setIsSendingGrades] = useState(false);
    const [isViewingAwards, setIsViewingAwards] = useState(false);

    const canAddStudent = ungradedStudents.length > 0;
    const [isAddingAll, setIsAddingAll] = useState(false);

    // The whole class in one click, without opening the picker.
    const addAllStudents = () =>
        router.post(
            gradeSheetRoutes.students.store.url(gradeSheet.id),
            {
                enrollment_ids: ungradedStudents.map(
                    (student) => student.enrollment_id,
                ),
            },
            {
                preserveScroll: true,
                onStart: () => setIsAddingAll(true),
                onFinish: () => setIsAddingAll(false),
            },
        );

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

    const isArchived = gradeSheet.archived_at !== null;

    const archiveGradeSheet = async () => {
        const confirmed = await confirm({
            title: `Archive grade sheet ${gradeSheet.number}?`,
            description:
                'It leaves the list and can’t be edited, and its grades stop showing to students. Nothing is deleted: restore it from the archive any time.',
            confirmLabel: 'Archive Grade Sheet',
        });

        if (confirmed) {
            router.post(gradeSheetRoutes.archive.store.url(gradeSheet.id));
        }
    };

    const restoreGradeSheet = () =>
        router.delete(gradeSheetRoutes.archive.destroy.url(gradeSheet.id), {
            preserveScroll: true,
        });

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
            {showsAwards && (
                <AwardsDialog
                    awards={awards}
                    criteria={awardCriteria}
                    recognitionOptions={recognitionOptions}
                    open={isViewingAwards}
                    onOpenChange={setIsViewingAwards}
                />
            )}
            {sendGrades && (
                <SendGradesDialog
                    sendGrades={sendGrades}
                    open={isSendingGrades}
                    onOpenChange={setIsSendingGrades}
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
                        {/* Two even columns on phones, a row of buttons from there up. */}
                        <div className="grid w-full grid-cols-2 gap-2 *:justify-center *:px-3 sm:flex sm:w-auto sm:flex-wrap sm:*:px-5">
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
                            {studentGrades.length > 0 && (
                                // Every student's report card, one page each,
                                // in one PDF to print together.
                                <a
                                    href={gradeSheetRoutes.reportCards.show.url(
                                        gradeSheet.id,
                                    )}
                                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#2F6F4E]/30 bg-white px-5 text-sm font-semibold text-[#2F6F4E] hover:bg-[#2F6F4E]/5"
                                >
                                    <Download
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                    />
                                    Download report cards
                                </a>
                            )}
                            {sendGrades && (
                                // Each student's report card, as the Form 138 of
                                // their next school year's application.
                                <button
                                    type="button"
                                    onClick={() => setIsSendingGrades(true)}
                                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#2F6F4E]/30 bg-white px-5 text-sm font-semibold text-[#2F6F4E] hover:bg-[#2F6F4E]/5"
                                >
                                    <Send
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                    />
                                    Send grades
                                    {sendGrades.students.length > 0 && (
                                        <span className="rounded-full bg-[#2F6F4E]/10 px-1.5 text-xs tabular-nums">
                                            {sendGrades.students.length}
                                        </span>
                                    )}
                                </button>
                            )}
                            {showsAwards && (
                                // The grade level's academic awards (Grade 4
                                // and up), from every subject's grade sheet.
                                <button
                                    type="button"
                                    onClick={() => setIsViewingAwards(true)}
                                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#2F6F4E]/30 bg-white px-5 text-sm font-semibold text-[#2F6F4E] hover:bg-[#2F6F4E]/5"
                                >
                                    <Trophy
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                    />
                                    Awards
                                </button>
                            )}
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
                            {isArchived ? null : canAddStudent ? (
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

                    {isArchived && gradeSheet.archived_at && (
                        <div
                            role="status"
                            className="mb-4 flex flex-col gap-3 rounded-xl border border-[#E8A33D]/40 bg-[#E8A33D]/10 px-4 py-3 text-sm text-[#7a4d0b] sm:flex-row sm:items-center sm:justify-between"
                        >
                            <p className="flex items-start gap-2">
                                <Archive
                                    className="mt-0.5 h-4 w-4 shrink-0"
                                    aria-hidden="true"
                                />
                                <span>
                                    <span className="font-semibold">
                                        Archived on{' '}
                                        {new Date(
                                            gradeSheet.archived_at,
                                        ).toLocaleDateString(undefined, {
                                            dateStyle: 'medium',
                                        })}
                                        .
                                    </span>{' '}
                                    It can’t be edited and its grades don’t show
                                    to students until it’s restored.
                                </span>
                            </p>
                            <button
                                type="button"
                                onClick={restoreGradeSheet}
                                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[#2F6F4E] px-4 text-sm font-semibold text-white hover:bg-[#25573E]"
                            >
                                <ArchiveRestore
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                />
                                Restore
                            </button>
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
                            {!isArchived && (
                                <button
                                    type="button"
                                    onClick={() => setIsEditingSchedule(true)}
                                    className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-[#2F6F4E] hover:bg-[#2F6F4E]/10"
                                >
                                    <Pencil
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                    />
                                    <span className="sr-only">
                                        Edit schedule
                                    </span>
                                </button>
                            )}
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
                                {isArchived
                                    ? 'Restore it to add students.'
                                    : canAddStudent
                                      ? `${ungradedStudents.length === 1 ? '1 student is' : `${ungradedStudents.length} students are`} taking ${gradeSheet.grade_level} ${gradeSheet.subject} in SY ${gradeSheet.school_year}.`
                                      : `No approved students are taking ${gradeSheet.grade_level} ${gradeSheet.subject} in SY ${gradeSheet.school_year}. If the class is in another school year, archive this sheet and create one for that year.`}
                            </p>
                            {canAddStudent && (
                                <button
                                    type="button"
                                    disabled={isAddingAll}
                                    onClick={addAllStudents}
                                    className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#2F6F4E] px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#25573E] disabled:opacity-60"
                                >
                                    <UserPlus
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                    />
                                    Add all{' '}
                                    {ungradedStudents.length === 1
                                        ? '1 student'
                                        : `${ungradedStudents.length} students`}
                                </button>
                            )}
                        </div>
                    ) : (
                        <GradesTable
                            // Starts over from the saved grades after each save.
                            key={JSON.stringify(studentGrades)}
                            gradeSheetId={gradeSheet.id}
                            studentGrades={studentGrades}
                            onRemove={removeStudent}
                            readOnly={isArchived}
                        />
                    )}

                    {!isArchived && (
                        <div className="mt-8 border-t border-[#1F2A24]/10 pt-4">
                            <button
                                type="button"
                                onClick={archiveGradeSheet}
                                className="inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold text-[#1F2A24]/70 hover:bg-[#1F2A24]/5"
                            >
                                <Archive
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                />
                                Archive grade sheet
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
