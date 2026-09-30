import { Head, usePage } from '@inertiajs/react';
import { BookOpen, Pencil } from 'lucide-react';
import { useState } from 'react';
import {
    BILLABLE_MONTHS,
    formatCurrency,
} from '@/pages/Enrollment/Components/fees';
import EditFeesDialog from './Components/EditFeesDialog';
import ManageSubjectsDialog from './Components/ManageSubjectsDialog';
import { MONTHLY_FEES, ONE_TIME_FEES } from './Components/types';
import type { GradeLevel } from './Components/types';

type Props = {
    gradeLevels: GradeLevel[];
    manageGradeLevelId: number | null;
};

const STAGES = [
    { key: 'pre', title: 'Pre-Elementary', note: 'Nursery to Pre-K' },
    { key: 'elem', title: 'Elementary', note: 'Grades 1 to 6' },
    { key: 'jhs', title: 'Junior High School', note: 'Grades 7 to 10' },
] as const;

type StageKey = (typeof STAGES)[number]['key'];

function stageOf(gradeLevel: GradeLevel): StageKey {
    const grade = Number(gradeLevel.name.match(/^Grade\s+(\d+)/i)?.[1]);

    if (!grade) {
        return 'pre';
    }

    return grade <= 6 ? 'elem' : 'jhs';
}

function feeTotal(gradeLevel: GradeLevel, names: { name: string }[]) {
    return names.reduce(
        (total, { name }) =>
            total + Number(gradeLevel[name as keyof GradeLevel] ?? 0),
        0,
    );
}

