import { Head, Link } from '@inertiajs/react';

export default function Processing({ enrollment_id }) {
    return (
        <>
            <Head title="Processing Payment" />
            <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
                <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
                    <h1 className="mb-2 text-lg font-bold text-gray-900">Confirming Your Payment</h1>
                    <p className="mb-4 text-sm text-gray-500">
                        This usually takes a few seconds. You can refresh the page below to check the latest status.
                    </p>
                    <Link
                        href={route('payments.show', enrollment_id)}
                        className="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                        Check Payment Status
                    </Link>
                </div>
            </div>
        </>
    );
}
