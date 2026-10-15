import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    Clock,
    FileCheck2,
    Upload,
    UserRoundCheck,
} from 'lucide-react';
import type { FormEvent } from 'react';
import AcceptedIdsDialog from '@/components/accepted-ids-dialog';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { update as updateParentEmail } from '@/routes/portal/parent-email';

type RejectionReason = {
    label: string;
    guidance: string;
};

type ParentConfirmation = {
    status: 'AWAITING' | 'CONFIRMED' | 'DECLINED' | null;
    email: string | null;
    isLinkExpired: boolean;
};

type Props = {
    status: 'PENDING' | 'REJECTED';
    rejectionReasons: RejectionReason[];
    rejectionNote: string | null;
    /** Pending again because a new ID was sent after a rejection. */
    hasResubmittedId: boolean;
    /** Only for student accounts, which a parent or guardian confirms. */
    parentConfirmation: ParentConfirmation | null;
};

/**
 * A student waiting on their parent or guardian: where the confirmation
 * stands, and a way to send it again (to the same or another email).
 */
function ParentConfirmationCard({
    parentConfirmation,
}: {
    parentConfirmation: ParentConfirmation;
}) {
    const { data, setData, put, processing, errors } = useForm({
        parent_email: parentConfirmation.email ?? '',
    });

    const isDeclined = parentConfirmation.status === 'DECLINED';

    const submit = (e: FormEvent) => {
        e.preventDefault();
        put(updateParentEmail.url(), { preserveScroll: true });
    };

    return (
        <form
            onSubmit={submit}
            className={`space-y-3 rounded-2xl border p-4 text-left text-sm ${
                isDeclined
                    ? 'border-danger/25 bg-danger/5'
                    : 'border-warn/30 bg-warn/10'
            }`}
        >
            <div className="flex items-start gap-2">
                <UserRoundCheck
                    className="mt-0.5 h-4 w-4 shrink-0 text-ink/70"
                    aria-hidden="true"
                />
                <div>
                    <p className="font-semibold text-ink">
                        {isDeclined
                            ? 'Your parent or guardian declined your account'
                            : 'Waiting for your parent or guardian'}
                    </p>
                    <p className="mt-0.5 text-ink/75">
                        {isDeclined
                            ? 'The school can only review your account once a parent or guardian confirms it. If this was a mistake, send the confirmation again.'
                            : parentConfirmation.isLinkExpired
                              ? `The link we sent to ${parentConfirmation.email} has expired. Send it again below.`
                              : parentConfirmation.email
                                ? `We emailed ${parentConfirmation.email} a link to confirm your account. The school reviews it once they do.`
                                : 'Enter your parent or guardian’s email so they can confirm your account.'}
                    </p>
                </div>
            </div>

            <div>
                <label
                    htmlFor="parent_email"
                    className="mb-1 block text-xs font-medium text-ink/70"
                >
                    Parent or guardian's email
                </label>
                <input
                    id="parent_email"
                    type="email"
                    required
                    value={data.parent_email}
                    onChange={(e) => setData('parent_email', e.target.value)}
                    aria-invalid={errors.parent_email ? true : undefined}
                    className="h-10 w-full rounded-lg border border-ink/15 bg-surface px-3 text-sm text-ink focus:border-brand focus:ring-2 focus:ring-brand/30 focus:outline-none aria-[invalid=true]:border-danger"
                />
                <InputError message={errors.parent_email} />
            </div>

            <Button
                type="submit"
                disabled={processing}
                className="h-10 w-full rounded-full bg-brand text-sm font-semibold text-on-brand hover:bg-brand-deep"
            >
                {processing && <Spinner />}
                Send confirmation email
            </Button>
        </form>
    );
}

function ResubmitIdForm() {
    const { data, setData, post, processing, errors, progress } = useForm<{
        _method: 'put';
        valid_id: File | null;
    }>({ _method: 'put', valid_id: null });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        // Files can't be sent with a real PUT, so it's spoofed over POST.
        post(route('portal.valid-id.update'), { forceFormData: true });
    };

    return (
        <form
            onSubmit={submit}
            className="rounded-2xl border border-ink/10 bg-surface p-4 text-left"
        >
            <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-ink">
                    Upload a new ID
                </h2>
                <AcceptedIdsDialog
                    trigger={
                        <button
                            type="button"
                            className="text-xs font-semibold text-brand-ink underline-offset-2 hover:underline"
                        >
                            See accepted IDs
                        </button>
                    }
                />
            </div>

            <label
                className={`flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-dashed px-3 transition-colors focus-within:border-brand focus-within:ring-[3px] focus-within:ring-brand/30 hover:border-brand/50 hover:bg-brand/5 ${
                    errors.valid_id
                        ? 'border-danger/60'
                        : data.valid_id
                          ? 'border-brand/40 bg-brand/5'
                          : 'border-ink/25'
                }`}
            >
                {data.valid_id ? (
                    <FileCheck2
                        className="h-4 w-4 shrink-0 text-brand-ink"
                        aria-hidden="true"
                    />
                ) : (
                    <Upload
                        className="h-4 w-4 shrink-0 text-brand-ink"
                        aria-hidden="true"
                    />
                )}
                <span
                    className={`min-w-0 flex-1 truncate text-sm ${data.valid_id ? 'text-ink' : 'text-ink/50'}`}
                >
                    {data.valid_id?.name ?? 'Photo or scan of your ID'}
                </span>
                <span className="shrink-0 text-xs font-semibold text-brand-ink">
                    {data.valid_id ? 'Change' : 'Browse'}
                </span>
                <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    required
                    aria-label="New valid ID"
                    aria-invalid={errors.valid_id ? true : undefined}
                    onChange={(e) =>
                        setData('valid_id', e.target.files?.[0] ?? null)
                    }
                    className="sr-only"
                />
            </label>
            <InputError message={errors.valid_id} />

            {progress && (
                <progress
                    value={progress.percentage}
                    max="100"
                    className="mt-2 h-1.5 w-full overflow-hidden rounded-full accent-brand"
                >
                    {progress.percentage}%
                </progress>
            )}

            <Button
                type="submit"
                disabled={processing || !data.valid_id}
                className="mt-3 h-10 w-full rounded-full bg-brand text-sm font-semibold text-on-brand hover:bg-brand-deep"
            >
                {processing && <Spinner />}
                Send for review
            </Button>
        </form>
    );
}

