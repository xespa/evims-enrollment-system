import { Head, router } from '@inertiajs/react';
import {
    Award,
    ChevronDown,
    CircleAlert,
    Hourglass,
    Info,
    Medal,
    Printer,
    Trophy,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import Metric from '@/components/portal/metric';
import { cn } from '@/lib/utils';
import awardRoutes from '@/routes/admin/awards';

type AwardType = 'ACADEMIC_EXCELLENCE' | 'LEARNING_AREA_EXCELLENCE';
type Standing = 'ACADEMIC_EXCELLENCE' | 'NOT_QUALIFIED' | 'INCOMPLETE';

type StudentStanding = {
    enrollment_id: number;
    name: string;
    lrn: string | null;
    general_average: number | null;
    lowest_final_grade: number | null;
    /** Each learning area's whole-number final grade; null until graded. */
    final_grades: Record<string, number | null>;
    standing: Standing;
    /** Why they missed Academic Excellence, when they did. */
    reasons: string[];
    awards: { type: AwardType; label: string; learning_area: string | null }[];
};

type Filters = {
    school_year: string;
    grade_level_id: string;
    recognition: string;
};

type Props = {
    gradeLevels: { id: number; name: string; students: StudentStanding[] }[];
    summary: {
        students: number;
        academic_excellence: number;
        learning_area_excellence: number;
        not_qualified: number;
        incomplete: number;
    };
    criteria: { type: AwardType; label: string; criteria: string }[];
    schoolYears: string[];
    gradeLevelOptions: { id: number; name: string }[];
    recognitionOptions: { value: string; label: string }[];
    filters: Filters;
};

const SELECT_CLASS =
    'min-h-11 w-full rounded-lg border border-[#1F2A24]/15 bg-white px-3 py-2 text-sm text-[#1F2A24] focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none sm:w-auto';

const AWARD_STYLES: Record<AwardType, string> = {
    ACADEMIC_EXCELLENCE:
        'bg-[#E8A33D]/20 text-[#7a4d0b] ring-1 ring-[#E8A33D]/40',
    LEARNING_AREA_EXCELLENCE: 'bg-[#2F6F4E]/10 text-[#2F6F4E]',
};

function AwardBadge({ award }: { award: StudentStanding['awards'][number] }) {
    const Icon = award.type === 'ACADEMIC_EXCELLENCE' ? Trophy : Medal;

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
                AWARD_STYLES[award.type],
            )}
        >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {award.label}
        </span>
    );
}

/** What's shown in the Recognition column: awards, or why there are none. */
function Recognition({ student }: { student: StudentStanding }) {
    if (student.awards.length > 0) {
        return (
            <div className="flex flex-wrap gap-1.5">
                {student.awards.map((award) => (
                    <AwardBadge key={award.label} award={award} />
                ))}
            </div>
        );
    }

    return (
        <p
            className={cn(
                'flex items-start gap-1.5 text-xs',
                student.standing === 'INCOMPLETE'
                    ? 'text-[#1F2A24]/60'
                    : 'text-[#A3372D]',
            )}
        >
            {student.standing === 'INCOMPLETE' ? (
                <Hourglass
                    className="mt-0.5 h-3.5 w-3.5 shrink-0"
                    aria-hidden="true"
                />
            ) : (
                <CircleAlert
                    className="mt-0.5 h-3.5 w-3.5 shrink-0"
                    aria-hidden="true"
                />
            )}
            {student.reasons.join(' ')}
        </p>
    );
}

/** Each learning area's final grade, below 80 and missing ones called out. */
function FinalGrades({ student }: { student: StudentStanding }) {
    return (
        <ul className="flex flex-wrap gap-1.5">
            {Object.entries(student.final_grades).map(
                ([learningArea, grade]) => (
                    <li
                        key={learningArea}
                        className={cn(
                            'rounded-md border px-2 py-1 text-xs',
                            grade === null
                                ? 'border-dashed border-[#1F2A24]/20 text-[#1F2A24]/50'
                                : grade < 80
                                  ? 'border-[#C6473B]/30 bg-[#C6473B]/5 text-[#A3372D]'
                                  : 'border-[#1F2A24]/10 bg-white text-[#1F2A24]/80',
                        )}
                    >
                        {learningArea}{' '}
                        <span className="font-semibold tabular-nums">
                            {grade ?? '—'}
                        </span>
                    </li>
                ),
            )}
        </ul>
    );
}

