import { router, useForm } from '@inertiajs/react';
import { FileText, Loader2, Trash2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import gradeSheetRoutes from '@/routes/admin/grade-sheets';
import studentGradeRoutes from '@/routes/admin/student-grades';
import { PASSING_GRADE, TERMS, formatGrade } from './types';
import type { StudentGradeRow, TermKey } from './types';

type GradeRow = { id: number } & Record<TermKey, string>;

const cellInputClass =
    'min-h-10 w-20 rounded-md border border-transparent bg-transparent px-2 py-1.5 text-right text-base text-[#1F2A24] tabular-nums transition-colors placeholder:text-[#1F2A24]/30 hover:border-[#1F2A24]/15 hover:bg-white focus:border-[#2F6F4E] focus:bg-white focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none aria-[invalid=true]:border-[#C6473B] aria-[invalid=true]:bg-[#C6473B]/5 sm:text-sm';

/** Always outlined and full width on phones, where there's no hover. */
const mobileInputClass =
    'min-h-11 w-full rounded-lg border border-[#1F2A24]/15 bg-white px-2 py-2 text-center text-base text-[#1F2A24] tabular-nums placeholder:text-[#1F2A24]/30 read-only:bg-[#1F2A24]/[0.03] focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none aria-[invalid=true]:border-[#C6473B] aria-[invalid=true]:bg-[#C6473B]/5';

function toFormRows(studentGrades: StudentGradeRow[]): GradeRow[] {
    return studentGrades.map((row) => ({
        id: row.id,
        term_1: row.term_1 ?? '',
        term_2: row.term_2 ?? '',
        term_3: row.term_3 ?? '',
    }));
}

/** "85" and "85.00" are the same grade, so typing it again isn't a change. */
function sameGrade(a: string, b: string): boolean {
    return (
        a.trim() === b.trim() ||
        (a !== '' && b !== '' && Number(a) === Number(b))
    );
}

/** The average once all three terms are in, as the server works it out. */
function finalGrade(row: GradeRow): number | null {
    const grades = TERMS.map((term) => row[term.key]);

    if (grades.some((grade) => grade.trim() === '' || isNaN(Number(grade)))) {
        return null;
    }

    return (
        Math.round(
            (grades.reduce((sum, grade) => sum + Number(grade), 0) /
                grades.length) *
                100,
        ) / 100
    );
}

function RemarksBadge({ final }: { final: number | null }) {
    if (final === null) {
        return <span className="text-[#1F2A24]/40">—</span>;
    }

    const passed = final >= PASSING_GRADE;

    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                passed
                    ? 'bg-[#2F6F4E]/10 text-[#2F6F4E]'
                    : 'bg-[#C6473B]/10 text-[#A3372D]'
            }`}
        >
            {passed ? 'Passed' : 'Failed'}
        </span>
    );
}

/**
 * The grade sheet's students with every term grade editable in place: click
 * a box, type, and save all the changes at once from the bar that appears.
 * Enter moves down a column, like a spreadsheet. Remount it (by key) when
 * the saved grades change, so it starts from them. `readOnly` shows the
 * grades without letting them change, as on an archived sheet.
 */
export default function GradesTable({
    gradeSheetId,
    studentGrades,
    onRemove,
    readOnly = false,
}: {
    gradeSheetId: number;
    studentGrades: StudentGradeRow[];
    onRemove: (studentGrade: StudentGradeRow) => void;
    readOnly?: boolean;
}) {
    const isMobile = useIsMobile();
    const savedRows = toFormRows(studentGrades);
    const {
        data,
        setData,
        put,
        transform,
        processing,
        errors,
        reset,
        clearErrors,
    } = useForm<{ grades: GradeRow[] }>({ grades: savedRows });

    // Only the rows that changed are sent, so errors come back keyed by
    // their place in that list; this maps them back to the rows.
    const sentRowIds = useRef<number[]>([]);
    const fieldErrors = errors as Record<string, string | undefined>;
    const errorFor = (rowId: number, term: TermKey) => {
        const sentIndex = sentRowIds.current.indexOf(rowId);

        return sentIndex === -1
            ? undefined
            : fieldErrors[`grades.${sentIndex}.${term}`];
    };

    const isRowChanged = (row: GradeRow, index: number) =>
        TERMS.some(
            (term) => !sameGrade(row[term.key], savedRows[index][term.key]),
        );
    const changedRows = data.grades.filter(isRowChanged);
    const hasChanges = changedRows.length > 0;

    // Leaving with unsaved grades asks first, in the app and the browser.
    useEffect(() => {
        if (!hasChanges) {
            return;
        }

        const warnOnUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
        };
        window.addEventListener('beforeunload', warnOnUnload);
        const removeVisitGuard = router.on('before', (event) => {
            if (
                event.detail.visit.method === 'get' &&
                !window.confirm(
                    'You have unsaved grades. Leave without saving?',
                )
            ) {
                event.preventDefault();
            }
        });

        return () => {
            window.removeEventListener('beforeunload', warnOnUnload);
            removeVisitGuard();
        };
    }, [hasChanges]);

    const setGrade = (index: number, term: TermKey, value: string) =>
        setData(
            'grades',
            data.grades.map((row, rowIndex) =>
                rowIndex === index ? { ...row, [term]: value } : row,
            ),
        );

    const onCellKeyDown = (
        event: KeyboardEvent<HTMLInputElement>,
        index: number,
        term: TermKey,
    ) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            document.getElementById(`grade-${index + 1}-${term}`)?.focus();
        }

        if (event.key === 'Escape') {
            setGrade(index, term, savedRows[index][term]);
        }
    };

    const save = (e: FormEvent) => {
        e.preventDefault();
        sentRowIds.current = changedRows.map((row) => row.id);
        transform(() => ({ grades: changedRows }));
        put(gradeSheetRoutes.grades.update.url(gradeSheetId), {
            preserveScroll: true,
        });
    };

    const errorCount = Object.keys(errors).length;

    /** One term's grade box, shared by the table and the phone cards. */
    const termInput = (
        studentGrade: StudentGradeRow,
        index: number,
        term: (typeof TERMS)[number],
        className: string,
    ) => {
        const error = errorFor(studentGrade.id, term.key);

        return (
            <>
                <input
                    id={`grade-${index}-${term.key}`}
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={100}
                    step="0.01"
                    placeholder="—"
                    readOnly={readOnly}
                    tabIndex={readOnly ? -1 : undefined}
                    value={data.grades[index][term.key]}
                    onChange={(e) => setGrade(index, term.key, e.target.value)}
                    onKeyDown={(e) => onCellKeyDown(e, index, term.key)}
                    aria-label={`${term.label} grade for ${studentGrade.student_name}`}
                    aria-invalid={!!error}
                    title={error}
                    className={className}
                />
                {error && (
                    <p className="mt-1 text-left text-xs text-[#C6473B]">
                        {error}
                    </p>
                )}
            </>
        );
    };

    /** The report card link and, while editable, the remove button. */
    const rowActions = (studentGrade: StudentGradeRow) => (
        <>
            {/* A PDF in a new tab, to view or print. */}
            <a
                href={studentGradeRoutes.reportCard.show.url(studentGrade.id)}
                target="_blank"
                rel="noopener"
                title="Report card"
                aria-label={`${studentGrade.student_name}'s report card (opens in a new tab)`}
                className="inline-flex size-10 items-center justify-center rounded-full text-[#2F6F4E]/70 hover:bg-[#2F6F4E]/10 hover:text-[#2F6F4E]"
            >
                <FileText className="h-4 w-4" aria-hidden="true" />
            </a>
            {!readOnly && (
                <button
                    type="button"
                    onClick={() => onRemove(studentGrade)}
                    aria-label={`Remove ${studentGrade.student_name}`}
                    className="inline-flex size-10 items-center justify-center rounded-full text-[#1F2A24]/40 hover:bg-[#C6473B]/10 hover:text-[#A3372D]"
                >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
            )}
        </>
    );

    return (
        <form onSubmit={save}>
            {!readOnly && (
                <p className="mb-2 text-xs text-[#1F2A24]/60">
                    {isMobile
                        ? 'Tap a term to change it.'
                        : 'Click a term to change it. Enter moves down, Esc undoes the box.'}{' '}
                    Grades are 0–100, up to two decimals.
                </p>
            )}

            {isMobile ? (
                // One card per student on phones, so nothing scrolls sideways.
                <ul className="divide-y divide-[#1F2A24]/10 overflow-hidden rounded-2xl border border-[#1F2A24]/10 bg-white">
                    {studentGrades.map((studentGrade, index) => {
                        const row = data.grades[index];
                        const final = finalGrade(row);

                        return (
                            <li
                                key={studentGrade.id}
                                className={`p-4 ${isRowChanged(row, index) ? 'bg-[#E8A33D]/[0.07]' : ''}`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="font-medium break-words text-[#1F2A24]">
                                            <span className="mr-1.5 text-[#1F2A24]/45 tabular-nums">
                                                {index + 1}.
                                            </span>
                                            {studentGrade.student_name}
                                        </p>
                                        <p className="text-xs text-[#1F2A24]/60">
                                            {studentGrade.lrn
                                                ? `LRN ${studentGrade.lrn}`
                                                : 'No LRN yet'}
                                        </p>
                                    </div>
                                    <div className="-mt-1.5 -mr-2 flex shrink-0">
                                        {rowActions(studentGrade)}
                                    </div>
                                </div>

                                <div className="mt-3 grid grid-cols-3 gap-2">
                                    {TERMS.map((term) => (
                                        <div key={term.key}>
                                            <label
                                                htmlFor={`grade-${index}-${term.key}`}
                                                className="mb-1 block text-[11px] font-medium text-[#1F2A24]/60"
                                            >
                                                {term.label}
                                            </label>
                                            {termInput(
                                                studentGrade,
                                                index,
                                                term,
                                                mobileInputClass,
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#1F2A24]/10 pt-3">
                                    <span className="text-sm text-[#1F2A24]/70">
                                        Final{' '}
                                        <span className="font-semibold text-[#1F2A24] tabular-nums">
                                            {formatGrade(final)}
                                        </span>
                                    </span>
                                    <RemarksBadge final={final} />
                                </div>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <div className="overflow-x-auto rounded-2xl border border-[#1F2A24]/10 bg-white">
                    <table className="w-full min-w-[760px] text-left text-sm">
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
                                        className="px-2 py-3 text-right font-semibold"
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
                                <th className="px-2 py-3">
                                    <span className="sr-only">
                                        Report card and remove
                                    </span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1F2A24]/10">
                            {studentGrades.map((studentGrade, index) => {
                                const row = data.grades[index];
                                const isChanged = isRowChanged(row, index);
                                const final = finalGrade(row);

                                return (
                                    <tr
                                        key={studentGrade.id}
                                        className={
                                            isChanged
                                                ? 'bg-[#E8A33D]/[0.07]'
                                                : ''
                                        }
                                    >
                                        <td className="px-4 py-2 text-[#1F2A24]/50 tabular-nums">
                                            {index + 1}
                                        </td>
                                        <td className="px-4 py-2">
                                            <span className="block font-medium text-[#1F2A24]">
                                                {studentGrade.student_name}
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
                                                className="max-w-28 px-2 py-2 text-right align-top"
                                            >
                                                {termInput(
                                                    studentGrade,
                                                    index,
                                                    term,
                                                    cellInputClass,
                                                )}
                                            </td>
                                        ))}
                                        <td className="px-4 py-2 text-right font-semibold text-[#1F2A24] tabular-nums">
                                            {formatGrade(final)}
                                        </td>
                                        <td className="px-4 py-2">
                                            <RemarksBadge final={final} />
                                        </td>
                                        <td className="px-2 py-2 text-right whitespace-nowrap">
                                            {rowActions(studentGrade)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {(hasChanges || errorCount > 0) && (
                <div
                    role="region"
                    aria-label="Unsaved grades"
                    className="sticky bottom-4 z-10 mt-4 flex flex-col gap-3 rounded-2xl border border-[#1F2A24]/10 bg-white px-4 py-3 shadow-lg sm:flex-row sm:items-center sm:justify-between"
                >
                    <p aria-live="polite" className="text-sm text-[#1F2A24]/75">
                        {errorCount > 0
                            ? 'Some grades need fixing. They’re highlighted above.'
                            : changedRows.length === 1
                              ? '1 student’s grades changed.'
                              : `${changedRows.length} students’ grades changed.`}
                    </p>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                reset();
                                clearErrors();
                            }}
                            disabled={processing}
                            className="min-h-11 flex-1 rounded-full border border-[#1F2A24]/15 px-5 text-sm font-semibold text-[#1F2A24]/75 hover:bg-[#1F2A24]/5 disabled:opacity-50 sm:flex-none"
                        >
                            Discard
                        </button>
                        <button
                            type="submit"
                            disabled={processing || !hasChanges}
                            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#2F6F4E] px-6 text-sm font-semibold text-white shadow-sm hover:bg-[#25573E] disabled:opacity-50 sm:flex-none"
                        >
                            {processing && (
                                <Loader2
                                    className="h-4 w-4 animate-spin"
                                    aria-hidden="true"
                                />
                            )}
                            Save grades
                        </button>
                    </div>
                </div>
            )}
        </form>
    );
}
