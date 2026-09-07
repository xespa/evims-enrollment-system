import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';

export default function VerifyEmail() {
    const { post, processing } = useForm();

    const resend = () => post(route('portal.verification.resend'));

    return (
        <div className="mx-auto max-w-sm px-4 py-16 text-center">
            <Head title="Verify Your Email" />
            <h1 className="mb-2 font-serif text-2xl font-semibold text-[#1F2A24]">Check Your Inbox</h1>
            <p className="mb-6 text-sm text-[#1F2A24]/60">
                We sent a verification link to your email. Click it to activate your account and see your application status.
            </p>
            <Button onClick={resend} disabled={processing} variant="outline">
                Resend Verification Email
            </Button>
        </div>
    );
}