export default function AccountStatus({
    status,
    rejectionReasons,
    rejectionNote,
    hasResubmittedId,
    parentConfirmation,
}: Props) {
    const isWaitingOnParent =
        parentConfirmation !== null &&
        parentConfirmation.status !== 'CONFIRMED';
    const { props } = usePage<{
        flash?: { success?: string; error?: string };
    }>();
    const isRejected = status === 'REJECTED';
    const title = isRejected ? 'Account Not Approved' : 'Awaiting Approval';

    return (
        <div className="flex justify-center bg-cream px-4 py-10">
            <Head title={title} />

            <div className="w-full max-w-md space-y-4">
                <div className="text-center">
                    <div
                        className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ${
                            isRejected
                                ? 'bg-danger/10 text-danger-ink'
                                : 'bg-warn/15 text-warn-ink'
                        }`}
                    >
                        {isRejected ? (
                            <AlertCircle
                                className="h-6 w-6"
                                aria-hidden="true"
                            />
                        ) : (
                            <Clock className="h-6 w-6" aria-hidden="true" />
                        )}
                    </div>
                    <h1 className="font-serif text-2xl font-semibold text-ink">
                        {title}
                    </h1>
                </div>

                {props.flash?.success && (
                    <div
                        role="status"
                        className="rounded-xl border border-brand/25 bg-brand/5 px-4 py-3 text-sm text-brand-ink"
                    >
                        {props.flash.success}
                    </div>
                )}

                {props.flash?.error && (
                    <div
                        role="alert"
                        className="rounded-xl border border-danger/25 bg-danger/5 px-4 py-3 text-sm text-danger-deep"
                    >
                        {props.flash.error}
                    </div>
                )}

                {isRejected ? (
                    <>
                        <p className="text-center text-sm text-ink/70">
                            The school couldn't approve your account yet. Here's
                            what to fix:
                        </p>

                        <ul className="space-y-2">
                            {rejectionReasons.map((reason) => (
                                <li
                                    key={reason.label}
                                    className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm"
                                >
                                    <p className="font-semibold text-ink">
                                        {reason.label}
                                    </p>
                                    <p className="mt-0.5 text-ink/75">
                                        {reason.guidance}
                                    </p>
                                </li>
                            ))}
                        </ul>

                        {rejectionNote && (
                            <div className="rounded-xl border border-ink/10 bg-surface px-4 py-3 text-sm">
                                <p className="text-xs font-semibold tracking-wide text-ink/60 uppercase">
                                    Note from the school
                                </p>
                                <p className="mt-1 text-ink">
                                    {rejectionNote}
                                </p>
                            </div>
                        )}

                        <ResubmitIdForm />

                        <p className="text-center text-xs text-ink/60">
                            Questions? Contact the school registrar.
                        </p>
                    </>
                ) : (
                    <>
                        {isWaitingOnParent && parentConfirmation ? (
                            <ParentConfirmationCard
                                parentConfirmation={parentConfirmation}
                            />
                        ) : (
                            <p className="text-center text-sm text-ink/70">
                                {hasResubmittedId
                                    ? 'We received your new ID. The school is checking it now.'
                                    : 'Your email is confirmed. The school is now checking your valid ID to verify your account.'}{' '}
                                We'll email you as soon as your account is
                                approved.
                            </p>
                        )}

                        <div className="rounded-xl border border-warn/30 bg-warn/10 px-4 py-3 text-sm text-ink">
                            <p className="font-semibold">
                                You can't submit an enrollment application yet
                            </p>
                            <p className="mt-0.5 text-ink/75">
                                Applications open for your account once it's
                                verified. Then you can enroll your children,
                                upload documents, and pay online.
                            </p>
                        </div>
                    </>
                )}

                <div className="text-center">
                    <Link
                        href={route('portal.logout')}
                        method="post"
                        as="button"
                        className="text-sm font-medium text-ink/60 hover:text-ink"
                    >
                        Log out
                    </Link>
                </div>
            </div>
        </div>
    );
}
