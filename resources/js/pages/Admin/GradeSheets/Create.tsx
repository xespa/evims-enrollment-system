import {
    Head,
    Link,
    router,
    useForm,
    usePage,
    setLayoutProps,
} from '@inertiajs/react';
import {
    ArrowLeft,
    ChevronDown,
    Loader2,
    TriangleAlert,
    Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import gradeSheetRoutes from '@/routes/admin/grade-sheets';
import type { StudentOption } from '../StudentGrades/Components/StudentCombobox';
import ScheduleFields from './Components/ScheduleFields';
import StudentChecklist from './Components/StudentChecklist';
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
    /** Sheets already made for it, at most one per teacher. */
    grade_sheets: {
        id: number;
        number: string;
        teacher_id: number;
        archived: boolean;
    }[];
    /** Approved students taking it, who a new sheet starts with. */
    enrolled_students_count: number;
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
    /** Who the chosen subject's sheet would start with; null until one is chosen. */
    enrolledStudents: StudentOption[] | null;
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
                className="mb-1 block text-sm font-medium text-ink/80"
            >
                {label}
            </label>
            {children}
            {error ? (
                <p id={`${id}-error`} className="mt-1 text-xs text-danger-ink">
                    {error}
                </p>
            ) : (
                hint && <p className="mt-1 text-xs text-ink/55">{hint}</p>
            )}
        </div>
    );
}

/** The teacher's sheet for the subject, if they've already made one. */
function existingSheetFor(subject: SubjectOption, teacherId: number) {
    return subject.grade_sheets.find((sheet) => sheet.teacher_id === teacherId);
}

/**
 * e.g. "Mathematics (MATH4) · 10 students", so empty classes stand out, or
 * "… · has GS-00012" when the teacher already has its sheet.
 */
