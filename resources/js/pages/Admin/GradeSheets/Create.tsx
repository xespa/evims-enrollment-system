import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import gradeSheetRoutes from '@/routes/admin/grade-sheets';
import ScheduleFields from './Components/ScheduleFields';
import { SELECT_CLASS } from './Components/types';
import type { ScheduleData } from './Components/types';

type SubjectOption = {
    id: number;
    name: string;
    code: string | null;
    grade_level: string;
    school_year: string;
    /** The teachers who said they teach it. */
    teacher_ids: number[];
};

type Props = {
    subjects: SubjectOption[];
    /** Picked already, from "Create" next to one of the teacher's subjects. */
    selectedSubjectId: number | null;
    schoolYears: string[];
    defaultSchoolYear: string;
    /** Only admins choose the teacher; empty for teachers. */
    teachers: { id: number; name: string }[];
    /** The signed-in teacher, whose sheet this always is. Null for admins. */
    currentTeacher: { id: number; name: string } | null;
};

function Field({
    id,
    label,
    error,
    hint,
    children,
}: {
    id: string;
    label: string;
    error?: string;
    hint?: string;
    children: ReactNode;
}) {
    return (
        <div>
            <label
                htmlFor={id}
                className="mb-1 block text-sm font-medium text-[#1F2A24]/80"
            >
                {label}
            </label>
            {children}
            {error ? (
                <p id={`${id}-error`} className="mt-1 text-xs text-[#C6473B]">
                    {error}
                </p>
            ) : (
                hint && <p className="mt-1 text-xs text-[#1F2A24]/55">{hint}</p>
            )}
        </div>
    );
}

/** Groups a school year's subjects under their grade level, in order. */
function byGradeLevel(subjects: SubjectOption[]): [string, SubjectOption[]][] {
    const groups = new Map<string, SubjectOption[]>();

    for (const subject of subjects) {
        groups.set(subject.grade_level, [
            ...(groups.get(subject.grade_level) ?? []),
            subject,
        ]);
    }

    return [...groups.entries()];
}

