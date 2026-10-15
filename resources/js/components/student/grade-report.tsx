import { BookOpenCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

/** One subject's grades; mirrors Enrollment::gradeReport(). */
export type SubjectGrade = {
    id: number;
    subject: string;
    teacher: string;
    term_1: string | null;
    term_2: string | null;
    term_3: string | null;
    final_grade: number | null;
    remarks: 'Passed' | 'Failed' | null;
};

/** Mirrors Enrollment::termGeneralAverages(). */
export type TermAverages = Record<(typeof TERMS)[number]['key'], number | null>;

const TERMS = [
    { key: 'term_1', label: 'Term 1' },
    { key: 'term_2', label: 'Term 2' },
    { key: 'term_3', label: 'Term 3' },
] as const;

/** Two decimals, or a dash for a term that isn't graded yet. */
function formatGrade(grade: string | number | null): string {
    return grade === null || grade === '' ? '—' : Number(grade).toFixed(2);
}

function RemarksBadge({ remarks }: { remarks: SubjectGrade['remarks'] }) {
    if (remarks === null) {
        return <span className="text-xs text-ink/50">In progress</span>;
    }

    return (
        <span
            className={cn(
                'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
                remarks === 'Passed'
                    ? 'bg-brand/10 text-brand-ink'
                    : 'bg-danger/10 text-danger-strong',
            )}
        >
            {remarks}
        </span>
    );
}

/**
 * The student's grades for the school year, one row per subject, as their
 * teachers entered them on grade sheets.
 */
export default function GradeReport({
    grades,
    termAverages,
    generalAverage,
}: {
    grades: SubjectGrade[];
    /** Each term's general average, once every subject has that term's grade. */
    termAverages: TermAverages;
    /** Shown once every subject has a final grade. */
    generalAverage: number | null;
}) {
    if (grades.length === 0) {
        return (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-ink/20 bg-surface px-6 py-10 text-center">
                <BookOpenCheck
                    className="h-8 w-8 text-ink/30"
                    aria-hidden="true"
                />
                <p className="font-medium text-ink">
                    No grades posted yet
                </p>
                <p className="max-w-sm text-sm text-ink/65">
                    Your grades will show here once your teachers post them.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Cards (phones) */}
            <ul className="space-y-3 md:hidden">
                {grades.map((grade) => (
                    <li
                        key={grade.id}
                        className="rounded-xl border border-ink/10 bg-surface p-4 shadow-sm"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="font-semibold text-ink">
                                    {grade.subject}
                                </p>
                                <p className="text-xs text-ink/60">
                                    {grade.teacher}
                                </p>
                            </div>
                            <RemarksBadge remarks={grade.remarks} />
                        </div>
                        <dl className="mt-3 grid grid-cols-4 gap-2 text-center">
                            {TERMS.map((term) => (
                                <div key={term.key}>
                                    <dt className="text-[11px] text-ink/55">
                                        {term.label}
                                    </dt>
                                    <dd className="text-sm text-ink tabular-nums">
                                        {formatGrade(grade[term.key])}
                                    </dd>
                                </div>
                            ))}
                            <div>
                                <dt className="text-[11px] text-ink/55">
                                    Final
                                </dt>
                                <dd className="text-sm font-semibold text-ink tabular-nums">
                                    {formatGrade(grade.final_grade)}
                                </dd>
                            </div>
                        </dl>
                    </li>
                ))}
            </ul>

            {/* Table (tablets and up) */}
            <div className="hidden overflow-x-auto rounded-xl border border-ink/10 bg-surface shadow-sm md:block">
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-ink/10 bg-ink/[0.03] text-xs tracking-wide text-ink/60 uppercase">
                        <tr>
                            <th className="px-4 py-3 font-semibold">Subject</th>
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
                            <th className="px-4 py-3 font-semibold">Remarks</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-ink/10">
                        {grades.map((grade) => (
                            <tr key={grade.id}>
                                <td className="px-4 py-3">
                                    <span className="block font-medium text-ink">
                                        {grade.subject}
                                    </span>
                                    <span className="text-xs text-ink/60">
                                        {grade.teacher}
                                    </span>
                                </td>
                                {TERMS.map((term) => (
                                    <td
                                        key={term.key}
                                        className="px-4 py-3 text-right text-ink/80 tabular-nums"
                                    >
                                        {formatGrade(grade[term.key])}
                                    </td>
                                ))}
                                <td className="px-4 py-3 text-right font-semibold text-ink tabular-nums">
                                    {formatGrade(grade.final_grade)}
                                </td>
                                <td className="px-4 py-3">
                                    <RemarksBadge remarks={grade.remarks} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <section
                aria-labelledby="general-average-heading"
                className="rounded-xl border border-ink/10 bg-surface px-4 py-3 shadow-sm"
            >
                <h3
                    id="general-average-heading"
                    className="text-sm font-medium text-ink/75"
                >
                    General average
                </h3>
                <dl className="mt-2 grid grid-cols-4 gap-2 text-center">
                    {TERMS.map((term) => (
                        <div key={term.key}>
                            <dt className="text-[11px] text-ink/55">
                                {term.label}
                            </dt>
                            <dd className="text-base font-semibold text-ink tabular-nums">
                                {formatGrade(termAverages[term.key])}
                            </dd>
                        </div>
                    ))}
                    <div>
                        <dt className="text-[11px] text-ink/55">Final</dt>
                        <dd className="font-serif text-xl font-semibold text-brand-ink tabular-nums">
                            {formatGrade(generalAverage)}
                        </dd>
                    </div>
                </dl>
                <p className="mt-2 text-xs text-ink/55">
                    Each average shows once every subject has that grade.
                </p>
            </section>
        </div>
    );
}
