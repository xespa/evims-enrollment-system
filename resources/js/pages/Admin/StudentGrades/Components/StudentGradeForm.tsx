import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Loader2, UserRound } from 'lucide-react';
import type { FormEvent } from 'react';
import gradeSheetRoutes from '@/routes/admin/grade-sheets';
import studentGradeRoutes from '@/routes/admin/student-grades';
import {
    PASSING_GRADE,
    TERMS,
    formatGrade,
} from '../../GradeSheets/Components/types';
import type {
    GradeSheetSummary,
    StudentGradeRow,
    TermKey,
} from '../../GradeSheets/Components/types';
import StudentCombobox from './StudentCombobox';
import type { StudentOption } from './StudentCombobox';

type Props =
    | {
          mode: 'create';
          gradeSheet: GradeSheetSummary;
          /** Enrolled students not on the sheet yet. */
          students: StudentOption[];
      }
    | {
          mode: 'edit';
          gradeSheet: GradeSheetSummary;
          studentGrade: StudentGradeRow;
      };

type FormData = {
    enrollment_id: number | null;
    term_1: string;
    term_2: string;
    term_3: string;
    add_another: boolean;
};

const inputClass =
    'min-h-11 w-full rounded-lg border border-ink/15 bg-surface px-3 py-2 text-right text-base text-ink tabular-nums placeholder-ink/35 focus:border-brand focus:ring-2 focus:ring-brand/30 focus:outline-none aria-[invalid=true]:border-danger sm:text-sm';

/** The average of the three terms once all are in, as the server works it out. */
function finalGrade(data: FormData): number | null {
    const grades = TERMS.map((term) => data[term.key]);

    if (grades.some((grade) => grade.trim() === '' || isNaN(Number(grade)))) {
        return null;
    }

    const average =
        grades.reduce((sum, grade) => sum + Number(grade), 0) / grades.length;

    return Math.round(average * 100) / 100;
}

/**
 * Adds a student to a grade sheet, or edits their grades: the student on
 * the left (picked from a searchable list when adding), Term 1–3 on the
 * right, with the final grade worked out as they type.
 */