export default function Create({
    subjects,
    selectedSubjectId,
    schoolYears,
    defaultSchoolYear,
    teachers,
    currentTeacher,
}: Props) {
    const { auth } = usePage().props;
    const selectedSubject =
        subjects.find((subject) => subject.id === selectedSubjectId) ?? null;

    const [schoolYear, setSchoolYear] = useState(
        selectedSubject?.school_year ??
            (schoolYears.includes(defaultSchoolYear)
                ? defaultSchoolYear
                : (schoolYears[0] ?? '')),
    );
    const [showAllSubjects, setShowAllSubjects] = useState(false);

    const { data, setData, post, processing, errors } = useForm<
        { subject_id: string; teacher_id: string } & ScheduleData
    >({
        subject_id: selectedSubject ? String(selectedSubject.id) : '',
        teacher_id: currentTeacher ? String(currentTeacher.id) : '',
        schedule_days: [],
        start_time: '',
        end_time: '',
    });

    // The chosen teacher's own subjects (from their Settings), if they've
    // listed any; otherwise every subject.
    const teacherId = Number(data.teacher_id);
    const teacherName =
        currentTeacher?.name ??
        teachers.find((teacher) => teacher.id === teacherId)?.name;
    const teachersSubjects = subjects.filter((subject) =>
        subject.teacher_ids.includes(teacherId),
    );
    const isNarrowed = teachersSubjects.length > 0 && !showAllSubjects;

    const subjectGroups = byGradeLevel(
        (isNarrowed ? teachersSubjects : subjects).filter(
            (subject) => subject.school_year === schoolYear,
        ),
    );

    const changeSchoolYear = (nextSchoolYear: string) => {
        setSchoolYear(nextSchoolYear);
        // The chosen subject belongs to the old school year.
        setData('subject_id', '');
    };

    const changeTeacher = (nextTeacherId: string) => {
        setShowAllSubjects(false);
        setData((current) => ({
            ...current,
            teacher_id: nextTeacherId,
            // Keep the subject only if it's one of the new teacher's.
            subject_id: subjects.some(
                (subject) =>
                    String(subject.id) === current.subject_id &&
                    subject.teacher_ids.includes(Number(nextTeacherId)),
            )
                ? current.subject_id
                : '',
        }));
    };

    const subjectHint = isNarrowed
        ? `Showing the subjects ${currentTeacher ? 'you teach' : `${teacherName} teaches`}.`
        : currentTeacher && teachersSubjects.length === 0
          ? 'Tip: choose the subjects you teach in Settings → Subjects to see only those here.'
          : undefined;

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(gradeSheetRoutes.store.url());
    };

    return (
        <>
            <Head title="New Grade Sheet" />

            <div className="bg-[#FBF8F2] px-4 py-8">
                <div className="mx-auto max-w-2xl">
                    <Link
                        href={gradeSheetRoutes.index.url()}
                        className="mb-4 inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-[#1F2A24]/70 hover:text-[#1F2A24]"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Grade Sheets
                    </Link>

                    <h1 className="font-serif text-2xl font-semibold text-[#1F2A24]">
                        New Grade Sheet
                    </h1>
                    <p className="mb-6 text-sm text-[#1F2A24]/70">
                        Choose the subject. Once it's created you can add
                        students and enter their grades.
                    </p>

                    <form
                        onSubmit={submit}
                        className="space-y-5 rounded-2xl border border-[#1F2A24]/10 bg-white p-5 sm:p-6"
                    >
                        <Field
                            id="grade-sheet-number"
                            label="Grade Sheet No."
                            hint="Assigned automatically when the sheet is created."
                        >
                            <input
                                id="grade-sheet-number"
                                value="GS-·····"
                                readOnly
                                disabled
                                className={`${SELECT_CLASS} font-mono`}
                            />
                        </Field>

                        <Field id="school-year" label="School Year">
                            <select
                                id="school-year"
                                value={schoolYear}
                                onChange={(e) =>
                                    changeSchoolYear(e.target.value)
                                }
                                className={SELECT_CLASS}
                            >
                                {schoolYears.length === 0 && (
                                    <option value="">
                                        No school year set up yet
                                    </option>
                                )}
                                {schoolYears.map((year) => (
                                    <option key={year} value={year}>
                                        SY {year}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field
                            id="teacher"
                            label="Teacher"
                            error={errors.teacher_id}
                        >
                            {currentTeacher ? (
                                <input
                                    id="teacher"
                                    value={currentTeacher.name}
                                    readOnly
                                    disabled
                                    className={SELECT_CLASS}
                                />
                            ) : (
                                <select
                                    id="teacher"
                                    value={data.teacher_id}
                                    onChange={(e) =>
                                        changeTeacher(e.target.value)
                                    }
                                    aria-invalid={!!errors.teacher_id}
                                    aria-describedby={
                                        errors.teacher_id
                                            ? 'teacher-error'
                                            : undefined
                                    }
                                    className={SELECT_CLASS}
                                >
                                    <option value="">Choose a teacher</option>
                                    {teachers.map((teacher) => (
                                        <option
                                            key={teacher.id}
                                            value={teacher.id}
                                        >
                                            {teacher.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </Field>

                        <Field
                            id="subject"
                            label="Subject"
                            error={errors.subject_id}
                            hint={subjectHint}
                        >
                            <select
                                id="subject"
                                value={data.subject_id}
                                onChange={(e) =>
                                    setData('subject_id', e.target.value)
                                }
                                aria-invalid={!!errors.subject_id}
                                aria-describedby={
                                    errors.subject_id
                                        ? 'subject-error'
                                        : undefined
                                }
                                className={SELECT_CLASS}
                            >
                                <option value="">Choose a subject</option>
                                {subjectGroups.map(
                                    ([gradeLevel, groupSubjects]) => (
                                        <optgroup
                                            key={gradeLevel}
                                            label={gradeLevel}
                                        >
                                            {groupSubjects.map((subject) => (
                                                <option
                                                    key={subject.id}
                                                    value={subject.id}
                                                >
                                                    {subject.code
                                                        ? `${subject.name} (${subject.code})`
                                                        : subject.name}
                                                </option>
                                            ))}
                                        </optgroup>
                                    ),
                                )}
                            </select>
                            {teachersSubjects.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowAllSubjects(
                                            (isShowingAll) => !isShowingAll,
                                        )
                                    }
                                    className="mt-1 text-xs font-semibold text-[#2F6F4E] underline-offset-2 hover:underline"
                                >
                                    {showAllSubjects
                                        ? `Only show ${currentTeacher ? 'my' : `${teacherName}'s`} subjects`
                                        : 'Show all subjects'}
                                </button>
                            )}
                        </Field>

                        <Field
                            id="prepared-by"
                            label="Prepared by"
                            hint="Printed on the grade sheet."
                        >
                            <input
                                id="prepared-by"
                                value={auth.user.name}
                                readOnly
                                disabled
                                className={SELECT_CLASS}
                            />
                        </Field>

                        <ScheduleFields
                            data={data}
                            onChange={setData}
                            errors={errors}
                        />

                        <div className="flex flex-col-reverse gap-2 border-t border-[#1F2A24]/10 pt-5 sm:flex-row sm:justify-end">
                            <Link
                                href={gradeSheetRoutes.index.url()}
                                className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#1F2A24]/15 px-5 text-sm font-semibold text-[#1F2A24]/80 hover:bg-[#1F2A24]/5"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#2F6F4E] px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#25573E] disabled:opacity-60"
                            >
                                {processing && (
                                    <Loader2
                                        className="h-4 w-4 animate-spin"
                                        aria-hidden="true"
                                    />
                                )}
                                Create
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
