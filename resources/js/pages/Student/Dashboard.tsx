import { Head, router, usePage } from '@inertiajs/react';
import {
    ArrowLeftRight,
    CalendarDays,
    CheckCircle2,
    Download,
    Eye,
    GraduationCap,
    IdCard,
    KeyRound,
    Settings,
    ShieldAlert,
    ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import Metric from '@/components/portal/metric';
import ChangePasswordDialog from '@/components/student/change-password-dialog';
import GradeReport from '@/components/student/grade-report';
import type { SubjectGrade } from '@/components/student/grade-report';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { logout } from '@/routes/student';
import gradeReport from '@/routes/student/grade-report';

type Props = {
    student: {
        first_name: string;
        last_name: string;
        lrn: string;
        grade_level: string | null;
        school_year: string | null;
    };
    /** Still signing in with the starting password, their LRN. */
    usesDefaultPassword: boolean;
    /** The school reset the password; a new one is needed before anything else. */
    mustChangePassword: boolean;
    /** This school year's grades from the teachers' grade sheets. */
    grades: SubjectGrade[];
    generalAverage: number | null;
};

const PDF_LINK_CLASS =
    'inline-flex min-h-11 items-center gap-1.5 rounded-full border border-[#2F6F4E]/30 bg-white px-4 py-2 text-sm font-semibold text-[#2F6F4E] shadow-sm transition-colors hover:bg-[#2F6F4E]/5 focus-visible:ring-2 focus-visible:ring-[#2F6F4E]/40 focus-visible:ring-offset-2 focus-visible:outline-none';

const MENU_ITEM_CLASS =
    'min-h-10 cursor-pointer rounded-lg focus:bg-[#2F6F4E]/10 focus:text-[#2F6F4E]';

/** The signed-in student's home, laid out like the parent portal's profile. */
export default function Dashboard({
    student,
    usesDefaultPassword,
    mustChangePassword,
    grades,
    generalAverage,
}: Props) {
    const flashSuccess = usePage().props.flash?.success;
    // Opens straight away after a reset, since nothing else is shown until then.
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] =
        useState(mustChangePassword);

    const initials =
        `${student.first_name[0] ?? ''}${student.last_name[0] ?? ''}`.toUpperCase();
    const needsNewPassword = mustChangePassword || usesDefaultPassword;

    return (
        <div className="mx-auto max-w-5xl px-4 pb-16">
            <Head title="My Profile" />
            <ChangePasswordDialog
                open={isPasswordDialogOpen}
                onOpenChange={setIsPasswordDialogOpen}
                mustChangePassword={mustChangePassword}
            />

            <div className="-mx-4 mb-6 h-28 bg-gradient-to-r from-[#2F6F4E] to-[#25573E] sm:h-36" />

            <div className="-mt-16 flex flex-col gap-4 sm:-mt-20 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end">
                    <div
                        aria-hidden="true"
                        className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-[#FBF8F2] bg-[#2F6F4E] text-2xl font-semibold text-white shadow-sm sm:h-32 sm:w-32 sm:text-3xl"
                    >
                        {initials}
                    </div>
                    <div className="pb-1 text-center sm:text-left">
                        <h1 className="font-serif text-xl font-semibold text-[#1F2A24] sm:text-2xl">
                            {student.first_name} {student.last_name}
                        </h1>
                        <p className="text-sm text-[#1F2A24]/70">
                            Student · LRN{' '}
                            <span className="tabular-nums">{student.lrn}</span>
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap justify-center gap-2 sm:justify-end">
                    <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-[#2F6F4E] px-5 py-2 text-sm font-semibold text-[#FBF8F2] shadow-sm transition-colors hover:bg-[#25573E] focus-visible:ring-2 focus-visible:ring-[#2F6F4E]/40 focus-visible:ring-offset-2 focus-visible:outline-none">
                            <Settings className="h-4 w-4" aria-hidden="true" />
                            Settings
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            sideOffset={8}
                            className="w-56 rounded-xl border-[#1F2A24]/10 bg-white p-1.5 text-[#1F2A24] shadow-lg"
                        >
                            <DropdownMenuItem
                                className={MENU_ITEM_CLASS}
                                onSelect={() => setIsPasswordDialogOpen(true)}
                            >
                                <KeyRound aria-hidden="true" />
                                Change password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-[#1F2A24]/10" />
                            <DropdownMenuItem
                                className={MENU_ITEM_CLASS}
                                onSelect={() =>
                                    router.post(logout().url, {
                                        switch_account: 1,
                                    })
                                }
                            >
                                <ArrowLeftRight aria-hidden="true" />
                                Switch account
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <button
                        type="button"
                        onClick={() => router.post(logout().url)}
                        className="min-h-11 rounded-full border border-[#1F2A24]/15 bg-white px-5 py-2 text-sm font-semibold text-[#1F2A24]/70 shadow-sm transition-colors hover:bg-[#1F2A24]/5"
                    >
                        Log Out
                    </button>
                </div>
            </div>

            <div className="mt-6 space-y-3">
                {flashSuccess && (
                    <div
                        role="status"
                        className="flex items-start gap-2 rounded-xl border border-[#2F6F4E]/25 bg-[#2F6F4E]/5 px-4 py-3 text-sm text-[#2F6F4E]"
                    >
                        <CheckCircle2
                            className="mt-0.5 h-4 w-4 shrink-0"
                            aria-hidden="true"
                        />
                        {flashSuccess}
                    </div>
                )}

                {needsNewPassword && (
                    <div
                        role="alert"
                        className="flex flex-col gap-3 rounded-xl border border-[#E8A33D]/40 bg-[#E8A33D]/10 px-4 py-3 text-sm text-[#7a4d0b] sm:flex-row sm:items-center sm:justify-between"
                    >
                        <p className="flex items-start gap-2">
                            <ShieldAlert
                                className="mt-0.5 h-4 w-4 shrink-0"
                                aria-hidden="true"
                            />
                            {mustChangePassword ? (
                                <span>
                                    <span className="font-semibold">
                                        The school reset your password.
                                    </span>{' '}
                                    Choose a new one to keep using your account.
                                </span>
                            ) : (
                                <span>
                                    <span className="font-semibold">
                                        Your password is still your LRN.
                                    </span>{' '}
                                    Others can know your LRN, so change it to
                                    one only you know.
                                </span>
                            )}
                        </p>
                        <button
                            type="button"
                            onClick={() => setIsPasswordDialogOpen(true)}
                            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-[#2F6F4E] px-4 text-sm font-semibold text-[#FBF8F2] hover:bg-[#25573E]"
                        >
                            Change password
                        </button>
                    </div>
                )}
            </div>

            <section aria-label="Account summary" className="mt-4">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <Metric
                        icon={GraduationCap}
                        label="Grade level"
                        value={student.grade_level ?? '—'}
                    />
                    <Metric
                        icon={CalendarDays}
                        label="School year"
                        value={student.school_year ?? '—'}
                    />
                    <Metric icon={IdCard} label="LRN" value={student.lrn} />
                    <Metric
                        icon={needsNewPassword ? ShieldAlert : ShieldCheck}
                        label="Password"
                        value={needsNewPassword ? 'Change needed' : 'Secure'}
                        emphasis={needsNewPassword}
                    />
                </div>
            </section>

            {!mustChangePassword && (
                <section aria-labelledby="grades-heading" className="mt-8">
                    <div className="flex items-center justify-between gap-3 border-b border-[#1F2A24]/10 pb-3">
                        <h2
                            id="grades-heading"
                            className="text-sm font-medium text-[#2F6F4E]"
                        >
                            My grades
                        </h2>
                        {/* PDFs, so plain links rather than Inertia visits. */}
                        <div className="flex flex-wrap justify-end gap-2">
                            <a
                                href={gradeReport.show.url()}
                                target="_blank"
                                rel="noopener"
                                className={PDF_LINK_CLASS}
                            >
                                <Eye className="h-4 w-4" aria-hidden="true" />
                                View PDF
                                <span className="sr-only">
                                    (opens in a new tab)
                                </span>
                            </a>
                            <a
                                href={gradeReport.download.url()}
                                className={PDF_LINK_CLASS}
                            >
                                <Download
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                />
                                Download PDF
                            </a>
                        </div>
                    </div>
                    <div className="mt-6">
                        <GradeReport
                            grades={grades}
                            generalAverage={generalAverage}
                        />
                    </div>
                </section>
            )}
        </div>
    );
}
