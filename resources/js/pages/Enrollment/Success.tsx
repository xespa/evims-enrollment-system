import { Head, Link } from '@inertiajs/react';

export default function Success({ enrollment, paymentUrl  }) {
    return (
        <>
            <Head title="Application Submitted" />
            <div className="flex min-h-screen items-center justify-center bg-[#FBF8F2] px-4 py-12">
                <div className="w-full max-w-md rounded-[2rem] border border-[#1F2A24]/10 bg-white p-8 text-center shadow-xl shadow-[#1F2A24]/5">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#2F6F4E]/10 text-2xl text-[#2F6F4E]">✓</div>
                    <h1 className="font-serif text-xl font-semibold text-[#1F2A24]">Application Submitted</h1>
                    <p className="mt-2 text-sm text-[#1F2A24]/70">
                        {enrollment.student.first_name} {enrollment.student.last_name}
                    </p>
                    <p className="mt-1 text-sm text-[#1F2A24]/50">
                        Grade: {enrollment.grade_level.name} · Status: {enrollment.enrollment_status}
                    </p>
                    <p className="mt-3 text-xs text-[#1F2A24]/40">Reference No: #{enrollment.id}</p>
                    <Link
                        href={paymentUrl}
                        className="mt-6 block w-full rounded-full bg-[#2F6F4E] px-4 py-2.5 text-sm font-semibold text-[#FBF8F2] transition-colors hover:bg-[#25573E]"
                    >
                        Proceed to Payment
                    </Link>
                    <Link href="/" className="mt-4 inline-block text-sm font-medium text-[#2F6F4E] hover:underline">
                        Back to Home
                    </Link>
                    <Link href={route('portal.register')} className="mt-4 inline-block text-sm font-medium text-[#2F6F4E] hover:underline">
                        Create an account to track this application →
                    </Link>
                </div>
            </div>
        </>
    );
}
