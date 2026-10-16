import { router, useForm } from '@inertiajs/react';
import { FileText, Loader2, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import gradeSheetRoutes from '@/routes/admin/grade-sheets';
import studentGradeRoutes from '@/routes/admin/student-grades';
import { PASSING_GRADE, TERMS, formatGrade } from './types';
import type { StudentGradeRow, TermKey } from './types';

type GradeRow = { id: number } & Record<TermKey, string>;

type SortOrder = 'name' | 'highest' | 'lowest';

const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
    { value: 'name', label: 'Name (A–Z)' },
    { value: 'highest', label: 'Highest final grade' },
    { value: 'lowest', label: 'Lowest final grade' },
];

/**
 * The rows' positions in the chosen order. Sorts by the saved final grade,
 * not what's being typed, so a row doesn't jump while its grades change;
 * students without a final grade yet go last. The server sends them by
 * name, so that order is the list as it came.
 */
function sortedIndexes(
    studentGrades: StudentGradeRow[],
    sortOrder: SortOrder,
): number[] {
    const indexes = studentGrades.map((_, index) => index);

    if (sortOrder === 'name') {
        return indexes;
    }

    const direction = sortOrder === 'highest' ? -1 : 1;

    return indexes.sort((a, b) => {
        const gradeA = studentGrades[a].final_grade;
        const gradeB = studentGrades[b].final_grade;

        if (gradeA === null || gradeB === null) {
            return gradeA === gradeB ? a - b : gradeA === null ? 1 : -1;
        }

        return (gradeA - gradeB) * direction || a - b;
    });
}

const cellInputClass =
    'min-h-10 w-20 rounded-md border border-transparent bg-transparent px-2 py-1.5 text-right text-base text-ink tabular-nums transition-colors placeholder:text-ink/30 hover:border-ink/15 hover:bg-surface focus:border-brand focus:bg-surface focus:ring-2 focus:ring-brand/30 focus:outline-none aria-[invalid=true]:border-danger aria-[invalid=true]:bg-danger/5 sm:text-sm';

