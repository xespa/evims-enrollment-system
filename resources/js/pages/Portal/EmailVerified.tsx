import { Head, Link } from '@inertiajs/react';
import { CircleCheck } from 'lucide-react';
import PortalAuthShell from '@/components/portal-auth-shell';

type Props = {
    /** The address that was just confirmed. */
    email: string;
};

/**
 * Shown when the confirmation link is opened in a browser that isn't signed
 * in to this portal account, so there's no portal page to go to yet.
 */
export default function EmailVerified({ email }: Props) {
    return (
        <>
            <Head title="Email Confirmed" />

            <PortalAuthShell
                title="Email confirmed"
                description="Your email address has been verified."
            >
                <div className="mb-6 flex flex-col items-center text-center">
                    <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#2F6F4E]/10 text-[#2F6F4E]">
                        <CircleCheck className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <p className="text-sm text-[#1F2A24]/70">
                        Thanks for confirming
                    </p>
                    <p className="mt-0.5 max-w-full truncate font-semibold text-[#1F2A24]">
                        {email}
                    </p>
                    <p className="mt-3 text-sm text-[#1F2A24]/70">
                        Log in to your portal account to continue.
                    </p>
                </div>

                <Link
                    href={route('login')}
                    className="flex h-10 w-full items-center justify-center rounded-full bg-[#2F6F4E] text-sm font-semibold text-[#FBF8F2] shadow-sm transition-colors hover:bg-[#25573E]"
                >
                    Log in
                </Link>
            </PortalAuthShell>
        </>
    );
}
