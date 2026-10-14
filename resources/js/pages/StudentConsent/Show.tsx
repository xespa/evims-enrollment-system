import { Head, Link, useForm } from '@inertiajs/react';
import { CheckCircle2, Clock, ShieldCheck, ShieldX } from 'lucide-react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import PortalAuthShell from '@/components/portal-auth-shell';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { login } from '@/routes';
import { update as answerConsent } from '@/routes/student-consent';

type ConsentRequest = {
    student_name: string;
    lrn: string;
    grade_level: string | null;
    school_year: string | null;
    expires_at: string | null;
};

type Result = {
    agreed: boolean;
    student_first_name: string;
    lrn: string | null;
};

type Props = {
    token?: string;
    /** Null when the link is wrong, already used, or expired. */
    request: ConsentRequest | null;
    /** Set right after the parent answers. */
    result: Result | null;
};

type Decision = 'agree' | 'decline';

const INPUT_CLASS =
    'h-11 border-[#1F2A24]/15 focus-visible:border-[#2F6F4E] focus-visible:ring-[#2F6F4E]/30';

const LABEL_CLASS = 'mb-1 block text-sm font-medium text-[#1F2A24]/80';

function Outcome({ result }: { result: Result }) {
    return result.agreed ? (
        <div className="space-y-4 text-sm text-[#1F2A24]/80">
            <div className="flex items-start gap-3 rounded-xl border border-[#2F6F4E]/20 bg-[#2F6F4E]/5 p-4">
                <CheckCircle2
                    className="mt-0.5 h-5 w-5 shrink-0 text-[#2F6F4E]"
                    aria-hidden="true"
                />
                <p>
                    Thank you. {result.student_first_name}'s account is now
                    active.
                </p>
            </div>
            <p>
                {result.student_first_name} signs in with their LRN
                {result.lrn && (
                    <>
                        {' '}
                        (<span className="font-semibold">{result.lrn}</span>)
                    </>
                )}
                . Their first password is also their LRN. Please help them
                change it right after signing in, since others may know it.
            </p>
            <Link
                href={login({ query: { role: 'STUDENT' } }).url}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#2F6F4E] px-5 text-sm font-semibold text-[#FBF8F2] hover:bg-[#25573E]"
            >
                Go to student sign in
            </Link>
        </div>
    ) : (
        <div className="flex items-start gap-3 rounded-xl border border-[#1F2A24]/10 bg-[#1F2A24]/[0.03] p-4 text-sm text-[#1F2A24]/80">
            <ShieldX
                className="mt-0.5 h-5 w-5 shrink-0 text-[#1F2A24]/60"
                aria-hidden="true"
            />
            <p>
                You declined, so no account was created for{' '}
                {result.student_first_name}. If you change your mind, ask the
                registrar to send a new request.
            </p>
        </div>
    );
}

