import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { BookOpen, ClipboardList } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import AdminSettingsShell from '@/components/admin-settings-nav';
import {
    SettingsFormFooter,
    SettingsSection,
} from '@/components/admin-settings-section';
import admin from '@/routes/admin';

type SubjectOption = { id: number; name: string; code: string | null };

type Props = {
    /** Published school years, newest first, with each grade level's subjects. */
    schoolYears: {
        school_year: string;
        grade_levels: { name: string; subjects: SubjectOption[] }[];
    }[];
    selectedSubjectIds: number[];
    /** Shown first, when it's been set up. */
    currentSchoolYear: string;
};

/**
 * Ticks or clears every subject of one grade level; shown as partly ticked
 * when only some of them are chosen.
 */
function SelectAllCheckbox({
    gradeLevelName,
    selectedCount,
    total,
    onToggle,
}: {
    gradeLevelName: string;
    selectedCount: number;
    total: number;
    onToggle: () => void;
}) {
    const isAll = total > 0 && selectedCount === total;
    const isSome = selectedCount > 0 && !isAll;

    return (
        <label className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-full px-2 text-xs font-semibold text-brand-ink hover:bg-brand/5">
            <input
                type="checkbox"
                checked={isAll}
                // Indeterminate can only be set on the element itself.
                ref={(input) => {
                    if (input) {
                        input.indeterminate = isSome;
                    }
                }}
                onChange={onToggle}
                aria-label={`Select all ${gradeLevelName} subjects`}
                className="h-4 w-4 accent-brand"
            />
            Select all
            <span className="font-normal text-ink/55 tabular-nums">
                {selectedCount}/{total}
            </span>
        </label>
    );
}

/**
 * Where a teacher ticks the subjects they teach. Their grade sheets page
 * then lists these, ready to open or start a grade sheet for.
 */
