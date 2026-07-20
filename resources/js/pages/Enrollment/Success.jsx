import { Head, Link } from '@inertiajs/react';

export default function Success({ enrollment }) {
    return (
        <>
            <Head title="Application Submitted" />
            <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
                <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl text-green-600">✓</div>
                    <h1 className="mb-2 text-xl font-bold text-gray-900">Application Submitted</h1>
                    <p className="mb-1 text-sm text-gray-600">
                        {enrollment.student.first_name} {enrollment.student.last_name}
                    </p>
                    <p className="mb-4 text-sm text-gray-500">
                        Grade: {enrollment.grade_level.name} · Status: {enrollment.enrollment_status}
                    </p>
                    <p className="text-xs text-gray-400">Reference No: #{enrollment.id}</p>
                    <Link href="/" className="mt-6 inline-block text-sm text-blue-600 hover:underline">
                        Back to Home
                    </Link>
                </div>
            </div>
        </>
    );
}
