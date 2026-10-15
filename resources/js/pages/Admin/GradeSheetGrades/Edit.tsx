import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { FormEvent } from 'react';
import gradeSheetRoutes from '@/routes/admin/grade-sheets';
import {
    PASSING_GRADE,
    TERMS,
    formatGrade,
} from '../GradeSheets/Components/types';
import type {
    GradeSheetSummary,
    StudentGradeRow,
    TermKey,
} from '../GradeSheets/Components/types';

type Props = {
    gradeSheet: GradeSheetSummary;
    studentGrades: StudentGradeRow[];
};

type GradeRow = { id: number } & Record<TermKey, string>;

const inputClass =
    'min-h-10 w-24 rounded-lg border border-ink/15 bg-surface px-2 py-1.5 text-right text-base text-ink tabular-nums placeholder-ink/30 focus:border-brand focus:ring-2 focus:ring-brand/30 focus:outline-none aria-[invalid=true]:border-danger aria-[invalid=true]:bg-danger/5 sm:text-sm';

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

/**
 * Every student on the grade sheet in one table, with Term 1–3 inputs on
 * each row, saved together. Enter moves down a column, like a spreadsheet.
 */
export default function Edit({ gradeSheet, studentGrades }: Props) {
    const { props } = usePage<{ flash?: { success?: string } }>();
    const { data, setData, put, processing, errors, isDirty } = useForm<{
        grades: GradeRow[];
    }>({
        grades: studentGrades.map((row) => ({
            id: row.id,
            term_1: row.term_1 ?? '',
            term_2: row.term_2 ?? '',
            term_3: row.term_3 ?? '',
        })),
    });
    const fieldErrors = errors as Record<string, string | undefined>;
    const sheetUrl = gradeSheetRoutes.show.url(gradeSheet.id);

    const setGrade = (index: number, term: TermKey, value: string) =>
        setData(
            'grades',
            data.grades.map((row, rowIndex) =>
                rowIndex === index ? { ...row, [term]: value } : row,
            ),
        );

    const moveDown = (index: number, term: TermKey) =>
        document.getElementById(`grade-${index + 1}-${term}`)?.focus();

    const submit = (e: FormEvent) => {
        e.preventDefault();
        put(gradeSheetRoutes.grades.update.url(gradeSheet.id));
    };

    const errorCount = Object.keys(errors).length;

    return (
        <>
            <Head title={`Enter Grades · ${gradeSheet.number}`} />

            <div className="bg-cream px-4 py-8">
                <form onSubmit={submit} className="mx-auto max-w-5xl">
                    <Link
                        href={sheetUrl}
                        className="mb-4 inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-ink/70 hover:text-ink"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Grade Sheet {gradeSheet.number}
                    </Link>

                    <h1 className="font-serif text-2xl font-semibold text-ink">
                        Enter Grades
                    </h1>
                    <p className="mb-6 text-sm text-ink/70">
                        {gradeSheet.subject} · {gradeSheet.grade_level} · SY{' '}
                        {gradeSheet.school_year} · {gradeSheet.teacher}. Grades
                        are 0–100, up to two decimals; leave a term blank until
                        it's graded.
                    </p>

                    {props.flash?.success && (
                        <div
                            role="status"
                            className="mb-4 rounded-xl border border-brand/25 bg-brand/5 px-4 py-3 text-sm text-brand-ink"
                        >
                            {props.flash.success}
                        </div>
                    )}
                    {errorCount > 0 && (
                        <div
                            role="alert"
                            className="mb-4 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger-strong"
                        >
                            Some grades need fixing. They're highlighted below.
                        </div>
                    )}

                    <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-surface">
                        <table className="w-full min-w-[720px] text-left text-sm">
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
                                            className="px-3 py-3 text-right font-semibold"
                                        >
                                            {term.label}
                                        </th>
                                    ))}
                                    <th className="px-4 py-3 text-right font-semibold">
                                        Final
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-ink/10">
                                {studentGrades.map((student, index) => {
                                    const row = data.grades[index];
                                    const final = finalGrade(row);

                                    return (
                                        <tr key={student.id}>
                                            <td className="px-4 py-2 text-ink/50 tabular-nums">
                                                {index + 1}
                                            </td>
                                            <td className="px-4 py-2">
                                                <span className="block font-medium text-ink">
                                                    {student.student_name}
                                                </span>
                                                <span className="text-xs text-ink/55">
                                                    {student.lrn
                                                        ? `LRN ${student.lrn}`
                                                        : 'No LRN yet'}
                                                </span>
                                            </td>
                                            {TERMS.map((term) => {
                                                const error =
                                                    fieldErrors[
                                                        `grades.${index}.${term.key}`
                                                    ];

                                                return (
                                                    <td
                                                        key={term.key}
                                                        className="px-3 py-2 text-right align-top"
                                                    >
                                                        <input
                                                            id={`grade-${index}-${term.key}`}
                                                            type="number"
                                                            inputMode="decimal"
                                                            min={0}
                                                            max={100}
                                                            step="0.01"
                                                            placeholder="—"
                                                            value={
                                                                row[term.key]
                                                            }
                                                            onChange={(e) =>
                                                                setGrade(
                                                                    index,
                                                                    term.key,
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            onKeyDown={(e) => {
                                                                if (
                                                                    e.key ===
                                                                    'Enter'
                                                                ) {
                                                                    e.preventDefault();
                                                                    moveDown(
                                                                        index,
                                                                        term.key,
                                                                    );
                                                                }
                                                            }}
                                                            aria-label={`${term.label} grade for ${student.student_name}`}
                                                            aria-invalid={
                                                                !!error
                                                            }
                                                            title={error}
                                                            className={
                                                                inputClass
                                                            }
                                                        />
                                                        {error && (
                                                            <p className="mt-1 max-w-24 text-left text-xs text-danger-ink">
                                                                {error}
                                                            </p>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                            <td className="px-4 py-2 text-right">
                                                <span className="font-semibold text-ink tabular-nums">
                                                    {formatGrade(final)}
                                                </span>
                                                {final !== null && (
                                                    <span
                                                        className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${
                                                            final >=
                                                            PASSING_GRADE
                                                                ? 'bg-brand/10 text-brand-ink'
                                                                : 'bg-danger/10 text-danger-strong'
                                                        }`}
                                                    >
                                                        {final >= PASSING_GRADE
                                                            ? 'Passed'
                                                            : 'Failed'}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="sticky bottom-0 mt-4 flex flex-col-reverse gap-2 border-t border-ink/10 bg-cream/95 py-4 backdrop-blur sm:flex-row sm:justify-end">
                        <Link
                            href={sheetUrl}
                            className="inline-flex min-h-11 items-center justify-center rounded-full border border-ink/15 px-5 text-sm font-semibold text-ink/80 hover:bg-ink/5"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={processing || !isDirty}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-deep disabled:opacity-50"
                        >
                            {processing && (
                                <Loader2
                                    className="h-4 w-4 animate-spin"
                                    aria-hidden="true"
                                />
                            )}
                            Save all grades
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