export default function Subjects({
    schoolYears,
    selectedSubjectIds,
    currentSchoolYear,
}: Props) {
    const { props } = usePage<{ flash?: { success?: string } }>();
    const [schoolYear, setSchoolYear] = useState(
        schoolYears.some((year) => year.school_year === currentSchoolYear)
            ? currentSchoolYear
            : (schoolYears[0]?.school_year ?? ''),
    );
    const form = useForm<{ subject_ids: number[] }>({
        subject_ids: selectedSubjectIds,
    });
    const selected = new Set(form.data.subject_ids);
    const visibleYear = schoolYears.find(
        (year) => year.school_year === schoolYear,
    );

    const toggle = (subjectId: number) =>
        form.setData(
            'subject_ids',
            selected.has(subjectId)
                ? form.data.subject_ids.filter((id) => id !== subjectId)
                : [...form.data.subject_ids, subjectId],
        );

    // Ticks every subject of the grade level, or clears them all when they
    // already are.
    const toggleAll = (subjects: SubjectOption[]) => {
        const ids = subjects.map((subject) => subject.id);
        const allSelected = ids.every((id) => selected.has(id));

        form.setData(
            'subject_ids',
            allSelected
                ? form.data.subject_ids.filter((id) => !ids.includes(id))
                : [...new Set([...form.data.subject_ids, ...ids])],
        );
    };

    const countIn = (year: Props['schoolYears'][number]) =>
        year.grade_levels
            .flatMap((gradeLevel) => gradeLevel.subjects)
            .filter((subject) => selected.has(subject.id)).length;

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.put(admin.settings.subjects.update.url(), {
            preserveScroll: true,
            onSuccess: () => form.setDefaults(),
        });
    };

    const subjectError = Object.entries(form.errors).find(([key]) =>
        key.startsWith('subject_ids'),
    )?.[1];

    return (
        <>
            <Head title="Subjects I Teach" />

            <AdminSettingsShell>
                {props.flash?.success && (
                    <div
                        role="status"
                        className="rounded-xl border border-brand/25 bg-brand/5 px-4 py-3 text-sm text-brand-ink"
                    >
                        {props.flash.success}{' '}
                        <Link
                            href={admin.gradeSheets.index.url()}
                            className="font-semibold underline-offset-2 hover:underline"
                        >
                            Go to Grade Sheets
                        </Link>
                    </div>
                )}

                <form onSubmit={submit}>
                    <SettingsSection
                        title="Subjects I teach"
                        description="Tick every subject you teach. They show on your Grade Sheets page, ready to start a grade sheet for."
                    >
                        {schoolYears.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                                <BookOpen
                                    className="h-8 w-8 text-ink/30"
                                    aria-hidden="true"
                                />
                                <p className="text-sm text-ink/65">
                                    No school year has been set up yet. Ask an
                                    administrator to publish one.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-5 px-6 py-5">
                                <div className="flex flex-wrap items-center gap-3">
                                    <label
                                        htmlFor="subjects-school-year"
                                        className="text-sm font-medium text-ink/80"
                                    >
                                        School year
                                    </label>
                                    <select
                                        id="subjects-school-year"
                                        value={schoolYear}
                                        onChange={(e) =>
                                            setSchoolYear(e.target.value)
                                        }
                                        className="min-h-10 rounded-lg border border-ink/15 bg-surface px-3 text-sm text-ink focus:border-brand focus:ring-2 focus:ring-brand/30 focus:outline-none"
                                    >
                                        {schoolYears.map((year) => (
                                            <option
                                                key={year.school_year}
                                                value={year.school_year}
                                            >
                                                SY {year.school_year} (
                                                {countIn(year)} chosen)
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {visibleYear?.grade_levels.map((gradeLevel) => (
                                    <fieldset key={gradeLevel.name}>
                                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                            <legend className="text-xs font-semibold tracking-[0.08em] text-brand-ink uppercase">
                                                {gradeLevel.name}
                                            </legend>
                                            <SelectAllCheckbox
                                                gradeLevelName={gradeLevel.name}
                                                selectedCount={
                                                    gradeLevel.subjects.filter(
                                                        (subject) =>
                                                            selected.has(
                                                                subject.id,
                                                            ),
                                                    ).length
                                                }
                                                total={
                                                    gradeLevel.subjects.length
                                                }
                                                onToggle={() =>
                                                    toggleAll(
                                                        gradeLevel.subjects,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                            {gradeLevel.subjects.map(
                                                (subject) => {
                                                    const isChecked =
                                                        selected.has(
                                                            subject.id,
                                                        );

                                                    return (
                                                        <label
                                                            key={subject.id}
                                                            className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors ${
                                                                isChecked
                                                                    ? 'border-brand/50 bg-brand/5'
                                                                    : 'border-ink/10 hover:bg-ink/[0.03]'
                                                            }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    isChecked
                                                                }
                                                                onChange={() =>
                                                                    toggle(
                                                                        subject.id,
                                                                    )
                                                                }
                                                                className="h-4 w-4 accent-brand"
                                                            />
                                                            <span className="min-w-0">
                                                                <span className="block font-medium text-ink">
                                                                    {
                                                                        subject.name
                                                                    }
                                                                </span>
                                                                {subject.code && (
                                                                    <span className="text-xs text-ink/55">
                                                                        {
                                                                            subject.code
                                                                        }
                                                                    </span>
                                                                )}
                                                            </span>
                                                        </label>
                                                    );
                                                },
                                            )}
                                        </div>
                                    </fieldset>
                                ))}

                                {subjectError && (
                                    <p
                                        role="alert"
                                        className="text-sm text-danger-ink"
                                    >
                                        {subjectError}
                                    </p>
                                )}

                                <p className="flex items-center gap-2 text-sm text-ink/65">
                                    <ClipboardList
                                        className="h-4 w-4 shrink-0"
                                        aria-hidden="true"
                                    />
                                    {selected.size === 1
                                        ? '1 subject chosen in all.'
                                        : `${selected.size} subjects chosen in all.`}
                                </p>
                            </div>
                        )}

                        <SettingsFormFooter
                            isDirty={form.isDirty}
                            processing={form.processing}
                            recentlySuccessful={form.recentlySuccessful}
                            onDiscard={() => form.reset()}
                        />
                    </SettingsSection>
                </form>
            </AdminSettingsShell>
        </>
    );
}