function StudentRow({
    student,
    index,
}: {
    student: StudentStanding;
    index: number;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const detailsId = `final-grades-${student.enrollment_id}`;

    return (
        <>
            <tr className="align-top">
                <td className="px-4 py-3 text-[#1F2A24]/50 tabular-nums">
                    {index + 1}
                </td>
                <td className="px-4 py-3">
                    <span className="block font-medium text-[#1F2A24]">
                        {student.name}
                    </span>
                    <span className="text-xs text-[#1F2A24]/60">
                        {student.lrn ? `LRN ${student.lrn}` : 'No LRN yet'}
                    </span>
                </td>
                <td className="px-4 py-3 text-center">
                    <span
                        className={cn(
                            'font-serif text-lg font-semibold tabular-nums',
                            student.general_average !== null &&
                                student.general_average >= 90
                                ? 'text-[#2F6F4E]'
                                : 'text-[#1F2A24]',
                        )}
                    >
                        {student.general_average ?? '—'}
                    </span>
                </td>
                <td className="px-4 py-3 text-center tabular-nums">
                    <span
                        className={
                            student.lowest_final_grade !== null &&
                            student.lowest_final_grade < 80
                                ? 'font-semibold text-[#A3372D]'
                                : 'text-[#1F2A24]/80'
                        }
                    >
                        {student.lowest_final_grade ?? '—'}
                    </span>
                </td>
                <td className="px-4 py-3">
                    <Recognition student={student} />
                </td>
                <td className="px-2 py-3 text-right">
                    <button
                        type="button"
                        onClick={() => setIsOpen((open) => !open)}
                        aria-expanded={isOpen}
                        aria-controls={detailsId}
                        className="inline-flex min-h-10 items-center gap-1 rounded-full px-3 text-xs font-semibold text-[#2F6F4E] hover:bg-[#2F6F4E]/5"
                    >
                        Grades
                        <ChevronDown
                            className={cn(
                                'h-4 w-4 transition-transform',
                                isOpen && 'rotate-180',
                            )}
                            aria-hidden="true"
                        />
                    </button>
                </td>
            </tr>
            {isOpen && (
                <tr id={detailsId} className="bg-[#FBF8F2]">
                    <td />
                    <td colSpan={5} className="px-4 pt-1 pb-4">
                        <FinalGrades student={student} />
                    </td>
                </tr>
            )}
        </>
    );
}

export default function Index({
    gradeLevels,
    summary,
    criteria,
    schoolYears,
    gradeLevelOptions,
    recognitionOptions,
    filters,
}: Props) {
    const changeFilter = (key: keyof Filters, value: string) => {
        router.get(
            awardRoutes.index.url(),
            { ...filters, [key]: value },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const countFor: Record<string, number> = {
        ACADEMIC_EXCELLENCE: summary.academic_excellence,
        LEARNING_AREA_EXCELLENCE: summary.learning_area_excellence,
        NOT_QUALIFIED: summary.not_qualified,
        INCOMPLETE: summary.incomplete,
        EVERYONE: summary.students,
    };

    const printUrl = awardRoutes.print.show.url({
        query: {
            school_year: filters.school_year,
            grade_level_id: filters.grade_level_id || undefined,
            recognition: filters.recognition,
        },
    });

    const shownCount = gradeLevels.reduce(
        (total, gradeLevel) => total + gradeLevel.students.length,
        0,
    );

    return (
        <>
            <Head title="Academic Awards" />

            <div className="bg-[#FBF8F2] px-4 py-8">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <h1 className="font-serif text-2xl font-semibold text-[#1F2A24]">
                                Academic Awards
                            </h1>
                            <p className="text-sm text-[#1F2A24]/70">
                                Who receives a recognition in SY{' '}
                                {filters.school_year}, worked out from the grade
                                sheets under DepEd Order No. 015, s. 2026.
                            </p>
                        </div>
                        <a
                            href={printUrl}
                            target="_blank"
                            rel="noopener"
                            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#2F6F4E] px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#25573E]"
                        >
                            <Printer className="h-4 w-4" aria-hidden="true" />
                            Print awardees
                        </a>
                    </div>

                    <section
                        aria-label="Award criteria"
                        className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2"
                    >
                        {criteria.map((award) => {
                            const Icon =
                                award.type === 'ACADEMIC_EXCELLENCE'
                                    ? Trophy
                                    : Medal;

                            return (
                                <div
                                    key={award.type}
                                    className="flex gap-3 rounded-2xl border border-[#1F2A24]/10 bg-white p-4"
                                >
                                    <span
                                        aria-hidden="true"
                                        className={cn(
                                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                                            AWARD_STYLES[award.type],
                                        )}
                                    >
                                        <Icon className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <p className="font-semibold text-[#1F2A24]">
                                            {award.label}
                                        </p>
                                        <p className="text-sm text-[#1F2A24]/70">
                                            {award.criteria}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </section>

                    <div
                        role="note"
                        className="mb-6 flex items-start gap-2 rounded-xl border border-[#E8A33D]/40 bg-[#E8A33D]/10 px-4 py-3 text-sm text-[#7a4d0b]"
                    >
                        <Info
                            className="mt-0.5 h-4 w-4 shrink-0"
                            aria-hidden="true"
                        />
                        <p>
                            Grade 4 and up only; Kindergarten to Grade 3 receive
                            no academic awards. Final grades are the term
                            average rounded to a whole number, and awardees are
                            listed alphabetically, not ranked.{' '}
                            <strong>
                                Confirm with advisers that each awardee has no
                                derogatory records or disciplinary cases this
                                school year
                            </strong>
                            ; that isn't recorded here.
                        </p>
                    </div>

                    <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-[#1F2A24]/10 bg-white p-4 sm:flex-row sm:flex-wrap sm:items-center">
                        <select
                            aria-label="School year"
                            value={filters.school_year}
                            onChange={(e) =>
                                changeFilter('school_year', e.target.value)
                            }
                            className={SELECT_CLASS}
                        >
                            {schoolYears.map((schoolYear) => (
                                <option key={schoolYear} value={schoolYear}>
                                    SY {schoolYear}
                                </option>
                            ))}
                        </select>
                        <select
                            aria-label="Grade level"
                            value={filters.grade_level_id}
                            onChange={(e) =>
                                changeFilter('grade_level_id', e.target.value)
                            }
                            className={SELECT_CLASS}
                        >
                            <option value="">Grade 4 and up</option>
                            {gradeLevelOptions.map((gradeLevel) => (
                                <option
                                    key={gradeLevel.id}
                                    value={gradeLevel.id}
                                >
                                    {gradeLevel.name}
                                </option>
                            ))}
                        </select>
                        <select
                            aria-label="Recognition"
                            value={filters.recognition}
                            onChange={(e) =>
                                changeFilter('recognition', e.target.value)
                            }
                            className={cn(
                                SELECT_CLASS,
                                'border-[#2F6F4E]/40 bg-[#2F6F4E]/5 font-medium',
                            )}
                        >
                            {recognitionOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                    {option.value in countFor
                                        ? ` (${countFor[option.value]})`
                                        : ''}
                                </option>
                            ))}
                        </select>
                        <p
                            aria-live="polite"
                            className="text-sm text-[#1F2A24]/65 sm:ml-auto"
                        >
                            {shownCount === 1
                                ? '1 student shown'
                                : `${shownCount} students shown`}
                        </p>
                    </div>

                    <section
                        aria-label="Summary"
                        className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4"
                    >
                        <Metric
                            icon={Trophy}
                            label="Academic Excellence"
                            value={summary.academic_excellence}
                        />
                        <Metric
                            icon={Medal}
                            label="Excellence in a learning area"
                            value={summary.learning_area_excellence}
                        />
                        <Metric
                            icon={CircleAlert}
                            label="Missed Academic Excellence"
                            value={summary.not_qualified}
                        />
                        <Metric
                            icon={Hourglass}
                            label="Grades still incomplete"
                            value={summary.incomplete}
                            emphasis={summary.incomplete > 0}
                        />
                    </section>

                    {gradeLevels.length === 0 ? (
                        <div className="flex flex-col items-center rounded-2xl border border-dashed border-[#1F2A24]/15 bg-white px-6 py-14 text-center">
                            {summary.students === 0 ? (
                                <Users
                                    className="h-10 w-10 text-[#2F6F4E]/60"
                                    aria-hidden="true"
                                />
                            ) : (
                                <Award
                                    className="h-10 w-10 text-[#2F6F4E]/60"
                                    aria-hidden="true"
                                />
                            )}
                            <p className="mt-3 font-medium text-[#1F2A24]">
                                {summary.students === 0
                                    ? 'No approved Grade 4+ students this school year'
                                    : 'No students match this filter'}
                            </p>
                            <p className="mt-1 max-w-md text-sm text-[#1F2A24]/65">
                                {summary.students === 0
                                    ? 'Awards are worked out once students are enrolled and graded.'
                                    : summary.incomplete > 0
                                      ? 'Some grades are still incomplete. Recognitions appear as teachers finish their grade sheets.'
                                      : 'Try another recognition or grade level.'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {gradeLevels.map((gradeLevel) => (
                                <section
                                    key={gradeLevel.id}
                                    aria-labelledby={`level-${gradeLevel.id}`}
                                >
                                    <h2
                                        id={`level-${gradeLevel.id}`}
                                        className="mb-2 flex items-baseline gap-2 font-serif text-lg font-semibold text-[#1F2A24]"
                                    >
                                        {gradeLevel.name}
                                        <span className="font-sans text-sm font-normal text-[#1F2A24]/55">
                                            {gradeLevel.students.length === 1
                                                ? '1 student'
                                                : `${gradeLevel.students.length} students`}
                                        </span>
                                    </h2>
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
                                                    <th className="px-4 py-3 text-center font-semibold">
                                                        General average
                                                    </th>
                                                    <th className="px-4 py-3 text-center font-semibold">
                                                        Lowest grade
                                                    </th>
                                                    <th className="px-4 py-3 font-semibold">
                                                        Recognition
                                                    </th>
                                                    <th className="px-2 py-3">
                                                        <span className="sr-only">
                                                            Final grades
                                                        </span>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#1F2A24]/10">
                                                {gradeLevel.students.map(
                                                    (student, index) => (
                                                        <StudentRow
                                                            key={
                                                                student.enrollment_id
                                                            }
                                                            student={student}
                                                            index={index}
                                                        />
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
