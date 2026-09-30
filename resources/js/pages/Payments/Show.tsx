import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { useState } from 'react';

type Payment = {
    id: number;
    amount: string;
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | string;
};

type Installment = {
    id: number;
    installment_number: number;
    amount_due: string;
    due_date: string;
    status: 'UNPAID' | 'PAID' | string;
    payments: Payment[];
    gcash_initiate_url: string;
};

type Props = {
    enrollment: {
        id: number;
        school_year: string;
        student: { first_name: string; last_name: string };
        billing_contract: {
            total_fee: string;
            installments: Installment[];
        } | null;
    };
};

function formatCurrency(value: number | string) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
    }).format(Number(value));
}

function formatDate(value: string) {
    return new Date(value).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

export default function Show({ enrollment }: Props) {
    const { props } = usePage();
    const enrollee = props.auth?.enrollee;
    const successMsg = props.flash?.success;
    const errorMsg = props.flash?.error;

    const installments = enrollment.billing_contract?.installments ?? [];

    // Every Pay button is disabled once one is clicked, so a double click
    // can't open a second GCash checkout for the same installment.
    const [payingInstallmentId, setPayingInstallmentId] = useState<
        number | null
    >(null);

    const payWithGcash = (installment: Installment) => {
        router.post(
            installment.gcash_initiate_url,
            {},
            {
                onStart: () => setPayingInstallmentId(installment.id),
                // A successful start leaves this page for GCash, so this only
                // matters when it fails and we stay here.
                onFinish: () => setPayingInstallmentId(null),
            },
        );
    };

    const installmentPaid = (installment: Installment) =>
        installment.payments
            .filter((p) => p.status === 'COMPLETED')
            .reduce((s, p) => s + Number(p.amount), 0);

    const totalFee = Number(enrollment.billing_contract?.total_fee ?? 0);
    const totalPaid = installments.reduce((s, i) => s + installmentPaid(i), 0);

    return (
        <>
            <Head title="Tuition Payments" />

            <div className="min-h-screen bg-[#FBF8F2] px-4 py-10 sm:py-12">
                <div className="mx-auto max-w-3xl">
                    {enrollee && (
                        <Link
                            href={route('portal.dashboard')}
                            className="mb-4 inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-[#2F6F4E] hover:underline"
                        >
                            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                            Back to dashboard
                        </Link>
                    )}

                    <div className="mb-6">
                        <span className="inline-flex items-center gap-2 rounded-full bg-[#2F6F4E]/10 px-3 py-1 text-xs font-semibold tracking-wide text-[#2F6F4E] uppercase">
                            School Year {enrollment.school_year}
                        </span>
                        <h1 className="mt-3 font-serif text-3xl font-semibold text-[#1F2A24]">
                            Tuition Payments
                        </h1>
                        <p className="mt-1 text-sm text-[#1F2A24]/70">
                            {enrollment.student.first_name}{' '}
                            {enrollment.student.last_name} · Reference No.{' '}
                            <span className="font-semibold text-[#1F2A24] tabular-nums">
                                #{enrollment.id}
                            </span>
                        </p>
                    </div>

                    {successMsg && (
                        <div
                            role="status"
                            className="mb-4 rounded-2xl border border-[#2F6F4E]/25 bg-[#2F6F4E]/5 px-4 py-3 text-sm text-[#2F6F4E]"
                        >
                            {successMsg}
                        </div>
                    )}

                    {errorMsg && (
                        <div
                            role="alert"
                            className="mb-4 rounded-2xl border border-[#C6473B]/30 bg-[#C6473B]/5 px-4 py-3 text-sm text-[#A83A30]"
                        >
                            {errorMsg}
                        </div>
                    )}

                    {enrollment.billing_contract && (
                        <dl className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl border border-[#1F2A24]/10 bg-white p-4">
                                <dt className="text-xs font-medium text-[#1F2A24]/60">
                                    Total Amount
                                </dt>
                                <dd className="mt-1 text-lg font-semibold text-[#1F2A24] tabular-nums">
                                    {formatCurrency(totalFee)}
                                </dd>
                            </div>
                            <div className="rounded-2xl border border-[#1F2A24]/10 bg-white p-4">
                                <dt className="text-xs font-medium text-[#1F2A24]/60">
                                    Paid
                                </dt>
                                <dd className="mt-1 text-lg font-semibold text-[#2F6F4E] tabular-nums">
                                    {formatCurrency(totalPaid)}
                                </dd>
                            </div>
                            <div className="rounded-2xl border border-[#1F2A24]/10 bg-white p-4">
                                <dt className="text-xs font-medium text-[#1F2A24]/60">
                                    Balance
                                </dt>
                                <dd className="mt-1 text-lg font-semibold text-[#1F2A24] tabular-nums">
                                    {formatCurrency(totalFee - totalPaid)}
                                </dd>
                            </div>
                        </dl>
                    )}

                    <ul className="divide-y divide-[#1F2A24]/10 overflow-hidden rounded-2xl border border-[#1F2A24]/10 bg-white">
                        {installments.map((installment) => {
                            const paid = installmentPaid(installment);
                            const remaining =
                                Number(installment.amount_due) - paid;
                            const isPaying =
                                payingInstallmentId === installment.id;

                            return (
                                <li
                                    key={installment.id}
                                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div>
                                        <p className="text-sm font-semibold text-[#1F2A24]">
                                            Installment #
                                            {installment.installment_number}
                                        </p>
                                        <p className="text-xs text-[#1F2A24]/60">
                                            Due{' '}
                                            {formatDate(installment.due_date)}
                                        </p>
                                        <p className="mt-0.5 text-sm text-[#1F2A24]/80 tabular-nums">
                                            {formatCurrency(
                                                installment.amount_due,
                                            )}
                                            {paid > 0 &&
                                                installment.status !==
                                                    'PAID' && (
                                                    <span className="text-[#1F2A24]/60">
                                                        {' '}
                                                        · {formatCurrency(
                                                            paid,
                                                        )}{' '}
                                                        paid
                                                    </span>
                                                )}
                                        </p>
                                    </div>

                                    {installment.status === 'PAID' ? (
                                        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#2F6F4E]/10 px-3 py-1 text-xs font-semibold text-[#2F6F4E]">
                                            <CheckCircle2
                                                className="h-3.5 w-3.5"
                                                aria-hidden="true"
                                            />
                                            Paid
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                payWithGcash(installment)
                                            }
                                            disabled={
                                                payingInstallmentId !== null
                                            }
                                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#2F6F4E] px-5 py-2 text-sm font-semibold text-[#FBF8F2] transition-colors hover:bg-[#25573E] disabled:cursor-wait disabled:opacity-60"
                                        >
                                            {isPaying && (
                                                <Loader2
                                                    className="h-4 w-4 animate-spin"
                                                    aria-hidden="true"
                                                />
                                            )}
                                            Pay {formatCurrency(remaining)} via
                                            GCash
                                        </button>
                                    )}
                                </li>
                            );
                        })}
                    </ul>

                    <p className="mt-4 text-xs text-[#1F2A24]/60">
                        You'll be taken to GCash to complete each payment
                        securely. Prefer to pay in person? Visit the school
                        cashier and we'll record it for you.
                    </p>
                </div>
            </div>
        </>
    );
}
