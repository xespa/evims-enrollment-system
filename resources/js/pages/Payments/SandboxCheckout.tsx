import { Head, useForm } from '@inertiajs/react';

function formatCurrency(value) {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);
}

export default function SandboxCheckout({ payment }) {
    const { post, processing } = useForm();

    const confirmPayment = () => {
        post(route('payments.sandbox.confirm', payment.id));
    };

    return (
        <>
            <Head title="GCash Checkout (Sandbox)" />
            <div className="flex min-h-screen items-center justify-center bg-blue-50 px-4">
                <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
                    <div className="mb-4 rounded-md bg-yellow-100 px-3 py-2 text-center text-xs font-semibold text-yellow-800">
                        ⚠ SIMULATION MODE — No real money is involved
                    </div>

                    <div className="mb-6 text-center">
                        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white">
                            G
                        </div>
                        <h1 className="text-lg font-bold text-gray-900">GCash Payment</h1>
                        <p className="text-sm text-gray-500">
                            {payment.enrollment.student.first_name} {payment.enrollment.student.last_name}
                        </p>
                    </div>

                    <div className="mb-6 rounded-md border border-gray-200 p-4 text-center">
                        <p className="text-sm text-gray-500">Amount to Pay</p>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(payment.amount)}</p>
                    </div>

                    <button
                        onClick={confirmPayment}
                        disabled={processing}
                        className="w-full rounded-md bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        {processing ? 'Processing...' : 'Simulate Successful Payment'}
                    </button>

                    <p className="mt-3 text-center text-xs text-gray-400">
                        In production, this screen is replaced by PayMongo's real GCash authentication page.
                    </p>
                </div>
            </div>
        </>
    );
}
