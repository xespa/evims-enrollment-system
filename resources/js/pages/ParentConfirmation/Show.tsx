import { Head, useForm } from '@inertiajs/react';
import { CheckCircle2, Clock, ShieldCheck, ShieldX } from 'lucide-react';
import InputError from '@/components/input-error';
import PortalAuthShell from '@/components/portal-auth-shell';
import { Spinner } from '@/components/ui/spinner';
import { update as answer } from '@/routes/parent-confirmation';

type ConfirmationRequest = {
    student_name: string;
    student_email: string;
    expires_at: string | null;
};

type Result = {
    confirmed: boolean;
    student_name: string;
};

type Props = {
    token?: string;
    /** Null when the link is wrong, already used, or expired. */
    request: ConfirmationRequest | null;
    /** Set right after the parent answers. */
    result: Result | null;
};

type Decision = 'confirm' | 'decline';

function Outcome({ result }: { result: Result }) {
    return result.confirmed ? (
        <div className="flex items-start gap-3 rounded-xl border border-brand/20 bg-brand/5 p-4 text-sm text-ink/80">
            <CheckCircle2
                className="mt-0.5 h-5 w-5 shrink-0 text-brand-ink"
                aria-hidden="true"
            />
            <p>
                Thank you. The school will now review {result.student_name}'s
                account, and we'll email them once it's approved.
            </p>
        </div>
    ) : (
        <div className="flex items-start gap-3 rounded-xl border border-ink/10 bg-ink/[0.03] p-4 text-sm text-ink/80">
            <ShieldX
                className="mt-0.5 h-5 w-5 shrink-0 text-ink/60"
                aria-hidden="true"
            />
            <p>
                You declined, so the school won't review {result.student_name}'s
                account. We've let them know.
            </p>
        </div>
    );
}

function ConfirmationForm({
    token,
    request,
}: {
    token: string;
    request: ConfirmationRequest;
}) {
    const { transform, put, processing, errors } = useForm({
        decision: '' as Decision | '',
    });

    // Each button sends its own answer, so one press is enough.
    const respond = (decision: Decision) => {
        transform(() => ({ decision }));
        put(answer(token).url, { preserveScroll: true });
    };

    return (
        <div className="space-y-5">
            <dl className="space-y-3 rounded-xl border border-ink/10 bg-cream p-4 text-sm">
                <div>
                    <dt className="text-xs text-ink/60">Student</dt>
                    <dd className="font-semibold text-ink">
                        {request.student_name}
                    </dd>
                </div>
                <div>
                    <dt className="text-xs text-ink/60">Their email</dt>
                    <dd className="break-all text-ink">
                        {request.student_email}
                    </dd>
                </div>
            </dl>

            <div className="space-y-2 text-sm leading-relaxed text-ink/80">
                <p className="font-medium text-ink">
                    What the account is for
                </p>
                <ul className="list-disc space-y-1 pl-5">
                    <li>Applying for enrollment at EVIMS.</li>
                    <li>Uploading documents the school asks for.</li>
                    <li>Paying tuition online.</li>
                </ul>
                <p>
                    Confirm only if this is your child (or a student in your
                    care) and you're happy for them to use it.
                </p>
            </div>

            <InputError message={errors.decision} />

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                    type="button"
                    onClick={() => respond('decline')}
                    disabled={processing}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-ink/15 px-5 text-sm font-semibold text-ink/80 hover:bg-ink/5 disabled:opacity-50"
                >
                    <ShieldX className="h-4 w-4" aria-hidden="true" />
                    Decline
                </button>
                <button
                    type="button"
                    onClick={() => respond('confirm')}
                    disabled={processing}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-on-brand shadow-sm transition-colors hover:bg-brand-deep disabled:opacity-50"
                >
                    {processing ? (
                        <Spinner />
                    ) : (
                        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    )}
                    Confirm account
                </button>
            </div>
        </div>
    );
}

/**
 * Where a parent confirms or declines the portal account their child
 * created, from the emailed link.
 */
export default function Show({ token, request, result }: Props) {
    return (
        <>
            <Head title="Confirm student account" />

            <PortalAuthShell
                title={
                    result
                        ? result.confirmed
                            ? 'Account confirmed'
                            : 'Account declined'
                        : 'Please confirm your child’s account'
                }
                description={
                    result
                        ? 'Your answer has been recorded.'
                        : request
                          ? 'A student named you as their parent or guardian.'
                          : 'This link can no longer be used.'
                }
            >
                {result && <Outcome result={result} />}

                {!result && request && token && (
                    <ConfirmationForm token={token} request={request} />
                )}

                {!result && !request && (
                    <div className="flex items-start gap-3 rounded-xl border border-warn/30 bg-warn/10 p-4 text-sm text-warn-deep">
                        <Clock
                            className="mt-0.5 h-5 w-5 shrink-0"
                            aria-hidden="true"
                        />
                        <p>
                            The link has expired or was already used. If you
                            still need to respond, ask your child to send the
                            confirmation again from their account.
                        </p>
                    </div>
                )}
            </PortalAuthShell>
        </>
    );
}
