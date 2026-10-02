import { Head, Link } from '@inertiajs/react';
import { CircleAlert, Clock, ShieldCheck } from 'lucide-react';

type Props = {
    status: 'PENDING' | 'REJECTED';
};

const STEPS = [
    'Create your account and confirm your email',
    'The school checks your valid ID and approves your account',
    'Submit an enrollment application for each child',
];

/**
 * Shown on the admission page, in place of the form, to accounts the
 * school hasn't approved — they can't submit an application yet.
 */
export default function AccountNotApprovedNotice({ status }: Props) {
    const isRejected = status === 'REJECTED';

    return (
        <>
            <Head title="Enrollment Application" />
            <div className="flex min-h-[70vh] items-center justify-center bg-[#FBF8F2] px-4 py-12">
                <div
                    role="status"
                    className="w-full max-w-md rounded-3xl border border-[#1F2A24]/10 bg-white p-7 text-center shadow-lg shadow-[#1F2A24]/5"
                >
                    <span
                        className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ${
                            isRejected
                                ? 'bg-[#C6473B]/10 text-[#C6473B]'
                                : 'bg-[#E8A33D]/15 text-[#a4670f]'
                        }`}
                    >
                        {isRejected ? (
                            <CircleAlert className="h-6 w-6" aria-hidden="true" />
                        ) : (
                            <Clock className="h-6 w-6" aria-hidden="true" />
                        )}
                    </span>

                    <h1 className="font-serif text-2xl font-semibold text-[#1F2A24]">
                        {isRejected
                            ? "Your account isn't verified"
                            : 'Your account is being verified'}
                    </h1>
                    <p className="mt-2 text-sm text-[#1F2A24]/70">
                        {isRejected
                            ? "The school couldn't verify your account, so you can't submit an enrollment application yet. See what needs fixing and try again."
                            : "You can't submit an enrollment application until the school verifies your account. We'll email you as soon as it's approved — usually within a few school days."}
                    </p>

                    <ol className="mt-5 space-y-2 rounded-xl bg-[#FBF8F2] p-4 text-left text-sm">
                        {STEPS.map((step, index) => {
                            const isDone = index === 0;
                            const isCurrent = index === 1;

                            return (
                                <li key={step} className="flex items-start gap-2.5">
                                    <span
                                        className={`mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                                            isDone
                                                ? 'bg-[#2F6F4E] text-white'
                                                : isCurrent
                                                  ? isRejected
                                                      ? 'bg-[#C6473B] text-white'
                                                      : 'bg-[#E8A33D] text-white'
                                                  : 'bg-[#1F2A24]/10 text-[#1F2A24]/60'
                                        }`}
                                        aria-hidden="true"
                                    >
                                        {isDone ? '✓' : index + 1}
                                    </span>
                                    <span
                                        className={
                                            isCurrent
                                                ? 'font-medium text-[#1F2A24]'
                                                : 'text-[#1F2A24]/70'
                                        }
                                    >
                                        {step}
                                        {isCurrent && (
                                            <span className="sr-only">
                                                {' '}
                                                (current step)
                                            </span>
                                        )}
                                    </span>
                                </li>
                            );
                        })}
                    </ol>

                    <Link
                        href={route('portal.account-status')}
                        className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#2F6F4E] px-4 text-sm font-semibold text-[#FBF8F2] transition-colors hover:bg-[#25573E]"
                    >
                        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                        {isRejected ? 'See what to fix' : 'Check my account status'}
                    </Link>
                </div>
            </div>
        </>
    );
}
