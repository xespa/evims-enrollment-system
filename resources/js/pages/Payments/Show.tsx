import { Head, useForm, usePage } from '@inertiajs/react';

function formatCurrency(value) {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);
}

export default function Show({ enrollment }) {
    const { props } = usePage();
    const errorMsg = props.flash?.error;

    const installments = enrollment.billing_contract?.installments ?? [];

    const { post, processing } = useForm();

    const payWithGcash = (installmentId) => {
        post(route('payments.gcash.initiate', [enrollment.id, installmentId]));
    };

    const installmentPaid = (installment) =>
        installment.payments.filter((p) => p.status === 'COMPLETED').reduce((s, p) => s + Number(p.amount), 0);

    return (
        <>
            {props.flash?.success && (
                <div className="mb-4 rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {props.flash.success}
                </div>
            )}
            
            <Head title="Tuition Payments" />
            <div className="min-h-screen bg-gray-50 py-8 px-4">
                <div className="mx-auto max-w-2xl">
                    <h1 className="mb-1 text-2xl font-bold text-gray-900">Tuition Payments</h1>
                    <p className="mb-6 text-sm text-gray-500">
                        {enrollment.student.first_name} {enrollment.student.last_name} — Reference #{enrollment.id}
                    </p>

                    {errorMsg && (
                        <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {errorMsg}
                        </div>
                    )}

                    <div className="divide-y divide-gray-100 rounded-lg bg-white shadow-sm">
                        {installments.map((installment) => {
                            const paid = installmentPaid(installment);
                            const remaining = Number(installment.amount_due) - paid;

                            return (
                                <div key={installment.id} className="flex items-center justify-between p-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">
                                            Installment #{installment.installment_number}
                                        </p>
                                        <p className="text-xs text-gray-500">Due {installment.due_date}</p>
                                        <p className="text-sm text-gray-700">{formatCurrency(installment.amount_due)}</p>
                                    </div>

                                    {installment.status === 'PAID' ? (
                                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                                            Paid
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => payWithGcash(installment.id)}
                                            disabled={processing}
                                            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                                        >
                                            Pay {formatCurrency(remaining)} via GCash
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </>
    );
}
