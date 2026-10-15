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
};

/**
 * Where a teacher ticks the subjects they teach. Their grade sheets page
 * then lists these, ready to open or start a grade sheet for.
 */
export default function Subjects({ schoolYears, selectedSubjectIds }: Props) {
    const { props } = usePage<{ flash?: { success?: string } }>();
    const [schoolYear, setSchoolYear] = useState(
        schoolYears[0]?.school_year ?? '',
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
                        className="rounded-xl border border-[#2F6F4E]/25 bg-[#2F6F4E]/5 px-4 py-3 text-sm text-[#2F6F4E]"
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
                                    className="h-8 w-8 text-[#1F2A24]/30"
                                    aria-hidden="true"
                                />
                                <p className="text-sm text-[#1F2A24]/65">
                                    No school year has been set up yet. Ask an
                                    administrator to publish one.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-5 px-6 py-5">
                                <div className="flex flex-wrap items-center gap-3">
                                    <label
                                        htmlFor="subjects-school-year"
                                        className="text-sm font-medium text-[#1F2A24]/80"
                                    >
                                        School year
                                    </label>
                                    <select
                                        id="subjects-school-year"
                                        value={schoolYear}
                                        onChange={(e) =>
                                            setSchoolYear(e.target.value)
                                        }
                                        className="min-h-10 rounded-lg border border-[#1F2A24]/15 bg-white px-3 text-sm text-[#1F2A24] focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none"
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
                                        <legend className="mb-2 text-xs font-semibold tracking-[0.08em] text-[#2F6F4E] uppercase">
                                            {gradeLevel.name}
                                        </legend>
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
                                                                    ? 'border-[#2F6F4E]/50 bg-[#2F6F4E]/5'
                                                                    : 'border-[#1F2A24]/10 hover:bg-[#1F2A24]/[0.03]'
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
                                                                className="h-4 w-4 accent-[#2F6F4E]"
                                                            />
                                                            <span className="min-w-0">
                                                                <span className="block font-medium text-[#1F2A24]">
                                                                    {
                                                                        subject.name
                                                                    }
                                                                </span>
                                                                {subject.code && (
                                                                    <span className="text-xs text-[#1F2A24]/55">
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
                                        className="text-sm text-[#C6473B]"
                                    >
                                        {subjectError}
                                    </p>
                                )}

                                <p className="flex items-center gap-2 text-sm text-[#1F2A24]/65">
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