/** Always outlined and full width on phones, where there's no hover. */
const mobileInputClass =
    'min-h-11 w-full rounded-lg border border-ink/15 bg-surface px-2 py-2 text-center text-base text-ink tabular-nums placeholder:text-ink/30 read-only:bg-ink/[0.03] focus:border-brand focus:ring-2 focus:ring-brand/30 focus:outline-none aria-[invalid=true]:border-danger aria-[invalid=true]:bg-danger/5';

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
        return <span className="text-ink/40">—</span>;
    }

    const passed = final >= PASSING_GRADE;

    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                passed
                    ? 'bg-brand/10 text-brand-ink'
                    : 'bg-danger/10 text-danger-strong'
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
    const [sortOrder, setSortOrder] = useState<SortOrder>('name');
    const order = sortedIndexes(studentGrades, sortOrder);
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

    /** `position` is the row's place on screen, so Enter goes to the next one shown. */
    const onCellKeyDown = (
        event: KeyboardEvent<HTMLInputElement>,
        index: number,
        position: number,
        term: TermKey,
    ) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            document.getElementById(`grade-${position + 1}-${term}`)?.focus();
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
        position: number,
        term: (typeof TERMS)[number],
        className: string,
    ) => {
        const error = errorFor(studentGrade.id, term.key);

        return (
            <>
                <input
                    id={`grade-${position}-${term.key}`}
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
                    onKeyDown={(e) =>
                        onCellKeyDown(e, index, position, term.key)
                    }
                    aria-label={`${term.label} grade for ${studentGrade.student_name}`}
                    aria-invalid={!!error}
                    title={error}
                    className={className}
                />
                {error && (
                    <p className="mt-1 text-left text-xs text-danger-ink">
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
                className="inline-flex size-10 items-center justify-center rounded-full text-brand-ink/70 hover:bg-brand/10 hover:text-brand-ink"
            >
                <FileText className="h-4 w-4" aria-hidden="true" />
            </a>
            {!readOnly && (
                <button
                    type="button"
                    onClick={() => onRemove(studentGrade)}
                    aria-label={`Remove ${studentGrade.student_name}`}
                    className="inline-flex size-10 items-center justify-center rounded-full text-ink/40 hover:bg-danger/10 hover:text-danger-strong"
                >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
            )}
        </>
    );

    return (
        <form onSubmit={save}>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                {readOnly ? (
                    <span />
                ) : (
                    <p className="text-xs text-ink/60">
                        {isMobile
                            ? 'Tap a term to change it.'
                            : 'Click a term to change it. Enter moves down, Esc undoes the box.'}{' '}
                        Grades are 0–100, up to two decimals.
                    </p>
                )}
                <div className="flex items-center gap-2">
                    <label
                        htmlFor={`grade-sort-${gradeSheetId}`}
                        className="text-xs font-medium text-ink/60"
                    >
                        Sort by
                    </label>
                    <select
                        id={`grade-sort-${gradeSheetId}`}
                        value={sortOrder}
                        onChange={(e) =>
                            setSortOrder(e.target.value as SortOrder)
                        }
                        className="min-h-10 rounded-lg border border-ink/15 bg-surface px-3 text-sm text-ink focus:border-brand focus:ring-2 focus:ring-brand/30 focus:outline-none"
                    >
                        {SORT_OPTIONS.map((option) => (
                            <option
                                key={option.value}
                                value={option.value}
                                className="bg-surface text-ink"
                            >
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {isMobile ? (
                // One card per student on phones, so nothing scrolls sideways.
                <ul className="divide-y divide-ink/10 overflow-hidden rounded-2xl border border-ink/10 bg-surface">
                    {order.map((index, position) => {
                        const studentGrade = studentGrades[index];
                        const row = data.grades[index];
                        const final = finalGrade(row);

                        return (
                            <li
                                key={studentGrade.id}
                                className={`p-4 ${isRowChanged(row, index) ? 'bg-warn/[0.07]' : ''}`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="font-medium break-words text-ink">
                                            <span className="mr-1.5 text-ink/45 tabular-nums">
                                                {position + 1}.
                                            </span>
                                            {studentGrade.student_name}
                                        </p>
                                        <p className="text-xs text-ink/60">
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
                                                htmlFor={`grade-${position}-${term.key}`}
                                                className="mb-1 block text-[11px] font-medium text-ink/60"
                                            >
                                                {term.label}
                                            </label>
                                            {termInput(
                                                studentGrade,
                                                index,
                                                position,
                                                term,
                                                mobileInputClass,
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-3 flex items-center justify-between gap-3 border-t border-ink/10 pt-3">
                                    <span className="text-sm text-ink/70">
                                        Final{' '}
                                        <span className="font-semibold text-ink tabular-nums">
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
                <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-surface">
                    <table className="w-full min-w-[760px] text-left text-sm">
                        <thead className="border-b border-ink/10 bg-ink/[0.03] text-xs tracking-wide text-ink/60 uppercase">
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
                        <tbody className="divide-y divide-ink/10">
                            {order.map((index, position) => {
                                const studentGrade = studentGrades[index];
                                const row = data.grades[index];
                                const isChanged = isRowChanged(row, index);
                                const final = finalGrade(row);

                                return (
                                    <tr
                                        key={studentGrade.id}
                                        className={
                                            isChanged ? 'bg-warn/[0.07]' : ''
                                        }
                                    >
                                        <td className="px-4 py-2 text-ink/50 tabular-nums">
                                            {position + 1}
                                        </td>
                                        <td className="px-4 py-2">
                                            <span className="block font-medium text-ink">
                                                {studentGrade.student_name}
                                            </span>
                                            <span className="text-xs text-ink/60">
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
                                                    position,
                                                    term,
                                                    cellInputClass,
                                                )}
                                            </td>
                                        ))}
                                        <td className="px-4 py-2 text-right font-semibold text-ink tabular-nums">
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
                    className="sticky bottom-4 z-10 mt-4 flex flex-col gap-3 rounded-2xl border border-ink/10 bg-surface px-4 py-3 shadow-lg sm:flex-row sm:items-center sm:justify-between"
                >
                    <p aria-live="polite" className="text-sm text-ink/75">
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
                            className="min-h-11 flex-1 rounded-full border border-ink/15 px-5 text-sm font-semibold text-ink/75 hover:bg-ink/5 disabled:opacity-50 sm:flex-none"
                        >
                            Discard
                        </button>
                        <button
                            type="submit"
                            disabled={processing || !hasChanges}
                            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-brand px-6 text-sm font-semibold text-white shadow-sm hover:bg-brand-deep disabled:opacity-50 sm:flex-none"
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
