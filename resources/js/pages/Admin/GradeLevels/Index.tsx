import { Head, router, usePage } from '@inertiajs/react';
import {
    BookOpen,
    CalendarClock,
    CalendarPlus,
    FilePen,
    Loader2,
    Pencil,
    Save,
} from 'lucide-react';
import { useState } from 'react';
import { useConfirm } from '@/hooks/use-confirm';
import {
    BILLABLE_MONTHS,
    formatCurrency,
} from '@/pages/Enrollment/Components/fees';
import EditFeesDialog from './Components/EditFeesDialog';
import EnrollmentPeriodDialog from './Components/EnrollmentPeriodDialog';
import { formatDate, periodStatus } from './Components/period';
import ManageSubjectsDialog from './Components/ManageSubjectsDialog';
import { MONTHLY_FEES, ONE_TIME_FEES } from './Components/types';
import type {
    Curriculum,
    EnrollmentPeriod,
    GradeLevel,
} from './Components/types';

type Props = {
    gradeLevels: GradeLevel[];
    schoolYear: string;
    schoolYears: string[];
    currentSchoolYear: string;
    /** A newly set-up year awaiting Save or Cancel, if any. */
    draftSchoolYear: string | null;
    nextSchoolYear: string;
    manageGradeLevelId: number | null;
    /** When applications for the selected year open and close, if set. */
    enrollmentPeriod: EnrollmentPeriod | null;
    /** Today's date at the school (Y-m-d). */
    today: string;
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

function feeTotal(curriculum: Curriculum, names: { name: string }[]) {
    return names.reduce(
        (total, { name }) =>
            total + Number(curriculum[name as keyof Curriculum] ?? 0),
        0,
    );
}

function yearLabel(
    schoolYear: string,
    currentSchoolYear: string,
    draftSchoolYear: string | null,
) {
    if (schoolYear === draftSchoolYear) return 'Draft';
    if (schoolYear === currentSchoolYear) return 'Current';

    return schoolYear > currentSchoolYear ? 'Upcoming' : 'Past';
}

function EnrollmentPeriodCard({
    schoolYear,
    period,
    today,
    onEdit,
    onRemove,
}: {
    schoolYear: string;
    period: EnrollmentPeriod | null;
    today: string;
    onEdit: () => void;
    onRemove: () => void;
}) {
    const status = period ? periodStatus(period, today) : null;

    return (
        <section
            aria-label={`Enrollment dates for ${schoolYear}`}
            className="mb-6 flex flex-col gap-3 rounded-2xl border border-[#1F2A24]/10 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
        >
            <div className="flex gap-3">
                <CalendarClock
                    className="mt-0.5 h-5 w-5 shrink-0 text-[#2F6F4E]"
                    aria-hidden="true"
                />
                <div>
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[#1F2A24]">
                        Enrollment dates
                        {status && (
                            <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.tone}`}
                            >
                                {status.label}
                            </span>
                        )}
                    </p>
                    <p className="text-sm text-[#1F2A24]/70">
                        {period
                            ? `${formatDate(period.opens_on)} – ${formatDate(period.closes_on)}`
                            : `Not set. Parents can apply for ${schoolYear} once it's saved, until a newer year opens.`}
                    </p>
                </div>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
                {period && (
                    <button
                        type="button"
                        onClick={onRemove}
                        className="min-h-10 rounded-full px-4 text-sm font-medium text-[#1F2A24]/70 hover:bg-[#1F2A24]/5 hover:text-[#1F2A24]"
                    >
                        Remove dates
                    </button>
                )}
                <button
                    type="button"
                    onClick={onEdit}
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[#2F6F4E]/30 px-4 text-sm font-medium text-[#2F6F4E] transition-colors hover:bg-[#2F6F4E]/5"
                >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                    {period ? 'Change dates' : 'Set dates'}
                </button>
            </div>
        </section>
    );
}

function GradeLevelCard({
    gradeLevel,
    schoolYear,
    onEditFees,
    onManageSubjects,
}: {
    gradeLevel: GradeLevel;
    schoolYear: string;
    onEditFees: () => void;
    onManageSubjects: () => void;
}) {
    const curriculum = gradeLevel.curriculum;

    if (!curriculum) {
        return (
            <article className="flex flex-col justify-center rounded-2xl border border-dashed border-[#1F2A24]/15 bg-white/60 p-5">
                <h3 className="font-serif text-lg font-semibold text-[#1F2A24]/60">
                    {gradeLevel.name}
                </h3>
                <p className="mt-1 text-sm text-[#1F2A24]/55">
                    Not offered in {schoolYear}.
                </p>
            </article>
        );
    }

    const oneTime = feeTotal(curriculum, ONE_TIME_FEES);
    const monthly = feeTotal(curriculum, MONTHLY_FEES);
    const subjectCount = curriculum.subjects.length;

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
                {formatCurrency(curriculum.tuition_fee)}
            </p>
            <p className="text-xs text-[#1F2A24]/55">
                per school year
                {curriculum.enrollments_count > 0 &&
                    ` · ${curriculum.enrollments_count} ${curriculum.enrollments_count === 1 ? 'application' : 'applications'}`}
            </p>

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

export default function Index({
    gradeLevels,
    schoolYear,
    schoolYears,
    currentSchoolYear,
    draftSchoolYear,
    nextSchoolYear,
    manageGradeLevelId,
    enrollmentPeriod,
    today,
}: Props) {
    const { props } = usePage();
    const [confirm, confirmDialog] = useConfirm();
    const [isSettingUp, setIsSettingUp] = useState(false);
    const [draftAction, setDraftAction] = useState<'save' | 'cancel' | null>(
        null,
    );

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

    const [isPeriodOpen, setIsPeriodOpen] = useState(false);
    // Bumped on every open so the date form starts from the saved dates.
    const [periodSession, setPeriodSession] = useState(0);

    const openPeriod = () => {
        setPeriodSession((n) => n + 1);
        setIsPeriodOpen(true);
    };

    const removePeriod = async () => {
        const confirmed = await confirm({
            title: `Remove the enrollment dates for ${schoolYear}?`,
            description: `Parents will be able to apply for ${schoolYear} whenever it's saved and is the newest school year, and no more reminders will be sent for it.`,
            confirmLabel: 'Remove dates',
            destructive: true,
        });

        if (!confirmed) return;

        router.delete(
            route('admin.school-years.enrollment-period.destroy', schoolYear),
            { preserveScroll: true },
        );
    };

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

    const showSchoolYear = (year: string) => {
        router.get(
            route('admin.grade-levels.index'),
            { school_year: year },
            { preserveScroll: true },
        );
    };

    const latestSchoolYear = schoolYears[schoolYears.length - 1];

    const setUpNextSchoolYear = async () => {
        const confirmed = await confirm({
            title: `Set up ${nextSchoolYear}?`,
            description: latestSchoolYear
                ? `This creates a draft of ${nextSchoolYear} with every grade level's fees and subjects copied from ${latestSchoolYear}, and its enrollment dates (if set) moved a year later. Review and edit it, then Save to open enrollment — or Cancel to discard it. ${latestSchoolYear} isn't affected either way.`
                : `This creates a draft of ${nextSchoolYear} with no subjects and ₱0 fees. Fill it in, then Save to open enrollment — or Cancel to discard it.`,
            confirmLabel: `Set up ${nextSchoolYear}`,
        });

        if (!confirmed) {
            return;
        }

        router.post(
            route('admin.school-years.store'),
            { school_year: nextSchoolYear },
            {
                onStart: () => setIsSettingUp(true),
                onFinish: () => setIsSettingUp(false),
            },
        );
    };

    const saveDraft = async () => {
        if (!draftSchoolYear) return;

        const confirmed = await confirm({
            title: `Save ${draftSchoolYear}?`,
            description: `Parents will be able to apply for ${draftSchoolYear} with these fees and subjects. You can still edit them afterward; applications already made keep their price.`,
            confirmLabel: `Save ${draftSchoolYear}`,
        });

        if (!confirmed) return;

        router.patch(
            route('admin.school-years.update', draftSchoolYear),
            {},
            {
                onStart: () => setDraftAction('save'),
                onFinish: () => setDraftAction(null),
            },
        );
    };

    const cancelDraft = async () => {
        if (!draftSchoolYear) return;

        const confirmed = await confirm({
            title: `Cancel setting up ${draftSchoolYear}?`,
            description: `The draft and every change made to it will be discarded. Nothing else is affected, and you can set it up again later.`,
            confirmLabel: 'Discard draft',
            cancelLabel: 'Keep editing',
            destructive: true,
        });

        if (!confirmed) return;

        router.delete(route('admin.school-years.destroy', draftSchoolYear), {
            onStart: () => setDraftAction('cancel'),
            onFinish: () => setDraftAction(null),
        });
    };

    const isViewingDraft = schoolYear === draftSchoolYear;
    const flashSuccess = props.flash?.success;
    const setUpError = (props.errors as Record<string, string> | undefined)
        ?.school_year;
    const anyModalOpen = isFeesOpen || isSubjectsOpen || isPeriodOpen;
    const hasSchoolYears = schoolYears.length > 0;

    return (
        <>
            <Head title="School Year Setup" />
            {confirmDialog}

            <div className="bg-[#FBF8F2] px-4 py-8">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-6 max-w-2xl">
                        <h1 className="font-serif text-2xl font-semibold text-[#1F2A24]">
                            School Year Setup
                        </h1>
                        <p className="mt-1 text-sm text-[#1F2A24]/70">
                            Set up each school year's enrollment period and
                            every grade level's fees and subjects. Each year is
                            kept separate, so next year's changes never touch
                            this year's students or bills.
                        </p>
                    </div>

                    {/* School year */}
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#1F2A24]/10 bg-white p-3">
                        <nav
                            aria-label="School year"
                            className="flex flex-wrap gap-1"
                        >
                            {schoolYears.map((year) => {
                                const isSelected = year === schoolYear;

                                return (
                                    <button
                                        key={year}
                                        type="button"
                                        onClick={() => showSchoolYear(year)}
                                        aria-current={
                                            isSelected ? 'page' : undefined
                                        }
                                        className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors ${
                                            isSelected
                                                ? 'bg-[#2F6F4E] text-white'
                                                : 'text-[#1F2A24]/70 hover:bg-[#1F2A24]/5 hover:text-[#1F2A24]'
                                        }`}
                                    >
                                        S.Y. {year}
                                        <span
                                            className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${
                                                isSelected
                                                    ? 'bg-white/20'
                                                    : 'bg-[#1F2A24]/5 text-[#1F2A24]/55'
                                            }`}
                                        >
                                            {yearLabel(
                                                year,
                                                currentSchoolYear,
                                                draftSchoolYear,
                                            )}
                                        </span>
                                    </button>
                                );
                            })}
                        </nav>

                        {!draftSchoolYear && (
                            <button
                                type="button"
                                onClick={setUpNextSchoolYear}
                                disabled={isSettingUp}
                                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-dashed border-[#2F6F4E]/50 px-4 text-sm font-semibold text-[#2F6F4E] transition-colors hover:bg-[#2F6F4E]/5 disabled:cursor-wait disabled:opacity-60"
                            >
                                {isSettingUp ? (
                                    <Loader2
                                        className="h-4 w-4 animate-spin"
                                        aria-hidden="true"
                                    />
                                ) : (
                                    <CalendarPlus
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                    />
                                )}
                                Set up {nextSchoolYear}
                            </button>
                        )}
                    </div>

                    {draftSchoolYear && (
                        <div
                            role="region"
                            aria-label={`Setting up ${draftSchoolYear}`}
                            className="mb-6 flex flex-col gap-3 rounded-2xl border border-[#E8A33D]/40 bg-[#E8A33D]/10 p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                            <div className="flex gap-3">
                                <FilePen
                                    className="mt-0.5 h-5 w-5 shrink-0 text-[#a4670f]"
                                    aria-hidden="true"
                                />
                                <div>
                                    <p className="text-sm font-semibold text-[#1F2A24]">
                                        {draftSchoolYear} is a draft
                                    </p>
                                    <p className="text-sm text-[#1F2A24]/70">
                                        {isViewingDraft
                                            ? 'Edit its fees and subjects below. Parents can’t apply for it until you save.'
                                            : 'Parents can’t apply for it until you review and save it.'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex shrink-0 flex-wrap gap-2">
                                {!isViewingDraft && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            showSchoolYear(draftSchoolYear)
                                        }
                                        className="min-h-10 rounded-full px-4 text-sm font-medium text-[#2F6F4E] hover:underline"
                                    >
                                        Review draft
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={cancelDraft}
                                    disabled={draftAction !== null}
                                    className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#1F2A24]/15 bg-white px-4 text-sm font-medium text-[#1F2A24] hover:bg-[#1F2A24]/5 disabled:cursor-wait disabled:opacity-60"
                                >
                                    {draftAction === 'cancel' && (
                                        <Loader2
                                            className="h-4 w-4 animate-spin"
                                            aria-hidden="true"
                                        />
                                    )}
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={saveDraft}
                                    disabled={draftAction !== null}
                                    className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#2F6F4E] px-5 text-sm font-semibold text-white hover:bg-[#25573E] disabled:cursor-wait disabled:opacity-60"
                                >
                                    {draftAction === 'save' ? (
                                        <Loader2
                                            className="h-4 w-4 animate-spin"
                                            aria-hidden="true"
                                        />
                                    ) : (
                                        <Save
                                            className="h-4 w-4"
                                            aria-hidden="true"
                                        />
                                    )}
                                    Save {draftSchoolYear}
                                </button>
                            </div>
                        </div>
                    )}

                    {hasSchoolYears && (
                        <EnrollmentPeriodCard
                            schoolYear={schoolYear}
                            period={enrollmentPeriod}
                            today={today}
                            onEdit={openPeriod}
                            onRemove={removePeriod}
                        />
                    )}

                    {setUpError && (
                        <div
                            role="alert"
                            className="mb-6 rounded-xl border border-[#C6473B]/30 bg-[#C6473B]/5 px-4 py-3 text-sm text-[#A83A30]"
                        >
                            {setUpError}
                        </div>
                    )}

                    {flashSuccess && !anyModalOpen && (
                        <div
                            role="status"
                            className="mb-6 rounded-xl border border-[#2F6F4E]/25 bg-[#2F6F4E]/5 px-4 py-3 text-sm text-[#2F6F4E]"
                        >
                            {flashSuccess}
                        </div>
                    )}

                    {!hasSchoolYears ? (
                        <div className="rounded-2xl border border-dashed border-[#1F2A24]/15 bg-white px-6 py-12 text-center">
                            <p className="font-serif text-lg font-semibold text-[#1F2A24]">
                                No school year is set up yet
                            </p>
                            <p className="mt-1 text-sm text-[#1F2A24]/65">
                                Set up {nextSchoolYear} to add its fees and
                                subjects. Enrollment opens for a school year
                                once it's saved.
                            </p>
                        </div>
                    ) : (
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
                                                    schoolYear={schoolYear}
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
                    )}
                </div>
            </div>

            <EnrollmentPeriodDialog
                key={`${schoolYear}-${periodSession}`}
                schoolYear={schoolYear}
                enrollmentPeriod={enrollmentPeriod}
                today={today}
                open={isPeriodOpen}
                onOpenChange={setIsPeriodOpen}
            />

            {feesGradeLevel?.curriculum && (
                <EditFeesDialog
                    key={feesSession}
                    gradeLevel={feesGradeLevel}
                    curriculum={feesGradeLevel.curriculum}
                    open={isFeesOpen}
                    onOpenChange={setIsFeesOpen}
                />
            )}

            {subjectsGradeLevel?.curriculum && (
                <ManageSubjectsDialog
                    key={subjectsGradeLevel.curriculum.id}
                    gradeLevel={subjectsGradeLevel}
                    curriculum={subjectsGradeLevel.curriculum}
                    open={isSubjectsOpen}
                    onOpenChange={setIsSubjectsOpen}
                />
            )}
        </>
    );
}
