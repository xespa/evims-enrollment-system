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
    'min-h-11 w-full rounded-lg border border-[#1F2A24]/15 bg-white px-3 py-2 text-right text-base text-[#1F2A24] tabular-nums placeholder-[#1F2A24]/35 focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none aria-[invalid=true]:border-[#C6473B] sm:text-sm';

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

            <div className="bg-[#FBF8F2] px-4 py-8">
                <div className="mx-auto max-w-5xl">
                    <Link
                        href={sheetUrl}
                        className="mb-4 inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-[#1F2A24]/70 hover:text-[#1F2A24]"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Grade Sheet {gradeSheet.number}
                    </Link>

                    <h1 className="font-serif text-2xl font-semibold text-[#1F2A24]">
                        {title}
                    </h1>
                    <p className="mb-6 text-sm text-[#1F2A24]/70">
                        {gradeSheet.subject} · {gradeSheet.grade_level} · SY{' '}
                        {gradeSheet.school_year} · {gradeSheet.teacher}
                    </p>

                    {pageProps.flash?.success && (
                        <div
                            role="status"
                            className="mb-4 rounded-xl border border-[#2F6F4E]/25 bg-[#2F6F4E]/5 px-4 py-3 text-sm text-[#2F6F4E]"
                        >
                            {pageProps.flash.success}
                        </div>
                    )}

                    <form
                        onSubmit={submit(false)}
                        className="rounded-2xl border border-[#1F2A24]/10 bg-white"
                    >
                        <div className="grid grid-cols-1 divide-y divide-[#1F2A24]/10 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
                            <section className="p-5 sm:p-6">
                                <h2 className="mb-1 text-sm font-semibold text-[#1F2A24]">
                                    Student
                                </h2>
                                <p className="mb-4 text-xs text-[#1F2A24]/60">
                                    {isEditing
                                        ? 'The student on this row.'
                                        : 'Students approved for this grade level and taking this subject.'}
                                </p>

                                <label
                                    htmlFor="student"
                                    className="mb-1 block text-sm font-medium text-[#1F2A24]/80"
                                >
                                    Name
                                </label>
                                {props.mode === 'edit' ? (
                                    <div className="flex min-h-11 items-center gap-3 rounded-lg border border-[#1F2A24]/10 bg-[#1F2A24]/[0.03] px-3 py-2">
                                        <UserRound
                                            className="h-4 w-4 shrink-0 text-[#1F2A24]/50"
                                            aria-hidden="true"
                                        />
                                        <span className="min-w-0">
                                            <span
                                                id="student"
                                                className="block truncate text-sm font-medium text-[#1F2A24]"
                                            >
                                                {
                                                    props.studentGrade
                                                        .student_name
                                                }
                                            </span>
                                            <span className="block text-xs text-[#1F2A24]/55">
                                                {props.studentGrade.lrn
                                                    ? `LRN ${props.studentGrade.lrn}`
                                                    : 'No LRN yet'}
                                            </span>
                                        </span>
                                    </div>
                                ) : noStudentsLeft ? (
                                    <p className="rounded-lg border border-dashed border-[#1F2A24]/15 px-3 py-4 text-sm text-[#1F2A24]/65">
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
                                        className="mt-1 text-xs text-[#C6473B]"
                                    >
                                        {errors.enrollment_id}
                                    </p>
                                )}
                            </section>

                            <section className="p-5 sm:p-6">
                                <h2 className="mb-1 text-sm font-semibold text-[#1F2A24]">
                                    Grades
                                </h2>
                                <p className="mb-4 text-xs text-[#1F2A24]/60">
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
                                                    className="mb-1 block text-sm font-medium text-[#1F2A24]/80"
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
                                                        className="mt-1 text-xs text-[#C6473B]"
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
                                    className="mt-5 flex items-center justify-between rounded-xl bg-[#1F2A24]/[0.03] px-4 py-3"
                                >
                                    <span className="text-sm text-[#1F2A24]/70">
                                        Final grade
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <span className="font-semibold text-[#1F2A24] tabular-nums">
                                            {formatGrade(final)}
                                        </span>
                                        {final !== null && (
                                            <span
                                                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                    final >= PASSING_GRADE
                                                        ? 'bg-[#2F6F4E]/10 text-[#2F6F4E]'
                                                        : 'bg-[#C6473B]/10 text-[#A3372D]'
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

                        <div className="flex flex-col-reverse gap-2 border-t border-[#1F2A24]/10 p-5 sm:flex-row sm:justify-end sm:p-6">
                            <Link
                                href={sheetUrl}
                                className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#1F2A24]/15 px-5 text-sm font-semibold text-[#1F2A24]/80 hover:bg-[#1F2A24]/5"
                            >
                                Cancel
                            </Link>
                            {!isEditing && (
                                <button
                                    type="button"
                                    onClick={() => submit(true)()}
                                    disabled={processing || noStudentsLeft}
                                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#2F6F4E]/30 px-5 text-sm font-semibold text-[#2F6F4E] hover:bg-[#2F6F4E]/5 disabled:opacity-50"
                                >
                                    Save &amp; add another
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={processing || noStudentsLeft}
                                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#2F6F4E] px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#25573E] disabled:opacity-50"
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
