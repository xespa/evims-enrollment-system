import { Form, Head, router, usePage } from '@inertiajs/react';
import { BookOpenCheck, CheckCircle2, KeyRound, LogOut } from 'lucide-react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { logout } from '@/routes/student';
import { update as updatePassword } from '@/routes/student/password';

type Props = {
    student: {
        first_name: string;
        last_name: string;
        lrn: string;
        grade_level: string | null;
        school_year: string | null;
    };
};

const INPUT_CLASS =
    'h-11 border-[#1F2A24]/15 focus-visible:border-[#2F6F4E] focus-visible:ring-[#2F6F4E]/30';

const LABEL_CLASS = 'mb-1 block text-sm font-medium text-[#1F2A24]/80';

/** The signed-in student's home. Grades appear here once teachers post them. */
export default function Dashboard({ student }: Props) {
    const flashSuccess = usePage().props.flash?.success;

    return (
        <>
            <Head title="My account" />

            <div className="bg-[#FBF8F2] px-4 py-8">
                <div className="mx-auto max-w-3xl space-y-4">
                    <header className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <p className="text-sm text-[#1F2A24]/65">
                                Welcome back,
                            </p>
                            <h1 className="font-serif text-2xl font-semibold text-[#1F2A24]">
                                {student.first_name} {student.last_name}
                            </h1>
                            <p className="mt-1 text-sm text-[#1F2A24]/65">
                                LRN{' '}
                                <span className="font-medium text-[#1F2A24] tabular-nums">
                                    {student.lrn}
                                </span>
                                {student.grade_level &&
                                    ` · ${student.grade_level}`}
                                {student.school_year &&
                                    ` · SY ${student.school_year}`}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => router.post(logout().url)}
                            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#1F2A24]/15 bg-white px-4 text-sm font-semibold text-[#1F2A24]/75 transition-colors hover:bg-[#1F2A24]/5"
                        >
                            <LogOut className="h-4 w-4" aria-hidden="true" />
                            Sign out
                        </button>
                    </header>

                    {flashSuccess && (
                        <div
                            role="status"
                            className="flex items-center gap-2 rounded-xl border border-[#2F6F4E]/25 bg-[#2F6F4E]/5 px-4 py-3 text-sm text-[#2F6F4E]"
                        >
                            <CheckCircle2
                                className="h-4 w-4 shrink-0"
                                aria-hidden="true"
                            />
                            {flashSuccess}
                        </div>
                    )}

                    <section
                        aria-labelledby="grades-heading"
                        className="rounded-2xl border border-[#1F2A24]/10 bg-white p-5"
                    >
                        <h2
                            id="grades-heading"
                            className="text-xs font-semibold tracking-[0.1em] text-[#2F6F4E] uppercase"
                        >
                            My grades
                        </h2>
                        <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                            <BookOpenCheck
                                className="h-9 w-9 text-[#1F2A24]/25"
                                aria-hidden="true"
                            />
                            <p className="font-medium text-[#1F2A24]">
                                No grades posted yet
                            </p>
                            <p className="max-w-sm text-sm text-[#1F2A24]/60">
                                Your grades will show here once your teachers
                                post them.
                            </p>
                        </div>
                    </section>

                    <section
                        aria-labelledby="password-heading"
                        className="rounded-2xl border border-[#1F2A24]/10 bg-white p-5"
                    >
                        <h2
                            id="password-heading"
                            className="mb-1 flex items-center gap-2 text-xs font-semibold tracking-[0.1em] text-[#2F6F4E] uppercase"
                        >
                            <KeyRound className="h-4 w-4" aria-hidden="true" />
                            Change password
                        </h2>
                        <p className="mb-4 text-sm text-[#1F2A24]/65">
                            Replace the password your parent or guardian set
                            with one only you know.
                        </p>
                        <Form
                            {...updatePassword.form()}
                            resetOnSuccess
                            options={{ preserveScroll: true }}
                            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div className="sm:col-span-2">
                                        <Label
                                            htmlFor="current_password"
                                            className={LABEL_CLASS}
                                        >
                                            Current password
                                        </Label>
                                        <PasswordInput
                                            id="current_password"
                                            name="current_password"
                                            required
                                            autoComplete="current-password"
                                            className={INPUT_CLASS}
                                        />
                                        <InputError
                                            message={errors.current_password}
                                        />
                                    </div>
                                    <div>
                                        <Label
                                            htmlFor="password"
                                            className={LABEL_CLASS}
                                        >
                                            New password
                                        </Label>
                                        <PasswordInput
                                            id="password"
                                            name="password"
                                            required
                                            autoComplete="new-password"
                                            className={INPUT_CLASS}
                                        />
                                        <InputError message={errors.password} />
                                    </div>
                                    <div>
                                        <Label
                                            htmlFor="password_confirmation"
                                            className={LABEL_CLASS}
                                        >
                                            Confirm new password
                                        </Label>
                                        <PasswordInput
                                            id="password_confirmation"
                                            name="password_confirmation"
                                            required
                                            autoComplete="new-password"
                                            className={INPUT_CLASS}
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#2F6F4E] px-5 text-sm font-semibold text-[#FBF8F2] transition-colors hover:bg-[#25573E] disabled:opacity-60"
                                        >
                                            {processing && <Spinner />}
                                            Change password
                                        </button>
                                    </div>
                                </>
                            )}
                        </Form>
                    </section>
                </div>
            </div>
        </>
    );
}