export default function StudentGradeForm(props: Props) {
    const { gradeSheet } = props;
    const isEditing = props.mode === 'edit';
    const { props: pageProps } = usePage<{ flash?: { success?: string } }>();

    const form = useForm<FormData>({
        enrollment_id: isEditing ? props.studentGrade.enrollment_id : null,
        term_1: isEditing ? (props.studentGrade.term_1 ?? '') : '',
        term_2: isEditing ? (props.studentGrade.term_2 ?? '') : '',
        term_3: isEditing ? (props.studentGrade.term_3 ?? '') : '',
        add_another: false,
    });
    const { data, setData, errors, processing } = form;

    const final = finalGrade(data);
    const sheetUrl = gradeSheetRoutes.show.url(gradeSheet.id);

    const submit = (addAnother: boolean) => (e?: FormEvent) => {
        e?.preventDefault();

        if (props.mode === 'edit') {
            form.transform(({ term_1, term_2, term_3 }) => ({
                term_1,
                term_2,
                term_3,
            }));
            form.put(studentGradeRoutes.update.url(props.studentGrade.id));

            return;
        }

        form.transform((current) => ({ ...current, add_another: addAnother }));
        form.post(gradeSheetRoutes.studentGrades.store.url(gradeSheet.id), {
            onSuccess: () => form.reset(),
        });
    };

    const title = isEditing ? 'Edit Student Grades' : 'Add Student Grades';
    const noStudentsLeft =
        props.mode === 'create' && props.students.length === 0;

    return (
        <>
            <Head title={`${title} · ${gradeSheet.number}`} />

            <div className="bg-cream px-4 py-8">
                <div className="mx-auto max-w-5xl">
                    <Link
                        href={sheetUrl}
                        className="mb-4 inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-ink/70 hover:text-ink"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Grade Sheet {gradeSheet.number}
                    </Link>

                    <h1 className="font-serif text-2xl font-semibold text-ink">
                        {title}
                    </h1>
                    <p className="mb-6 text-sm text-ink/70">
                        {gradeSheet.subject} · {gradeSheet.grade_level} · SY{' '}
                        {gradeSheet.school_year} · {gradeSheet.teacher}
                    </p>

                    {pageProps.flash?.success && (
                        <div
                            role="status"
                            className="mb-4 rounded-xl border border-brand/25 bg-brand/5 px-4 py-3 text-sm text-brand-ink"
                        >
                            {pageProps.flash.success}
                        </div>
                    )}

                    <form
                        onSubmit={submit(false)}
                        className="rounded-2xl border border-ink/10 bg-surface"
                    >
                        <div className="grid grid-cols-1 divide-y divide-ink/10 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
                            <section className="p-5 sm:p-6">
                                <h2 className="mb-1 text-sm font-semibold text-ink">
                                    Student
                                </h2>
                                <p className="mb-4 text-xs text-ink/60">
                                    {isEditing
                                        ? 'The student on this row.'
                                        : 'Students approved for this grade level and taking this subject.'}
                                </p>

                                <label
                                    htmlFor="student"
                                    className="mb-1 block text-sm font-medium text-ink/80"
                                >
                                    Name
                                </label>
                                {props.mode === 'edit' ? (
                                    <div className="flex min-h-11 items-center gap-3 rounded-lg border border-ink/10 bg-ink/[0.03] px-3 py-2">
                                        <UserRound
                                            className="h-4 w-4 shrink-0 text-ink/50"
                                            aria-hidden="true"
                                        />
                                        <span className="min-w-0">
                                            <span
                                                id="student"
                                                className="block truncate text-sm font-medium text-ink"
                                            >
                                                {
                                                    props.studentGrade
                                                        .student_name
                                                }
                                            </span>
                                            <span className="block text-xs text-ink/55">
                                                {props.studentGrade.lrn
                                                    ? `LRN ${props.studentGrade.lrn}`
                                                    : 'No LRN yet'}
                                            </span>
                                        </span>
                                    </div>
                                ) : noStudentsLeft ? (
                                    <p className="rounded-lg border border-dashed border-ink/15 px-3 py-4 text-sm text-ink/65">
                                        Every approved student taking this
                                        subject is already on the grade sheet.
                                    </p>
                                ) : (
                                    <StudentCombobox
                                        id="student"
                                        students={props.students}
                                        value={data.enrollment_id}
                                        onChange={(enrollmentId) =>
                                            setData(
                                                'enrollment_id',
                                                enrollmentId,
                                            )
                                        }
                                        invalid={!!errors.enrollment_id}
                                        describedBy={
                                            errors.enrollment_id
                                                ? 'student-error'
                                                : undefined
                                        }
                                    />
                                )}
                                {errors.enrollment_id && (
                                    <p
                                        id="student-error"
                                        className="mt-1 text-xs text-danger-ink"
                                    >
                                        {errors.enrollment_id}
                                    </p>
                                )}
                            </section>

                            <section className="p-5 sm:p-6">
                                <h2 className="mb-1 text-sm font-semibold text-ink">
                                    Grades
                                </h2>
                                <p className="mb-4 text-xs text-ink/60">
                                    0–100, up to two decimals. Leave a term
                                    blank until it's graded.
                                </p>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                    {TERMS.map((term) => {
                                        const key: TermKey = term.key;
                                        const inputId = `grade-${key}`;

                                        return (
                                            <div key={key}>
                                                <label
                                                    htmlFor={inputId}
                                                    className="mb-1 block text-sm font-medium text-ink/80"
                                                >
                                                    {term.label}
                                                </label>
                                                <input
                                                    id={inputId}
                                                    type="number"
                                                    inputMode="decimal"
                                                    min={0}
                                                    max={100}
                                                    step="0.01"
                                                    placeholder="—"
                                                    value={data[key]}
                                                    onChange={(e) =>
                                                        setData(
                                                            key,
                                                            e.target.value,
                                                        )
                                                    }
                                                    aria-invalid={!!errors[key]}
                                                    aria-describedby={
                                                        errors[key]
                                                            ? `${inputId}-error`
                                                            : undefined
                                                    }
                                                    className={inputClass}
                                                />
                                                {errors[key] && (
                                                    <p
                                                        id={`${inputId}-error`}
                                                        className="mt-1 text-xs text-danger-ink"
                                                    >
                                                        {errors[key]}
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                <div
                                    aria-live="polite"
                                    className="mt-5 flex items-center justify-between rounded-xl bg-ink/[0.03] px-4 py-3"
                                >
                                    <span className="text-sm text-ink/70">
                                        Final grade
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <span className="font-semibold text-ink tabular-nums">
                                            {formatGrade(final)}
                                        </span>
                                        {final !== null && (
                                            <span
                                                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                    final >= PASSING_GRADE
                                                        ? 'bg-brand/10 text-brand-ink'
                                                        : 'bg-danger/10 text-danger-strong'
                                                }`}
                                            >
                                                {final >= PASSING_GRADE
                                                    ? 'Passed'
                                                    : 'Failed'}
                                            </span>
                                        )}
                                    </span>
                                </div>
                            </section>
                        </div>

                        <div className="flex flex-col-reverse gap-2 border-t border-ink/10 p-5 sm:flex-row sm:justify-end sm:p-6">
                            <Link
                                href={sheetUrl}
                                className="inline-flex min-h-11 items-center justify-center rounded-full border border-ink/15 px-5 text-sm font-semibold text-ink/80 hover:bg-ink/5"
                            >
                                Cancel
                            </Link>
                            {!isEditing && (
                                <button
                                    type="button"
                                    onClick={() => submit(true)()}
                                    disabled={processing || noStudentsLeft}
                                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-brand/30 px-5 text-sm font-semibold text-brand-ink hover:bg-brand/5 disabled:opacity-50"
                                >
                                    Save &amp; add another
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={processing || noStudentsLeft}
                                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-deep disabled:opacity-50"
                            >
                                {processing && (
                                    <Loader2
                                        className="h-4 w-4 animate-spin"
                                        aria-hidden="true"
                                    />
                                )}
                                {isEditing ? 'Save changes' : 'Save'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
