import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { AlertCircle, Clock, FileCheck2, Upload } from 'lucide-react';
import type { FormEvent } from 'react';
import AcceptedIdsDialog from '@/components/accepted-ids-dialog';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

type RejectionReason = {
    label: string;
    guidance: string;
};

type Props = {
    status: 'PENDING' | 'REJECTED';
    rejectionReasons: RejectionReason[];
    rejectionNote: string | null;
    /** Pending again because a new ID was sent after a rejection. */
    hasResubmittedId: boolean;
};

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
            className="rounded-2xl border border-[#1F2A24]/10 bg-white p-4 text-left"
        >
            <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-[#1F2A24]">
                    Upload a new ID
                </h2>
                <AcceptedIdsDialog
                    trigger={
                        <button
                            type="button"
                            className="text-xs font-semibold text-[#2F6F4E] underline-offset-2 hover:underline"
                        >
                            See accepted IDs
                        </button>
                    }
                />
            </div>

            <label
                className={`flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-dashed px-3 transition-colors focus-within:border-[#2F6F4E] focus-within:ring-[3px] focus-within:ring-[#2F6F4E]/30 hover:border-[#2F6F4E]/50 hover:bg-[#2F6F4E]/5 ${
                    errors.valid_id
                        ? 'border-[#C6473B]/60'
                        : data.valid_id
                          ? 'border-[#2F6F4E]/40 bg-[#2F6F4E]/5'
                          : 'border-[#1F2A24]/25'
                }`}
            >
                {data.valid_id ? (
                    <FileCheck2
                        className="h-4 w-4 shrink-0 text-[#2F6F4E]"
                        aria-hidden="true"
                    />
                ) : (
                    <Upload
                        className="h-4 w-4 shrink-0 text-[#2F6F4E]"
                        aria-hidden="true"
                    />
                )}
                <span
                    className={`min-w-0 flex-1 truncate text-sm ${data.valid_id ? 'text-[#1F2A24]' : 'text-[#1F2A24]/50'}`}
                >
                    {data.valid_id?.name ?? 'Photo or scan of your ID'}
                </span>
                <span className="shrink-0 text-xs font-semibold text-[#2F6F4E]">
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
                    className="mt-2 h-1.5 w-full overflow-hidden rounded-full accent-[#2F6F4E]"
                >
                    {progress.percentage}%
                </progress>
            )}

            <Button
                type="submit"
                disabled={processing || !data.valid_id}
                className="mt-3 h-10 w-full rounded-full bg-[#2F6F4E] text-sm font-semibold text-[#FBF8F2] hover:bg-[#25573E]"
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
}: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const isRejected = status === 'REJECTED';
    const title = isRejected ? 'Account Not Approved' : 'Awaiting Approval';

    return (
        <div className="flex justify-center bg-[#FBF8F2] px-4 py-10">
            <Head title={title} />

            <div className="w-full max-w-md space-y-4">
                <div className="text-center">
                    <div
                        className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ${
                            isRejected
                                ? 'bg-[#C6473B]/10 text-[#C6473B]'
                                : 'bg-[#E8A33D]/15 text-[#a4670f]'
                        }`}
                    >
                        {isRejected ? (
                            <AlertCircle className="h-6 w-6" aria-hidden="true" />
                        ) : (
                            <Clock className="h-6 w-6" aria-hidden="true" />
                        )}
                    </div>
                    <h1 className="font-serif text-2xl font-semibold text-[#1F2A24]">
                        {title}
                    </h1>
                </div>

                {props.flash?.success && (
                    <div
                        role="status"
                        className="rounded-xl border border-[#2F6F4E]/25 bg-[#2F6F4E]/5 px-4 py-3 text-sm text-[#2F6F4E]"
                    >
                        {props.flash.success}
                    </div>
                )}

                {props.flash?.error && (
                    <div
                        role="alert"
                        className="rounded-xl border border-[#C6473B]/25 bg-[#C6473B]/5 px-4 py-3 text-sm text-[#9A3329]"
                    >
                        {props.flash.error}
                    </div>
                )}

                {isRejected ? (
                    <>
                        <p className="text-center text-sm text-[#1F2A24]/70">
                            The school couldn't approve your account yet. Here's
                            what to fix:
                        </p>

                        <ul className="space-y-2">
                            {rejectionReasons.map((reason) => (
                                <li
                                    key={reason.label}
                                    className="rounded-xl border border-[#C6473B]/20 bg-[#C6473B]/5 px-4 py-3 text-sm"
                                >
                                    <p className="font-semibold text-[#1F2A24]">
                                        {reason.label}
                                    </p>
                                    <p className="mt-0.5 text-[#1F2A24]/75">
                                        {reason.guidance}
                                    </p>
                                </li>
                            ))}
                        </ul>

                        {rejectionNote && (
                            <div className="rounded-xl border border-[#1F2A24]/10 bg-white px-4 py-3 text-sm">
                                <p className="text-xs font-semibold tracking-wide text-[#1F2A24]/60 uppercase">
                                    Note from the school
                                </p>
                                <p className="mt-1 text-[#1F2A24]">
                                    {rejectionNote}
                                </p>
                            </div>
                        )}

                        <ResubmitIdForm />

                        <p className="text-center text-xs text-[#1F2A24]/60">
                            Questions? Contact the school registrar.
                        </p>
                    </>
                ) : (
                    <>
                        <p className="text-center text-sm text-[#1F2A24]/70">
                            {hasResubmittedId
                                ? 'We received your new ID. The school is checking it now.'
                                : 'Your email is confirmed. The school is now checking your valid ID to verify your account.'}{' '}
                            We'll email you as soon as your account is approved.
                        </p>

                        <div className="rounded-xl border border-[#E8A33D]/30 bg-[#E8A33D]/10 px-4 py-3 text-sm text-[#1F2A24]">
                            <p className="font-semibold">
                                You can't submit an enrollment application yet
                            </p>
                            <p className="mt-0.5 text-[#1F2A24]/75">
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
                        className="text-sm font-medium text-[#1F2A24]/60 hover:text-[#1F2A24]"
                    >
                        Log out
                    </Link>
                </div>
            </div>
        </div>
    );
}