function GradeLevelCard({
    gradeLevel,
    onEditFees,
    onManageSubjects,
}: {
    gradeLevel: GradeLevel;
    onEditFees: () => void;
    onManageSubjects: () => void;
}) {
    const oneTime = feeTotal(gradeLevel, ONE_TIME_FEES);
    const monthly = feeTotal(gradeLevel, MONTHLY_FEES);
    const subjectCount = gradeLevel.subjects.length;

    return (
        <article className="flex flex-col rounded-2xl border border-[#1F2A24]/10 bg-white p-5 transition-shadow hover:shadow-md hover:shadow-[#1F2A24]/5">
            <div className="flex items-start justify-between gap-3">
                <h3 className="font-serif text-lg font-semibold text-[#1F2A24]">
                    {gradeLevel.name}
                </h3>
                <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                        subjectCount > 0
                            ? 'bg-[#2F6F4E]/10 text-[#2F6F4E]'
                            : 'bg-[#E8A33D]/15 text-[#a4670f]'
                    }`}
                >
                    <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                    {subjectCount === 0
                        ? 'No subjects'
                        : `${subjectCount} ${subjectCount === 1 ? 'subject' : 'subjects'}`}
                </span>
            </div>

            <p className="mt-3 text-2xl font-semibold text-[#1F2A24] tabular-nums">
                {formatCurrency(gradeLevel.tuition_fee)}
            </p>
            <p className="text-xs text-[#1F2A24]/55">per school year</p>

            <dl className="mt-4 space-y-1.5 border-t border-[#1F2A24]/10 pt-3 text-sm">
                <div className="flex justify-between gap-3">
                    <dt className="text-[#1F2A24]/65">One-time fees</dt>
                    <dd className="text-[#1F2A24] tabular-nums">
                        {formatCurrency(oneTime)}
                    </dd>
                </div>
                <div className="flex justify-between gap-3">
                    <dt className="text-[#1F2A24]/65">Monthly</dt>
                    <dd className="text-[#1F2A24] tabular-nums">
                        {formatCurrency(monthly)}{' '}
                        <span className="text-[#1F2A24]/55">
                            × {BILLABLE_MONTHS}
                        </span>
                    </dd>
                </div>
            </dl>

            <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
                <button
                    type="button"
                    onClick={onEditFees}
                    className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-[#2F6F4E]/30 px-3 text-sm font-medium text-[#2F6F4E] transition-colors hover:bg-[#2F6F4E]/5"
                >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                    Edit fees
                </button>
                <button
                    type="button"
                    onClick={onManageSubjects}
                    className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-[#2F6F4E] px-3 text-sm font-semibold text-white transition-colors hover:bg-[#25573E]"
                >
                    <BookOpen className="h-4 w-4" aria-hidden="true" />
                    Subjects
                </button>
            </div>
        </article>
    );
}

export default function Index({ gradeLevels, manageGradeLevelId }: Props) {
    const { props } = usePage();

    // Which grade level each modal is for, kept separately from whether
    // it's open so the content doesn't vanish during the close animation.
    const [feesId, setFeesId] = useState<number | null>(null);
    const [isFeesOpen, setIsFeesOpen] = useState(false);
    // Bumped on every open so the fee form starts fresh from the saved
    // fees, never from edits that were cancelled last time.
    const [feesSession, setFeesSession] = useState(0);
    const [subjectsId, setSubjectsId] = useState<number | null>(
        manageGradeLevelId,
    );
    const [isSubjectsOpen, setIsSubjectsOpen] = useState(
        manageGradeLevelId !== null,
    );

    // Looked up from the latest props, so the modals reflect each save.
    const feesGradeLevel = gradeLevels.find((g) => g.id === feesId);
    const subjectsGradeLevel = gradeLevels.find((g) => g.id === subjectsId);

    const openFees = (gradeLevel: GradeLevel) => {
        setFeesId(gradeLevel.id);
        setFeesSession((n) => n + 1);
        setIsFeesOpen(true);
    };

    const openSubjects = (gradeLevel: GradeLevel) => {
        setSubjectsId(gradeLevel.id);
        setIsSubjectsOpen(true);
    };

    const flashSuccess = props.flash?.success;
    const anyModalOpen = isFeesOpen || isSubjectsOpen;

    return (
        <>
            <Head title="Grade Levels" />

            <div className="bg-[#FBF8F2] px-4 py-8">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-6 max-w-2xl">
                        <h1 className="font-serif text-2xl font-semibold text-[#1F2A24]">
                            Grade Levels
                        </h1>
                        <p className="mt-1 text-sm text-[#1F2A24]/70">
                            Set each grade level's fees and the subjects
                            offered. The total (one-time fees plus{' '}
                            {BILLABLE_MONTHS} months of monthly fees) is what
                            parents see during enrollment and what they pay.
                        </p>
                    </div>

                    {flashSuccess && !anyModalOpen && (
                        <div
                            role="status"
                            className="mb-6 rounded-xl border border-[#2F6F4E]/25 bg-[#2F6F4E]/5 px-4 py-3 text-sm text-[#2F6F4E]"
                        >
                            {flashSuccess}
                        </div>
                    )}

                    <div className="space-y-8">
                        {STAGES.map((stage) => {
                            const levels = gradeLevels.filter(
                                (g) => stageOf(g) === stage.key,
                            );

                            if (levels.length === 0) {
                                return null;
                            }

                            return (
                                <section key={stage.key}>
                                    <div className="mb-3 flex items-baseline gap-2">
                                        <h2 className="text-sm font-semibold tracking-wide text-[#1F2A24]/80 uppercase">
                                            {stage.title}
                                        </h2>
                                        <span className="text-xs text-[#1F2A24]/50">
                                            {stage.note}
                                        </span>
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        {levels.map((gradeLevel) => (
                                            <GradeLevelCard
                                                key={gradeLevel.id}
                                                gradeLevel={gradeLevel}
                                                onEditFees={() =>
                                                    openFees(gradeLevel)
                                                }
                                                onManageSubjects={() =>
                                                    openSubjects(gradeLevel)
                                                }
                                            />
                                        ))}
                                    </div>
                                </section>
                            );
                        })}
                    </div>
                </div>
            </div>

            {feesGradeLevel && (
                <EditFeesDialog
                    key={feesSession}
                    gradeLevel={feesGradeLevel}
                    open={isFeesOpen}
                    onOpenChange={setIsFeesOpen}
                />
            )}

            {subjectsGradeLevel && (
                <ManageSubjectsDialog
                    key={subjectsGradeLevel.id}
                    gradeLevel={subjectsGradeLevel}
                    open={isSubjectsOpen}
                    onOpenChange={setIsSubjectsOpen}
                />
            )}
        </>
    );
}
