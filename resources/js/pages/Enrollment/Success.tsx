import { Head, Link } from '@inertiajs/react';
import { CheckCircle2 } from 'lucide-react';

export default function Success({ enrollment }) {
    return (
        <>
            <Head title="Application Submitted" />
            <div className="flex min-h-screen items-center justify-center bg-[#FBF8F2] px-4 py-12">
                <div className="w-full max-w-md rounded-[2rem] border border-[#1F2A24]/10 bg-white p-8 text-center shadow-xl shadow-[#1F2A24]/5">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#2F6F4E]/10 text-[#2F6F4E]">
                        <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
                    </div>
                    <h1 className="font-serif text-xl font-semibold text-[#1F2A24]">Application Submitted</h1>
                    <p className="mt-2 text-sm text-[#1F2A24]/70">
                        {enrollment.student.first_name} {enrollment.student.last_name}
                    </p>
                    <p className="mt-1 text-sm text-[#1F2A24]/70">
                        Grade: {enrollment.grade_level.name} · Status: {enrollment.enrollment_status}
                    </p>
                    <p className="mt-3 text-sm text-[#1F2A24]/70">
                        Reference No: <span className="font-semibold text-[#1F2A24] tabular-nums">#{enrollment.id}</span>
                    </p>

                    <p className="mt-6 rounded-xl bg-[#1F2A24]/5 px-4 py-3 text-sm text-[#1F2A24]/70">
                        Your application is now under review. We'll email you once it's approved —
                        you'll be able to pay tuition from your account after that.
                    </p>

                    <Link
                        href={route('portal.dashboard')}
                        className="mt-6 flex min-h-11 w-full items-center justify-center rounded-full bg-[#2F6F4E] px-4 py-2.5 text-sm font-semibold text-[#FBF8F2] transition-colors hover:bg-[#25573E]"
                    >
                        Go to Your Dashboard
                    </Link>

                    <Link
                        href={route('admission.create')}
                        className="mt-2 flex min-h-11 w-full items-center justify-center rounded-full border border-[#2F6F4E]/30 px-4 py-2.5 text-sm font-semibold text-[#2F6F4E] transition-colors hover:bg-[#2F6F4E]/5"
                    >
                        Enroll Another Child
                    </Link>

                    <Link href="/" className="mt-2 flex min-h-11 items-center justify-center text-sm font-medium text-[#2F6F4E] hover:underline">
                        Back to Home
                    </Link>
                </div>
            </div>
        </>
    );
}
