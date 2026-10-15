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
            <div className="flex min-h-[70vh] items-center justify-center bg-cream px-4 py-12">
                <div
                    role="status"
                    className="w-full max-w-md rounded-3xl border border-ink/10 bg-surface p-7 text-center shadow-lg shadow-shade/5"
                >
                    <span
                        className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ${
                            isRejected
                                ? 'bg-danger/10 text-danger-ink'
                                : 'bg-warn/15 text-warn-ink'
                        }`}
                    >
                        {isRejected ? (
                            <CircleAlert className="h-6 w-6" aria-hidden="true" />
                        ) : (
                            <Clock className="h-6 w-6" aria-hidden="true" />
                        )}
                    </span>

                    <h1 className="font-serif text-2xl font-semibold text-ink">
                        {isRejected
                            ? "Your account isn't verified"
                            : 'Your account is being verified'}
                    </h1>
                    <p className="mt-2 text-sm text-ink/70">
                        {isRejected
                            ? "The school couldn't verify your account, so you can't submit an enrollment application yet. See what needs fixing and try again."
                            : "You can't submit an enrollment application until the school verifies your account. We'll email you as soon as it's approved — usually within a few school days."}
                    </p>

                    <ol className="mt-5 space-y-2 rounded-xl bg-cream p-4 text-left text-sm">
                        {STEPS.map((step, index) => {
                            const isDone = index === 0;
                            const isCurrent = index === 1;

                            return (
                                <li key={step} className="flex items-start gap-2.5">
                                    <span
                                        className={`mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                                            isDone
                                                ? 'bg-brand text-white'
                                                : isCurrent
                                                  ? isRejected
                                                      ? 'bg-danger text-white'
                                                      : 'bg-warn text-white'
                                                  : 'bg-ink/10 text-ink/60'
                                        }`}
                                        aria-hidden="true"
                                    >
                                        {isDone ? '✓' : index + 1}
                                    </span>
                                    <span
                                        className={
                                            isCurrent
                                                ? 'font-medium text-ink'
                                                : 'text-ink/70'
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
                        className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-brand px-4 text-sm font-semibold text-on-brand transition-colors hover:bg-brand-deep"
                    >
                        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                        {isRejected ? 'See what to fix' : 'Check my account status'}
                    </Link>
                </div>
            </div>
        </>
    );
}
