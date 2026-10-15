import { Head, router, usePage } from '@inertiajs/react';
import {
    CheckCircle2,
    Loader2,
    Send,
    TriangleAlert,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import { useConfirm } from '@/hooks/use-confirm';
import reportCardRoutes from '@/routes/admin/report-cards';
import { SELECT_CLASS } from '../GradeSheets/Components/types';

type StudentRow = {
    /** The student's application for the school year being sent. */
    id: number;
    name: string;
    lrn: string | null;
    grade_level: string;
    section: string | null;
    general_average: number | null;
    /** Learning areas without a final grade; sending waits for them. */
    missing_final_grades: string[];
    next_application: {
        id: number;
        grade_level: string;
        status: 'PENDING' | 'APPROVED';
        /** A Form 138 is already on it (sent earlier, or uploaded). */
        has_form_138: boolean;
    };
};

type Props = {
    students: StudentRow[];
    /** Students graded this year who haven't applied for the next one. */
    notYetAppliedCount: number;
    schoolYear: string;
    nextSchoolYear: string;
    schoolYears: string[];
};

/**
 * A school year's students who applied for the next one, so the teacher
 * can send each one's report card on as that application's Form 138.
 */
export default function Index({
    students,
    notYetAppliedCount,
    schoolYear,
    nextSchoolYear,
    schoolYears,
}: Props) {
    const { props } = usePage<{
        flash?: { success?: string };
        errors: Record<string, string>;
    }>();
    const [confirm, confirmDialog] = useConfirm();
    // The rows being sent, to show which buttons are busy.
    const [sendingIds, setSendingIds] = useState<number[]>([]);

    const isReady = (student: StudentRow) =>
        student.missing_final_grades.length === 0;
    const readyToSend = students.filter(
        (student) => isReady(student) && !student.next_application.has_form_138,
    );

    const changeSchoolYear = (year: string) =>
        router.get(
            reportCardRoutes.index.url(),
            { school_year: year },
            { preserveScroll: true, replace: true },
        );

    const send = (ids: number[]) =>
        router.post(
            reportCardRoutes.store.url(),
            { school_year: schoolYear, enrollment_ids: ids },
            {
                preserveScroll: true,
                onStart: () => setSendingIds(ids),
                onFinish: () => setSendingIds([]),
            },
        );

    const sendOne = async (student: StudentRow) => {
        if (student.next_application.has_form_138) {
            const confirmed = await confirm({
                title: `Send ${student.name}'s grades again?`,
                description: `Their S.Y. ${nextSchoolYear} application already has a Form 138. It will be replaced with a new report card made from the current grades.`,
                confirmLabel: 'Replace Form 138',
            });

            if (!confirmed) {
                return;
            }
        }

        send([student.id]);
    };

    const sendAllReady = async () => {
        const confirmed = await confirm({
            title: `Send ${readyToSend.length === 1 ? '1 report card' : `${readyToSend.length} report cards`}?`,
            description: `Each student's S.Y. ${schoolYear} report card, made from every subject's grade sheet, goes on their S.Y. ${nextSchoolYear} application as the Form 138, marked verified.`,
            confirmLabel: 'Send grades',
        });

        if (confirmed) {
            send(readyToSend.map((student) => student.id));
        }
    };

    const isSending = sendingIds.length > 0;

    return (
        <>
            <Head title="Send Grades" />
            {confirmDialog}

            <div className="bg-[#FBF8F2] px-4 py-8">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                        <div className="max-w-2xl">
                            <h1 className="font-serif text-2xl font-semibold text-[#1F2A24]">
                                Send Grades
                            </h1>
                            <p className="text-sm text-[#1F2A24]/70">
                                Send each student's S.Y. {schoolYear} grades in
                                every subject to their S.Y. {nextSchoolYear}{' '}
                                application. Their report card is made from the
                                grade sheets and becomes the application's Form
                                138.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={sendAllReady}
                            disabled={readyToSend.length === 0 || isSending}
                            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#2F6F4E] px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#25573E] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isSending && sendingIds.length > 1 ? (
                                <Loader2
                                    className="h-4 w-4 animate-spin"
                                    aria-hidden="true"
                                />
                            ) : (
                                <Send className="h-4 w-4" aria-hidden="true" />
                            )}
                            Send all ready ({readyToSend.length})
                        </button>
                    </div>

                    {props.flash?.success && (
                        <div
                            role="status"
                            className="mb-4 rounded-xl border border-[#2F6F4E]/25 bg-[#2F6F4E]/5 px-4 py-3 text-sm text-[#2F6F4E]"
                        >
                            {props.flash.success}
                        </div>
                    )}

                    {props.errors.enrollment_ids && (
                        <div
                            role="alert"
                            className="mb-4 rounded-xl border border-[#C6473B]/30 bg-[#C6473B]/5 px-4 py-3 text-sm text-[#A83A30]"
                        >
                            {props.errors.enrollment_ids}
                        </div>
                    )}

                    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-[#1F2A24]/10 bg-white p-4">
                        <label htmlFor="school-year" className="sr-only">
                            Send grades from school year
                        </label>
                        <select
                            id="school-year"
                            value={schoolYear}
                            onChange={(e) => changeSchoolYear(e.target.value)}
                            className={`${SELECT_CLASS} sm:w-72`}
                        >
                            {schoolYears.map((year) => (
                                <option key={year} value={year}>
                                    From S.Y. {year}
                                </option>
                            ))}
                        </select>
                        <p
                            aria-live="polite"
                            className="text-sm text-[#1F2A24]/65 sm:ml-auto"
                        >
                            {students.length === 1
                                ? '1 student applied'
                                : `${students.length} students applied`}{' '}
                            for S.Y. {nextSchoolYear}
                            {notYetAppliedCount > 0 &&
                                ` · ${notYetAppliedCount} not yet`}
                        </p>
                    </div>

                    {students.length === 0 ? (
                        <div className="flex flex-col items-center rounded-2xl border border-dashed border-[#1F2A24]/15 bg-white px-6 py-14 text-center">
                            <Users
                                className="h-10 w-10 text-[#2F6F4E]/60"
                                aria-hidden="true"
                            />
                            <p className="mt-3 font-medium text-[#1F2A24]">
                                Nobody to send grades for yet
                            </p>
                            <p className="mt-1 max-w-md text-sm text-[#1F2A24]/65">
                                Students on your S.Y. {schoolYear} grade sheets
                                show here once they apply for S.Y.{' '}
                                {nextSchoolYear}.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border border-[#1F2A24]/10 bg-white">
                            <table className="w-full min-w-[820px] text-left text-sm">
                                <thead className="border-b border-[#1F2A24]/10 bg-[#1F2A24]/[0.03] text-xs tracking-wide text-[#1F2A24]/60 uppercase">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">
                                            Student
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            S.Y. {schoolYear}
                                        </th>
                                        <th className="px-4 py-3 text-right font-semibold">
                                            General Average
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            S.Y. {nextSchoolYear} Application
                                        </th>
                                        <th className="px-4 py-3">
                                            <span className="sr-only">
                                                Send
                                            </span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#1F2A24]/10">
                                    {students.map((student) => {
                                        const next = student.next_application;
                                        const isThisSending =
                                            sendingIds.includes(student.id);

                                        return (
                                            <tr key={student.id}>
                                                <td className="px-4 py-3">
                                                    <span className="block font-medium text-[#1F2A24]">
                                                        {student.name}
                                                    </span>
                                                    <span className="text-xs text-[#1F2A24]/60 tabular-nums">
                                                        {student.lrn
                                                            ? `LRN ${student.lrn}`
                                                            : 'No LRN yet'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-[#1F2A24]/80">
                                                    {student.grade_level}
                                                    {student.section &&
                                                        ` · Section ${student.section}`}
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold text-[#1F2A24] tabular-nums">
                                                    {student.general_average ===
                                                    null
                                                        ? '—'
                                                        : student.general_average.toFixed(
                                                              2,
                                                          )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="block text-[#1F2A24]/80">
                                                        {next.grade_level} ·{' '}
                                                        {next.status ===
                                                        'APPROVED'
                                                            ? 'Approved'
                                                            : 'Pending'}
                                                    </span>
                                                    {next.has_form_138 ? (
                                                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#2F6F4E]">
                                                            <CheckCircle2
                                                                className="h-3.5 w-3.5"
                                                                aria-hidden="true"
                                                            />
                                                            Form 138 on file
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-[#a4670f]">
                                                            Form 138 not sent
                                                            yet
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    {isReady(student) ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                sendOne(student)
                                                            }
                                                            disabled={isSending}
                                                            className={`inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors disabled:opacity-50 ${
                                                                next.has_form_138
                                                                    ? 'text-[#2F6F4E] hover:bg-[#2F6F4E]/5'
                                                                    : 'border border-[#2F6F4E]/30 text-[#2F6F4E] hover:bg-[#2F6F4E]/5'
                                                            }`}
                                                        >
                                                            {isThisSending ? (
                                                                <Loader2
                                                                    className="h-4 w-4 animate-spin"
                                                                    aria-hidden="true"
                                                                />
                                                            ) : (
                                                                <Send
                                                                    className="h-4 w-4"
                                                                    aria-hidden="true"
                                                                />
                                                            )}
                                                            {next.has_form_138
                                                                ? 'Resend'
                                                                : 'Send'}
                                                            <span className="sr-only">
                                                                {' '}
                                                                {student.name}'s
                                                                grades
                                                            </span>
                                                        </button>
                                                    ) : (
                                                        <span className="inline-flex max-w-56 items-start gap-1.5 text-left text-xs text-[#a4670f]">
                                                            <TriangleAlert
                                                                className="mt-0.5 h-3.5 w-3.5 shrink-0"
                                                                aria-hidden="true"
                                                            />
                                                            No final grade in{' '}
                                                            {student.missing_final_grades.join(
                                                                ', ',
                                                            )}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