function ConsentForm({
    token,
    request,
}: {
    token: string;
    request: ConsentRequest;
}) {
    const { data, setData, put, processing, errors } = useForm({
        decision: '' as Decision | '',
        parent_name: '',
        consent: false,
    });

    const agrees = data.decision === 'agree';

    const submit = (e: FormEvent) => {
        e.preventDefault();
        put(answerConsent(token).url, { preserveScroll: true });
    };

    const choices: {
        value: Decision;
        label: string;
        description: string;
        icon: typeof ShieldCheck;
    }[] = [
        {
            value: 'agree',
            label: 'I agree',
            description: 'Create the account for your child.',
            icon: ShieldCheck,
        },
        {
            value: 'decline',
            label: 'I decline',
            description: 'No account will be created.',
            icon: ShieldX,
        },
    ];

    return (
        <form onSubmit={submit} className="space-y-5">
            <dl className="grid grid-cols-2 gap-3 rounded-xl border border-[#1F2A24]/10 bg-[#FBF8F2] p-4 text-sm">
                <div className="col-span-2">
                    <dt className="text-xs text-[#1F2A24]/60">Student</dt>
                    <dd className="font-semibold text-[#1F2A24]">
                        {request.student_name}
                    </dd>
                </div>
                <div>
                    <dt className="text-xs text-[#1F2A24]/60">LRN</dt>
                    <dd className="text-[#1F2A24] tabular-nums">
                        {request.lrn}
                    </dd>
                </div>
                <div>
                    <dt className="text-xs text-[#1F2A24]/60">Class</dt>
                    <dd className="text-[#1F2A24]">
                        {request.grade_level ?? '—'}
                        {request.school_year && ` · SY ${request.school_year}`}
                    </dd>
                </div>
            </dl>

            <div className="space-y-2 text-sm leading-relaxed text-[#1F2A24]/80">
                <p className="font-medium text-[#1F2A24]">
                    What the account is for
                </p>
                <ul className="list-disc space-y-1 pl-5">
                    <li>
                        Your child signs in with their LRN to see their grades.
                    </li>
                    <li>
                        Teachers record grades against the account, so they
                        reach the right student.
                    </li>
                    <li>
                        It holds only school records: name, LRN, class and
                        grades.
                    </li>
                </ul>
            </div>

            <fieldset>
                <legend className={LABEL_CLASS}>Your answer</legend>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {choices.map((choice) => {
                        const Icon = choice.icon;
                        const isSelected = data.decision === choice.value;

                        return (
                            <label
                                key={choice.value}
                                className={cn(
                                    'flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors focus-within:ring-2 focus-within:ring-[#2F6F4E]/30',
                                    isSelected
                                        ? 'border-[#2F6F4E] bg-[#2F6F4E]/5'
                                        : 'border-[#1F2A24]/15 hover:bg-[#1F2A24]/[0.03]',
                                )}
                            >
                                <input
                                    type="radio"
                                    name="decision"
                                    value={choice.value}
                                    checked={isSelected}
                                    onChange={() =>
                                        setData('decision', choice.value)
                                    }
                                    className="mt-1 h-4 w-4 shrink-0 accent-[#2F6F4E]"
                                />
                                <span>
                                    <span className="flex items-center gap-1.5 text-sm font-semibold text-[#1F2A24]">
                                        <Icon
                                            className="h-4 w-4 text-[#2F6F4E]"
                                            aria-hidden="true"
                                        />
                                        {choice.label}
                                    </span>
                                    <span className="block text-xs text-[#1F2A24]/65">
                                        {choice.description}
                                    </span>
                                </span>
                            </label>
                        );
                    })}
                </div>
                <InputError message={errors.decision} />
            </fieldset>

            {data.decision && (
                <div>
                    <Label htmlFor="parent_name" className={LABEL_CLASS}>
                        Your full name (parent or guardian)
                    </Label>
                    <Input
                        id="parent_name"
                        value={data.parent_name}
                        onChange={(e) => setData('parent_name', e.target.value)}
                        autoComplete="name"
                        required
                        aria-invalid={errors.parent_name ? true : undefined}
                        className={INPUT_CLASS}
                    />
                    <InputError message={errors.parent_name} />
                </div>
            )}

            {agrees && (
                <>
                    <p className="rounded-xl border border-[#E8A33D]/30 bg-[#E8A33D]/10 p-3 text-sm text-[#7a4d0b]">
                        Your child's first password will be their LRN (
                        <span className="font-semibold tabular-nums">
                            {request.lrn}
                        </span>
                        ). They'll be reminded to change it after signing in.
                    </p>
                    <label className="flex items-start gap-3 rounded-xl border border-[#1F2A24]/10 bg-[#FBF8F2] p-3 text-sm text-[#1F2A24]">
                        <input
                            type="checkbox"
                            checked={data.consent}
                            onChange={(e) =>
                                setData('consent', e.target.checked)
                            }
                            aria-invalid={errors.consent ? true : undefined}
                            className="mt-0.5 h-4 w-4 shrink-0 accent-[#2F6F4E]"
                        />
                        <span>
                            As {request.student_name}'s parent or guardian, I
                            consent to the school creating this student account.
                        </span>
                    </label>
                    <InputError message={errors.consent} />
                </>
            )}

            <button
                type="submit"
                disabled={!data.decision || processing}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#2F6F4E] px-5 text-sm font-semibold text-[#FBF8F2] shadow-sm transition-colors hover:bg-[#25573E] disabled:opacity-50"
            >
                {processing && <Spinner />}
                {data.decision === 'decline'
                    ? 'Decline the account'
                    : 'Give consent and create the account'}
            </button>
        </form>
    );
}

/**
 * Where a parent answers the emailed request for their child's student
 * account.
 */
export default function Show({ token, request, result }: Props) {
    return (
        <>
            <Head title="Student account consent" />

            <PortalAuthShell
                title={
                    result
                        ? result.agreed
                            ? 'Account created'
                            : 'Request declined'
                        : 'Your consent is needed'
                }
                description={
                    result
                        ? 'Your answer has been recorded.'
                        : request
                          ? 'The school would like to create a student account for your child.'
                          : 'This link can no longer be used.'
                }
            >
                {result && <Outcome result={result} />}

                {!result && request && token && (
                    <ConsentForm token={token} request={request} />
                )}

                {!result && !request && (
                    <div className="flex items-start gap-3 rounded-xl border border-[#E8A33D]/30 bg-[#E8A33D]/10 p-4 text-sm text-[#7a4d0b]">
                        <Clock
                            className="mt-0.5 h-5 w-5 shrink-0"
                            aria-hidden="true"
                        />
                        <p>
                            The link has expired or was already used. If you
                            still need to respond, ask the registrar to send a
                            new consent email.
                        </p>
                    </div>
                )}
            </PortalAuthShell>
        </>
    );
}
