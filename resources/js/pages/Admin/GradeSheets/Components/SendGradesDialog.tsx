import { router, usePage } from '@inertiajs/react';
import {
    CheckCircle2,
    Loader2,
    Send,
    TriangleAlert,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useConfirm } from '@/hooks/use-confirm';
import reportCardRoutes from '@/routes/admin/report-cards';

/** One student on the sheet who applied for the next school year. */
type StudentToSend = {
    /** Their application for the sheet's school year. */
    id: number;
    name: string;
    lrn: string | null;
    section: string | null;
    general_average: number | null;
    /** Learning areas without a final grade; sending waits for them. */
    missing_final_grades: string[];
    next_application: {
        grade_level: string;
        status: string;
        /** A Form 138 is already on it (sent earlier, or uploaded). */
        has_form_138: boolean;
    };
};

/** Mirrors SendGradesToNextApplication::forGradeSheet(). */
export type SendGrades = {
    school_year: string;
    next_school_year: string;
    /** Students on the sheet who haven't applied for the next year yet. */
    not_yet_applied_count: number;
    students: StudentToSend[];
};

/**
 * Sends the sheet's students' grades on to their next school year: each
 * one's report card, made from every subject's grade sheet, becomes their
 * next application's Form 138.
 */
export default function SendGradesDialog({
    sendGrades,
    open,
    onOpenChange,
}: {
    sendGrades: SendGrades;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { props } = usePage<{
        flash?: { success?: string };
        errors: Record<string, string>;
    }>();
    const [confirm, confirmDialog] = useConfirm();
    // The rows being sent, to show which buttons are busy.
    const [sendingIds, setSendingIds] = useState<number[]>([]);
    const [sentMessage, setSentMessage] = useState<string | null>(null);

    const {
        students,
        school_year: schoolYear,
        next_school_year: nextSchoolYear,
    } = sendGrades;
    const isReady = (student: StudentToSend) =>
        student.missing_final_grades.length === 0;
    const readyToSend = students.filter(
        (student) => isReady(student) && !student.next_application.has_form_138,
    );
    const isSending = sendingIds.length > 0;
    const error = props.errors.enrollment_ids;

    const send = (ids: number[]) =>
        router.post(
            reportCardRoutes.store.url(),
            { school_year: schoolYear, enrollment_ids: ids },
            {
                preserveScroll: true,
                preserveState: true,
                onStart: () => {
                    setSendingIds(ids);
                    setSentMessage(null);
                },
                onSuccess: (page) =>
                    setSentMessage(
                        (page.props.flash as { success?: string } | undefined)
                            ?.success ?? null,
                    ),
                onFinish: () => setSendingIds([]),
            },
        );

    const sendOne = async (student: StudentToSend) => {
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {confirmDialog}
            <DialogContent className="flex max-h-[calc(100vh-2rem)] flex-col gap-0 rounded-2xl border-ink/10 bg-surface p-0 text-ink sm:max-w-3xl">
                <DialogHeader className="border-b border-ink/10 p-5 pr-12 text-left">
                    <DialogTitle className="font-serif text-xl">
                        Send grades to S.Y. {nextSchoolYear}
                    </DialogTitle>
                    <DialogDescription className="text-ink/65">
                        Each student's S.Y. {schoolYear} report card, with every
                        subject from all their grade sheets, goes on their S.Y.{' '}
                        {nextSchoolYear} application as the Form 138.
                    </DialogDescription>
                </DialogHeader>

                <div className="min-h-0 flex-1 overflow-y-auto p-4">
                    {sentMessage && !error && (
                        <p
                            role="status"
                            className="mb-3 flex items-start gap-2 rounded-xl border border-brand/25 bg-brand/5 px-3 py-2 text-sm text-brand-ink"
                        >
                            <CheckCircle2
                                className="mt-0.5 h-4 w-4 shrink-0"
                                aria-hidden="true"
                            />
                            {sentMessage}
                        </p>
                    )}
                    {error && (
                        <p
                            role="alert"
                            className="mb-3 rounded-xl border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger-alert"
                        >
                            {error}
                        </p>
                    )}

                    {students.length === 0 ? (
                        <div className="flex flex-col items-center px-6 py-10 text-center">
                            <Users
                                className="h-10 w-10 text-brand-ink/60"
                                aria-hidden="true"
                            />
                            <p className="mt-3 font-medium text-ink">
                                Nobody to send grades for yet
                            </p>
                            <p className="mt-1 max-w-md text-sm text-ink/65">
                                Students on this sheet show here once they apply
                                for S.Y. {nextSchoolYear}.
                            </p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-ink/10 rounded-xl border border-ink/10">
                            {students.map((student) => {
                                const next = student.next_application;

                                return (
                                    <li
                                        key={student.id}
                                        className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div className="min-w-0">
                                            <p className="font-medium text-ink">
                                                {student.name}
                                            </p>
                                            <p className="text-xs text-ink/60">
                                                {student.section
                                                    ? `Section ${student.section} · `
                                                    : ''}
                                                General average{' '}
                                                <span className="font-semibold text-ink tabular-nums">
                                                    {student.general_average ===
                                                    null
                                                        ? '—'
                                                        : student.general_average.toFixed(
                                                              2,
                                                          )}
                                                </span>{' '}
                                                · Applied for {next.grade_level}{' '}
                                                (
                                                {next.status === 'APPROVED'
                                                    ? 'approved'
                                                    : 'pending'}
                                                )
                                            </p>
                                            {next.has_form_138 && (
                                                <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-brand-ink">
                                                    <CheckCircle2
                                                        className="h-3.5 w-3.5"
                                                        aria-hidden="true"
                                                    />
                                                    Form 138 on file
                                                </p>
                                            )}
                                        </div>

                                        {isReady(student) ? (
                                            <button
                                                type="button"
                                                onClick={() => sendOne(student)}
                                                disabled={isSending}
                                                className={`inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-semibold text-brand-ink transition-colors hover:bg-brand/5 disabled:opacity-50 ${
                                                    next.has_form_138
                                                        ? ''
                                                        : 'border border-brand/30'
                                                }`}
                                            >
                                                {sendingIds.includes(
                                                    student.id,
                                                ) ? (
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
                                                    {student.name}'s grades
                                                </span>
                                            </button>
                                        ) : (
                                            <span className="inline-flex max-w-64 shrink-0 items-start gap-1.5 text-xs text-warn-ink">
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
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                <div className="flex flex-col-reverse gap-2 border-t border-ink/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <p aria-live="polite" className="text-sm text-ink/65">
                        {students.length === 1
                            ? '1 student applied'
                            : `${students.length} students applied`}
                        {sendGrades.not_yet_applied_count > 0 &&
                            ` · ${sendGrades.not_yet_applied_count} not yet`}
                    </p>
                    <div className="flex flex-col-reverse gap-2 sm:flex-row">
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="inline-flex min-h-11 items-center justify-center rounded-full border border-ink/15 px-5 text-sm font-semibold text-ink/80 hover:bg-ink/5"
                        >
                            Close
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                send(readyToSend.map((student) => student.id))
                            }
                            disabled={readyToSend.length === 0 || isSending}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white shadow-sm hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-50"
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
                </div>
            </DialogContent>
        </Dialog>
    );
}
