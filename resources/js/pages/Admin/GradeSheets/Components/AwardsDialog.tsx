import { router } from '@inertiajs/react';
import {
    ChevronDown,
    CircleAlert,
    Hourglass,
    Info,
    Loader2,
    Medal,
    Printer,
    Trophy,
    Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import awardRoutes from '@/routes/admin/awards';

type AwardType = 'ACADEMIC_EXCELLENCE' | 'LEARNING_AREA_EXCELLENCE';
type Standing = 'ACADEMIC_EXCELLENCE' | 'NOT_QUALIFIED' | 'INCOMPLETE';

/** Mirrors DetermineAcademicAwards' StudentStanding. */
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

/** Mirrors DetermineAcademicAwards::forGradeLevel(). */
export type GradeLevelAwards = {
    school_year: string;
    grade_level_id: number;
    grade_level: string;
    students: StudentStanding[];
    summary: {
        students: number;
        academic_excellence: number;
        learning_area_excellence: number;
        not_qualified: number;
        incomplete: number;
    };
};

export type AwardCriterion = {
    type: AwardType;
    label: string;
    criteria: string;
};

export type RecognitionOption = { value: string; label: string };

const AWARD_STYLES: Record<AwardType, string> = {
    ACADEMIC_EXCELLENCE:
        'bg-warn/20 text-warn-deep ring-1 ring-warn/40',
    LEARNING_AREA_EXCELLENCE: 'bg-brand/10 text-brand-ink',
};

/** Mirrors IndexAwardRequest::matches(). */
function matches(student: StudentStanding, recognition: string): boolean {
    const awardTypes: string[] = student.awards.map((award) => award.type);

    switch (recognition) {
        case 'EVERYONE':
            return true;
        case 'RECOGNIZED':
            return awardTypes.length > 0;
        case 'NOT_QUALIFIED':
        case 'INCOMPLETE':
            return student.standing === recognition;
        default:
            return awardTypes.includes(recognition);
    }
}

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

/** The student's awards, or why they have none. */
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

    const isIncomplete = student.standing === 'INCOMPLETE';
    const Icon = isIncomplete ? Hourglass : CircleAlert;

    return (
        <p
            className={cn(
                'flex items-start gap-1.5 text-xs',
                isIncomplete ? 'text-ink/60' : 'text-danger-strong',
            )}
        >
            <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
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
                                ? 'border-dashed border-ink/20 text-ink/50'
                                : grade < 80
                                  ? 'border-danger/30 bg-danger/5 text-danger-strong'
                                  : 'border-ink/10 bg-surface text-ink/80',
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

function StudentRow({ student }: { student: StudentStanding }) {
    const [isOpen, setIsOpen] = useState(false);
    const detailsId = `final-grades-${student.enrollment_id}`;

    return (
        <li className="px-4 py-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <p className="font-medium text-ink">{student.name}</p>
                    <p className="text-xs text-ink/60">
                        General average{' '}
                        <span
                            className={cn(
                                'font-semibold tabular-nums',
                                student.general_average !== null &&
                                    student.general_average >= 90
                                    ? 'text-brand-ink'
                                    : 'text-ink',
                            )}
                        >
                            {student.general_average ?? '—'}
                        </span>{' '}
                        · Lowest grade{' '}
                        <span
                            className={cn(
                                'font-semibold tabular-nums',
                                student.lowest_final_grade !== null &&
                                    student.lowest_final_grade < 80
                                    ? 'text-danger-strong'
                                    : 'text-ink',
                            )}
                        >
                            {student.lowest_final_grade ?? '—'}
                        </span>
                    </p>
                    <div className="mt-1.5">
                        <Recognition student={student} />
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => setIsOpen((open) => !open)}
                    aria-expanded={isOpen}
                    aria-controls={detailsId}
                    className="inline-flex min-h-10 shrink-0 items-center gap-1 self-start rounded-full px-3 text-xs font-semibold text-brand-ink hover:bg-brand/5"
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
            </div>
            {isOpen && (
                <div id={detailsId} className="mt-2">
                    <FinalGrades student={student} />
                </div>
            )}
        </li>
    );
}

/**
 * The grade level's academic awards (DepEd Order No. 015, s. 2026) for the
 * sheet's school year, worked out from every subject's grade sheet. They
 * load when the dialog first opens.
 */
export default function AwardsDialog({
    awards,
    criteria,
    recognitionOptions,
    open,
    onOpenChange,
}: {
    /** Undefined until loaded. */
    awards: GradeLevelAwards | null | undefined;
    criteria: AwardCriterion[];
    recognitionOptions: RecognitionOption[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [recognition, setRecognition] = useState('RECOGNIZED');
    const [isLoading, setIsLoading] = useState(false);

    // Worked out on the server only when asked for, the first time it opens.
    useEffect(() => {
        if (!open || awards !== undefined) {
            return;
        }

        router.reload({
            only: ['awards'],
            onStart: () => setIsLoading(true),
            onFinish: () => setIsLoading(false),
        });
    }, [open, awards]);

    const countFor: Record<string, number | undefined> = awards
        ? {
              ACADEMIC_EXCELLENCE: awards.summary.academic_excellence,
              LEARNING_AREA_EXCELLENCE: awards.summary.learning_area_excellence,
              NOT_QUALIFIED: awards.summary.not_qualified,
              INCOMPLETE: awards.summary.incomplete,
              EVERYONE: awards.summary.students,
          }
        : {};
    const shown = (awards?.students ?? []).filter((student) =>
        matches(student, recognition),
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[calc(100vh-2rem)] flex-col gap-0 rounded-2xl border-ink/10 bg-surface p-0 text-ink sm:max-w-3xl">
                <DialogHeader className="border-b border-ink/10 p-5 pr-12 text-left">
                    <DialogTitle className="font-serif text-xl">
                        Academic awards
                        {awards &&
                            ` · ${awards.grade_level} · S.Y. ${awards.school_year}`}
                    </DialogTitle>
                    <DialogDescription className="text-ink/65">
                        Worked out from every subject's grade sheet under DepEd
                        Order No. 015, s. 2026. Awardees are listed
                        alphabetically, not ranked.
                    </DialogDescription>
                </DialogHeader>

                <div className="min-h-0 flex-1 overflow-y-auto p-4">
                    <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                        {criteria.map((award) => {
                            const Icon =
                                award.type === 'ACADEMIC_EXCELLENCE'
                                    ? Trophy
                                    : Medal;

                            return (
                                <div
                                    key={award.type}
                                    className="flex gap-2.5 rounded-xl border border-ink/10 p-3"
                                >
                                    <span
                                        aria-hidden="true"
                                        className={cn(
                                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                                            AWARD_STYLES[award.type],
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />
                                    </span>
                                    <div>
                                        <p className="text-sm font-semibold text-ink">
                                            {award.label}
                                        </p>
                                        <p className="text-xs text-ink/70">
                                            {award.criteria}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <p
                        role="note"
                        className="mb-4 flex items-start gap-2 rounded-xl border border-warn/40 bg-warn/10 px-3 py-2 text-xs text-warn-deep"
                    >
                        <Info
                            className="mt-0.5 h-3.5 w-3.5 shrink-0"
                            aria-hidden="true"
                        />
                        <span>
                            Final grades are the term average rounded to a whole
                            number.{' '}
                            <strong>
                                Confirm with advisers that each awardee has no
                                derogatory records or disciplinary cases
                            </strong>
                            ; that isn't recorded here.
                        </span>
                    </p>

                    {awards === undefined || isLoading ? (
                        <div
                            role="status"
                            className="flex items-center justify-center gap-2 py-12 text-sm text-ink/65"
                        >
                            <Loader2
                                className="h-5 w-5 animate-spin"
                                aria-hidden="true"
                            />
                            Working out the awards…
                        </div>
                    ) : awards === null ? null : (
                        <>
                            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <label
                                    className="sr-only"
                                    htmlFor="recognition"
                                >
                                    Recognition
                                </label>
                                <select
                                    id="recognition"
                                    value={recognition}
                                    onChange={(e) =>
                                        setRecognition(e.target.value)
                                    }
                                    className="min-h-11 rounded-lg border border-brand/40 bg-brand/5 px-3 py-2 text-sm font-medium text-ink focus:border-brand focus:ring-2 focus:ring-brand/30 focus:outline-none"
                                >
                                    {recognitionOptions.map((option) => (
                                        <option
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                            {countFor[option.value] !==
                                            undefined
                                                ? ` (${countFor[option.value]})`
                                                : ''}
                                        </option>
                                    ))}
                                </select>
                                <a
                                    href={awardRoutes.print.show.url({
                                        query: {
                                            school_year: awards.school_year,
                                            grade_level_id:
                                                awards.grade_level_id,
                                            recognition,
                                        },
                                    })}
                                    target="_blank"
                                    rel="noopener"
                                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white shadow-sm hover:bg-brand-deep"
                                >
                                    <Printer
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                    />
                                    Print awardees
                                </a>
                            </div>

                            {shown.length === 0 ? (
                                <div className="flex flex-col items-center rounded-xl border border-dashed border-ink/15 px-6 py-10 text-center">
                                    <Users
                                        className="h-8 w-8 text-brand-ink/60"
                                        aria-hidden="true"
                                    />
                                    <p className="mt-2 font-medium text-ink">
                                        {awards.summary.students === 0
                                            ? `No approved ${awards.grade_level} students this school year`
                                            : 'No students match this filter'}
                                    </p>
                                    <p className="mt-1 max-w-md text-sm text-ink/65">
                                        {awards.summary.incomplete > 0
                                            ? 'Some grades are still incomplete. Recognitions appear as teachers finish their grade sheets.'
                                            : 'Try another recognition.'}
                                    </p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-ink/10 rounded-xl border border-ink/10">
                                    {shown.map((student) => (
                                        <StudentRow
                                            key={student.enrollment_id}
                                            student={student}
                                        />
                                    ))}
                                </ul>
                            )}
                        </>
                    )}
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-ink/10 p-4">
                    <p aria-live="polite" className="text-sm text-ink/65">
                        {awards
                            ? shown.length === 1
                                ? '1 student shown'
                                : `${shown.length} students shown`
                            : ''}
                    </p>
                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="inline-flex min-h-11 items-center justify-center rounded-full border border-ink/15 px-5 text-sm font-semibold text-ink/80 hover:bg-ink/5"
                    >
                        Close
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