function subjectOptionLabel(subject: SubjectOption, teacherId: number): string {
    const name = subject.code
        ? `${subject.name} (${subject.code})`
        : subject.name;
    const students =
        subject.enrolled_students_count === 1
            ? '1 student'
            : `${subject.enrolled_students_count} students`;
    const existingSheet = existingSheetFor(subject, teacherId);

    return existingSheet
        ? `${name} · ${students} · has ${existingSheet.number}${existingSheet.archived ? ' (archived)' : ''}`
        : `${name} · ${students}`;
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
    enrolledStudents,
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

    const { data, setData, post, transform, processing, errors } = useForm<
        {
            subject_id: string;
            teacher_id: string;
            add_students: boolean;
            enrollment_ids: number[];
        } & ScheduleData
    >({
        subject_id: selectedSubject ? String(selectedSubject.id) : '',
        teacher_id: currentTeacher ? String(currentTeacher.id) : '',
        schedule_days: [],
        start_time: '',
        end_time: '',
        // Saves adding the class one by one afterwards.
        add_students: true,
        enrollment_ids: (enrolledStudents ?? []).map(
            (student) => student.enrollment_id,
        ),
    });

    const chosenSubject = subjects.find(
        (subject) => String(subject.id) === data.subject_id,
    );

    // The chosen subject's students load on their own when it changes, all
    // ticked; `studentsFor` is the subject the loaded list belongs to.
    const [studentsFor, setStudentsFor] = useState(
        selectedSubject ? String(selectedSubject.id) : '',
    );
    const [isChecklistOpen, setIsChecklistOpen] = useState(false);
    const subjectStudents =
        data.subject_id !== '' && studentsFor === data.subject_id
            ? (enrolledStudents ?? [])
            : null;

    useEffect(() => {
        if (data.subject_id === '' || data.subject_id === studentsFor) {
            return;
        }

        const subjectId = data.subject_id;

        router.reload({
            only: ['enrolledStudents'],
            data: { subject_id: subjectId },
            onSuccess: (page) => {
                const students =
                    (page.props.enrolledStudents as StudentOption[] | null) ??
                    [];

                setStudentsFor(subjectId);
                setData(
                    'enrollment_ids',
                    students.map((student) => student.enrollment_id),
                );
            },
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.subject_id]);

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
    const existingSheet = chosenSubject
        ? existingSheetFor(chosenSubject, teacherId)
        : undefined;

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

    // A subject with nobody taking it this year, when the same grade level's
    // subject has students in another year: usually the wrong year was picked.
    const sameSubjectWithStudents =
        chosenSubject && chosenSubject.enrolled_students_count === 0
            ? subjects.find(
                  (subject) =>
                      subject.name === chosenSubject.name &&
                      subject.grade_level === chosenSubject.grade_level &&
                      subject.school_year !== chosenSubject.school_year &&
                      subject.enrolled_students_count > 0,
              )
            : undefined;

    const switchToSubject = (subject: SubjectOption) => {
        setSchoolYear(subject.school_year);
        setData('subject_id', String(subject.id));
    };

    const subjectHint = isNarrowed
        ? `Showing the subjects ${currentTeacher ? 'you teach' : `${teacherName} teaches`}.`
        : currentTeacher && teachersSubjects.length === 0
          ? 'Tip: choose the subjects you teach in Settings → Subjects to see only those here.'
          : undefined;

    const submit = (e: FormEvent) => {
        e.preventDefault();
        // Only the ticked students are sent once the list has loaded; until
        // then (or when adding none) the server decides.
        transform(({ enrollment_ids, ...rest }) =>
            rest.add_students && subjectStudents !== null
                ? { ...rest, enrollment_ids }
                : rest,
        );
        post(gradeSheetRoutes.store.url());
    };
    setLayoutProps({ title: 'New Grade Sheet' });

    return (
        <>
            <Head title="New Grade Sheet" />

            <div className="bg-cream px-4 py-8">
                <div className="mx-auto max-w-2xl">
                    <Link
                        href={gradeSheetRoutes.index.url()}
                        className="mb-4 inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-ink/70 hover:text-ink"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Grade Sheets
                    </Link>

                    <form
                        onSubmit={submit}
                        className="space-y-5 rounded-2xl border border-ink/10 bg-surface p-5 sm:p-6"
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
                                                    {subjectOptionLabel(
                                                        subject,
                                                        teacherId,
                                                    )}
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
                                    className="mt-1 text-xs font-semibold text-brand-ink underline-offset-2 hover:underline"
                                >
                                    {showAllSubjects
                                        ? `Only show ${currentTeacher ? 'my' : `${teacherName}'s`} subjects`
                                        : 'Show all subjects'}
                                </button>
                            )}
                            {existingSheet && (
                                <div
                                    role="alert"
                                    className="mt-2 flex flex-col gap-2 rounded-lg border border-warn/40 bg-warn/10 px-3 py-2.5 text-sm text-warn-deep sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <p className="flex items-start gap-2">
                                        <TriangleAlert
                                            className="mt-0.5 h-4 w-4 shrink-0"
                                            aria-hidden="true"
                                        />
                                        <span>
                                            {currentTeacher
                                                ? 'You already have'
                                                : `${teacherName} already has`}{' '}
                                            grade sheet {existingSheet.number}{' '}
                                            for this subject
                                            {existingSheet.archived
                                                ? '. It’s archived: open it to restore it.'
                                                : '.'}
                                        </span>
                                    </p>
                                    <Link
                                        href={gradeSheetRoutes.show.url(
                                            existingSheet.id,
                                        )}
                                        className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-full bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-deep"
                                    >
                                        Open {existingSheet.number}
                                    </Link>
                                </div>
                            )}
                            {!existingSheet &&
                                chosenSubject?.enrolled_students_count ===
                                    0 && (
                                    <div
                                        role="alert"
                                        className="mt-2 flex flex-col gap-2 rounded-lg border border-warn/40 bg-warn/10 px-3 py-2.5 text-sm text-warn-deep sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <p className="flex items-start gap-2">
                                            <TriangleAlert
                                                className="mt-0.5 h-4 w-4 shrink-0"
                                                aria-hidden="true"
                                            />
                                            <span>
                                                No approved students are taking{' '}
                                                {chosenSubject.grade_level}{' '}
                                                {chosenSubject.name} in SY{' '}
                                                {chosenSubject.school_year}, so
                                                the sheet would start empty.
                                                {sameSubjectWithStudents &&
                                                    ` SY ${sameSubjectWithStudents.school_year} has ${sameSubjectWithStudents.enrolled_students_count === 1 ? '1 student' : `${sameSubjectWithStudents.enrolled_students_count} students`}.`}
                                            </span>
                                        </p>
                                        {sameSubjectWithStudents && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    switchToSubject(
                                                        sameSubjectWithStudents,
                                                    )
                                                }
                                                className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-full bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-deep"
                                            >
                                                Use SY{' '}
                                                {
                                                    sameSubjectWithStudents.school_year
                                                }
                                            </button>
                                        )}
                                    </div>
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

                        <div
                            className={`rounded-xl border transition-colors ${
                                data.add_students
                                    ? 'border-brand/40 bg-brand/5'
                                    : 'border-ink/15 bg-surface'
                            }`}
                        >
                            <label className="flex cursor-pointer items-start gap-3 p-4">
                                <input
                                    type="checkbox"
                                    checked={data.add_students}
                                    onChange={(e) =>
                                        setData(
                                            'add_students',
                                            e.target.checked,
                                        )
                                    }
                                    className="mt-0.5 h-4 w-4 accent-brand"
                                />
                                <span>
                                    <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                                        <Users
                                            className="h-4 w-4 text-brand-ink"
                                            aria-hidden="true"
                                        />
                                        Add the enrolled students
                                    </span>
                                    <span
                                        aria-live="polite"
                                        className="mt-0.5 block text-xs text-ink/65"
                                    >
                                        {chosenSubject === undefined
                                            ? 'Every approved student taking the subject is put on the sheet, ready for their grades.'
                                            : chosenSubject.enrolled_students_count ===
                                                0
                                              ? `No approved students are taking ${chosenSubject.name} yet.`
                                              : subjectStudents === null
                                                ? `${chosenSubject.enrolled_students_count === 1 ? '1 student' : `${chosenSubject.enrolled_students_count} students`} taking ${chosenSubject.name} will be added, ready for their grades.`
                                                : `${data.enrollment_ids.length} of ${subjectStudents.length} students taking ${chosenSubject.name} will be added, ready for their grades.`}
                                    </span>
                                </span>
                            </label>

                            {data.add_students &&
                                chosenSubject !== undefined &&
                                chosenSubject.enrolled_students_count > 0 && (
                                    <div className="border-t border-brand/15 px-4 pb-3">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setIsChecklistOpen(
                                                    (isOpen) => !isOpen,
                                                )
                                            }
                                            aria-expanded={isChecklistOpen}
                                            aria-controls="students-to-add"
                                            disabled={subjectStudents === null}
                                            className="flex min-h-11 w-full items-center justify-between gap-2 text-sm font-semibold text-brand-ink disabled:opacity-60"
                                        >
                                            <span>
                                                {subjectStudents === null
                                                    ? 'Loading the students…'
                                                    : isChecklistOpen
                                                      ? 'Hide the students'
                                                      : 'Check the students to include'}
                                            </span>
                                            {subjectStudents === null ? (
                                                <Loader2
                                                    className="h-4 w-4 animate-spin"
                                                    aria-hidden="true"
                                                />
                                            ) : (
                                                <ChevronDown
                                                    className={`h-4 w-4 transition-transform ${isChecklistOpen ? 'rotate-180' : ''}`}
                                                    aria-hidden="true"
                                                />
                                            )}
                                        </button>

                                        {isChecklistOpen &&
                                            subjectStudents !== null && (
                                                <div
                                                    id="students-to-add"
                                                    className="rounded-lg border border-ink/10 bg-surface p-3"
                                                >
                                                    <StudentChecklist
                                                        students={
                                                            subjectStudents
                                                        }
                                                        selectedIds={
                                                            data.enrollment_ids
                                                        }
                                                        onChange={(ids) =>
                                                            setData(
                                                                'enrollment_ids',
                                                                ids,
                                                            )
                                                        }
                                                        listClassName="max-h-72"
                                                    />
                                                    {data.enrollment_ids
                                                        .length === 0 && (
                                                        <p className="mt-2 text-xs text-warn-ink">
                                                            Nobody is ticked, so
                                                            the sheet will start
                                                            empty.
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                        {Object.entries(errors)
                                            .filter(([key]) =>
                                                key.startsWith(
                                                    'enrollment_ids',
                                                ),
                                            )
                                            .slice(0, 1)
                                            .map(([key, message]) => (
                                                <p
                                                    key={key}
                                                    role="alert"
                                                    className="mt-2 text-xs text-danger-ink"
                                                >
                                                    {message}
                                                </p>
                                            ))}
                                    </div>
                                )}
                        </div>

                        <div className="flex flex-col-reverse gap-2 border-t border-ink/10 pt-5 sm:flex-row sm:justify-end">
                            <Link
                                href={gradeSheetRoutes.index.url()}
                                className="inline-flex min-h-11 items-center justify-center rounded-full border border-ink/15 px-5 text-sm font-semibold text-ink/80 hover:bg-ink/5"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing || !!existingSheet}
                                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-deep disabled:opacity-60"
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
