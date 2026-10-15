import { Head, Link } from '@inertiajs/react';
import { CheckCircle2 } from 'lucide-react';

export default function Success({ enrollment }) {
    return (
        <>
            <Head title="Application Submitted" />
            <div className="flex min-h-screen items-center justify-center bg-cream px-4 py-12">
                <div className="w-full max-w-md rounded-[2rem] border border-ink/10 bg-surface p-8 text-center shadow-xl shadow-shade/5">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 text-brand-ink">
                        <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
                    </div>
                    <h1 className="font-serif text-xl font-semibold text-ink">Application Submitted</h1>
                    <p className="mt-2 text-sm text-ink/70">
                        {enrollment.student.first_name} {enrollment.student.last_name}
                    </p>
                    <p className="mt-1 text-sm text-ink/70">
                        Grade: {enrollment.grade_level.name} · Status: {enrollment.enrollment_status}
                    </p>
                    <p className="mt-3 text-sm text-ink/70">
                        Reference No: <span className="font-semibold text-ink tabular-nums">#{enrollment.id}</span>
                    </p>

                    <p className="mt-6 rounded-xl bg-ink/5 px-4 py-3 text-sm text-ink/70">
                        Your application is now under review. We'll email you once it's approved —
                        you'll be able to pay tuition from your account after that.
                    </p>

                    <Link
                        href={route('portal.dashboard')}
                        className="mt-6 flex min-h-11 w-full items-center justify-center rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-on-brand transition-colors hover:bg-brand-deep"
                    >
                        Go to Your Dashboard
                    </Link>

                    <Link
                        href={route('admission.create')}
                        className="mt-2 flex min-h-11 w-full items-center justify-center rounded-full border border-brand/30 px-4 py-2.5 text-sm font-semibold text-brand-ink transition-colors hover:bg-brand/5"
                    >
                        Enroll Another Child
                    </Link>

                    <Link href="/" className="mt-2 flex min-h-11 items-center justify-center text-sm font-medium text-brand-ink hover:underline">
                        Back to Home
                    </Link>
                </div>
            </div>
        </>
    );
}
