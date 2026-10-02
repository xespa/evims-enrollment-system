import { Form, Head, Link, usePage } from '@inertiajs/react';
import { ExternalLink, MailCheck, MailOpen, MousePointerClick, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import PortalAuthShell from '@/components/portal-auth-shell';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

type Props = {
    /** Where the confirmation link was sent. */
    email: string;
};

/** The server allows 6 resends a minute; this keeps people well under it. */
const RESEND_COOLDOWN_SECONDS = 60;

const STEPS = [
    { icon: MailOpen, text: 'Open the email from EVIMS.' },
    { icon: MousePointerClick, text: 'Click “Verify Email Address”.' },
    { icon: Search, text: 'Not there? Check Spam or Promotions.' },
];

function useCountdown(): [number, () => void] {
    const [secondsLeft, setSecondsLeft] = useState(0);

    useEffect(() => {
        if (secondsLeft <= 0) return;
        const timer = window.setTimeout(
            () => setSecondsLeft((s) => s - 1),
            1000,
        );
        return () => window.clearTimeout(timer);
    }, [secondsLeft]);

    return [secondsLeft, () => setSecondsLeft(RESEND_COOLDOWN_SECONDS)];
}

export default function VerifyEmail({ email }: Props) {
    const { props } = usePage<{ flash?: { success?: string } }>();
    const [secondsLeft, startCooldown] = useCountdown();
    const isGmail = /@(gmail|googlemail)\.com$/i.test(email);

    return (
        <>
            <Head title="Confirm Your Email" />

            <PortalAuthShell
                title="Confirm your email"
                description="One last step before you can use the portal."
                footer={
                    <>
                        Signed up with the wrong email?{' '}
                        <Link
                            href={route('portal.logout')}
                            method="post"
                            as="button"
                            className="font-semibold text-[#2F6F4E] underline-offset-2 hover:underline"
                        >
                            Log out
                        </Link>
                    </>
                }
            >
                <div className="mb-4 flex flex-col items-center text-center">
                    <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#2F6F4E]/10 text-[#2F6F4E]">
                        <MailCheck className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <p className="text-sm text-[#1F2A24]/70">
                        We sent a confirmation link to
                    </p>
                    <p className="mt-0.5 max-w-full truncate font-semibold text-[#1F2A24]">
                        {email}
                    </p>
                </div>

                {props.flash?.success && (
                    <div
                        role="status"
                        className="mb-4 rounded-xl border border-[#2F6F4E]/20 bg-[#2F6F4E]/5 px-3 py-2 text-center text-[13px] text-[#2F6F4E]"
                    >
                        {props.flash.success}
                    </div>
                )}

                <ol className="mb-5 space-y-2 rounded-xl bg-[#FBF8F2] p-3">
                    {STEPS.map(({ icon: Icon, text }) => (
                        <li
                            key={text}
                            className="flex items-center gap-2.5 text-sm text-[#1F2A24]/80"
                        >
                            <Icon
                                className="h-4 w-4 shrink-0 text-[#2F6F4E]"
                                aria-hidden="true"
                            />
                            {text}
                        </li>
                    ))}
                </ol>

                {isGmail && (
                    <a
                        href="https://mail.google.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mb-2 flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[#2F6F4E] text-sm font-semibold text-[#FBF8F2] shadow-sm transition-colors hover:bg-[#25573E]"
                    >
                        Open Gmail
                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">(opens in a new tab)</span>
                    </a>
                )}

                <Form
                    action={route('portal.verification.send')}
                    method="post"
                    options={{ preserveScroll: true }}
                    onSuccess={startCooldown}
                >
                    {({ processing }) => (
                        <Button
                            type="submit"
                            variant="outline"
                            disabled={processing || secondsLeft > 0}
                            className="h-10 w-full rounded-full border-[#1F2A24]/15 text-sm font-semibold text-[#1F2A24]/80"
                        >
                            {processing && <Spinner />}
                            {secondsLeft > 0
                                ? `Resend available in ${secondsLeft}s`
                                : "Didn't get it? Resend email"}
                        </Button>
                    )}
                </Form>
            </PortalAuthShell>
        </>
    );
}
