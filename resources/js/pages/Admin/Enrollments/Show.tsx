import { Head, Link, router, usePage, useForm } from '@inertiajs/react';
import { useState } from 'react';


function InfoRow({ label, value }) {
    return (
        <div className="flex justify-between border-b border-gray-100 py-2 text-sm">
            <span className="text-gray-500">{label}</span>
            <span className="font-medium text-gray-800">{value || '—'}</span>
        </div>
    );
}

function CheckboxField({ label, checked, onChange }) {
    return (
        <label className="flex items-center gap-2 py-1.5 cursor-pointer">
            <input
                type="checkbox"
                checked={!!checked}
                onChange={onChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{label}</span>
        </label>
    );
}

const INSTALLMENT_STATUS_STYLES = {
    UNPAID: 'bg-gray-100 text-gray-700',
    PARTIALLY_PAID: 'bg-yellow-100 text-yellow-800',
    PAID: 'bg-green-100 text-green-800',
};

function formatCurrency(value) {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);
}

function PaymentsSection({ enrollment }) {
    const [payingInstallmentId, setPayingInstallmentId] = useState(null);
    const { data, setData, post, processing, errors, reset } = useForm({
        installment_id: '',
        amount: '',
    });

    const installments = enrollment.billing_contract?.installments ?? [];

    const totalDue = installments.reduce((sum, i) => sum + Number(i.amount_due), 0);
    const totalPaid = installments.reduce(
        (sum, i) => sum + i.payments.filter((p) => p.status === 'COMPLETED').reduce((s, p) => s + Number(p.amount), 0),
        0
    );

    const openPayForm = (installment) => {
        setPayingInstallmentId(installment.id);
        setData({
            installment_id: installment.id,
            amount: (Number(installment.amount_due) - installmentPaid(installment)).toFixed(2),
        });
    };

    const installmentPaid = (installment) =>
        installment.payments.filter((p) => p.status === 'COMPLETED').reduce((s, p) => s + Number(p.amount), 0);

    const submitCashPayment = (e) => {
        e.preventDefault();
        post(route('admin.enrollments.payments.cash', enrollment.id), {
            preserveScroll: true,
            onSuccess: () => {
                setPayingInstallmentId(null);
                reset();
            },
        });
    };

    return (
        <div className="rounded-lg bg-white p-4 shadow-sm md:col-span-2">
            <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-600">Payments</h2>
                <div className="text-sm text-gray-600">
                    Paid <span className="font-semibold text-green-700">{formatCurrency(totalPaid)}</span> of{' '}
                    <span className="font-semibold text-gray-900">{formatCurrency(totalDue)}</span>
                </div>
            </div>

            <div className="divide-y divide-gray-100">
                {installments.map((installment) => {
                    const paid = installmentPaid(installment);
                    const remaining = Number(installment.amount_due) - paid;

                    return (
                        <div key={installment.id} className="py-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-sm font-medium text-gray-800">
                                        Installment #{installment.installment_number}
                                    </span>
                                    <span className="ml-2 text-xs text-gray-500">
                                        Due {installment.due_date}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-700">{formatCurrency(installment.amount_due)}</span>
                                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${INSTALLMENT_STATUS_STYLES[installment.status]}`}>
                                        {installment.status}
                                    </span>
                                    {installment.status !== 'PAID' && (
                                        <button
                                            onClick={() => openPayForm(installment)}
                                            className="text-xs text-blue-600 hover:underline"
                                        >
                                            Record Cash Payment
                                        </button>
                                    )}
                                </div>
                            </div>

                            {payingInstallmentId === installment.id && (
                                <form onSubmit={submitCashPayment} className="mt-2 flex items-center gap-2 rounded-md bg-gray-50 p-3">
                                    <span className="text-xs text-gray-500">Amount:</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.amount}
                                        onChange={(e) => setData('amount', e.target.value)}
                                        className="w-32 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900"
                                    />
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                                    >
                                        Confirm
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPayingInstallmentId(null)}
                                        className="text-xs text-gray-500 hover:underline"
                                    >
                                        Cancel
                                    </button>
                                    {errors.amount && <span className="text-xs text-red-600">{errors.amount}</span>}
                                </form>
                            )}

                            {paid > 0 && installment.status !== 'PAID' && (
                                <p className="mt-1 text-xs text-gray-500">
                                    {formatCurrency(paid)} paid so far, {formatCurrency(remaining)} remaining
                                </p>
                            )}
                        </div>
                    );
                })}

                {installments.length === 0 && (
                    <p className="py-3 text-sm text-gray-400">No installment schedule found.</p>
                )}
            </div>
        </div>
    );
}

const STATUS_STYLES = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
};

export default function Show({ enrollment }) {
    const { props } = usePage();
    const flashSuccess = props.flash?.success;

    const student = enrollment.student;
    const verification = enrollment.office_verification;

    const changeStatus = (newStatus) => {
        if (!confirm(`Set status to ${newStatus}?`)) return;
        router.patch(route('admin.enrollments.updateStatus', enrollment.id), {
            enrollment_status: newStatus,
        });
    };

    const toggleVerification = (field, currentValue) => {
        router.patch(route('admin.enrollments.updateVerification', enrollment.id), {
            has_form_138: field === 'has_form_138' ? !currentValue : verification.has_form_138,
            has_birth_certificate: field === 'has_birth_certificate' ? !currentValue : verification.has_birth_certificate,
            has_good_moral_certificate: field === 'has_good_moral_certificate' ? !currentValue : verification.has_good_moral_certificate,
        }, { preserveScroll: true });
    };

    return (
        <>
            <Head title={`${student.last_name}, ${student.first_name}`} />

            <div className="min-h-screen bg-gray-50 py-8 px-4">
                <div className="mx-auto max-w-4xl">
                    <Link href={route('admin.enrollments.index')} className="mb-4 inline-block text-sm text-blue-600 hover:underline">
                        ← Back to list
                    </Link>

                    {flashSuccess && (
                        <div className="mb-4 rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700">
                            {flashSuccess}
                        </div>
                    )}

                    <div className="mb-4 flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-gray-900">
                            {student.last_name}, {student.first_name} {student.middle_name}
                        </h1>
                        <span className={`rounded-full px-3 py-1 text-sm font-medium ${STATUS_STYLES[enrollment.enrollment_status]}`}>
                            {enrollment.enrollment_status}
                        </span>
                    </div>

                    {/* Approve/Reject actions */}
                    <div className="mb-6 flex gap-3 rounded-lg bg-white p-4 shadow-sm">
                        <button
                            onClick={() => changeStatus('APPROVED')}
                            disabled={enrollment.enrollment_status === 'APPROVED'}
                            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-40"
                        >
                            Approve
                        </button>
                        <button
                            onClick={() => changeStatus('REJECTED')}
                            disabled={enrollment.enrollment_status === 'REJECTED'}
                            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-40"
                        >
                            Reject
                        </button>
                        <button
                            onClick={() => changeStatus('PENDING')}
                            disabled={enrollment.enrollment_status === 'PENDING'}
                            className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-40"
                        >
                            Reset to Pending
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {/* Student info */}
                        <div className="rounded-lg bg-white p-4 shadow-sm">
                            <h2 className="mb-2 text-sm font-semibold text-gray-600">Student Info</h2>
                            <InfoRow label="LRN" value={student.lrn} />
                            <InfoRow label="PSA Birth Cert No." value={student.psa_birth_cert_no} />
                            <InfoRow label="Date of Birth" value={student.date_of_birth} />
                            <InfoRow label="Sex" value={student.sex} />
                            <InfoRow label="Grade Level" value={enrollment.grade_level.name} />
                            <InfoRow label="Student Type" value={enrollment.student_type} />
                            <InfoRow label="School Year" value={enrollment.school_year} />
                            <InfoRow label="Session" value={enrollment.session_time_preference} />
                        </div>

                        {/* Address */}
                        <div className="rounded-lg bg-white p-4 shadow-sm">
                            <h2 className="mb-2 text-sm font-semibold text-gray-600">Address</h2>
                            <InfoRow label="House/Street" value={student.address?.house_number_street} />
                            <InfoRow label="Barangay" value={student.address?.barangay} />
                            <InfoRow label="City/Municipality" value={student.address?.city_municipality} />
                            <InfoRow label="Province" value={student.address?.province} />
                            <InfoRow label="Zip Code" value={student.address?.zip_code} />
                        </div>

                        {/* Parents */}
                        <div className="rounded-lg bg-white p-4 shadow-sm">
                            <h2 className="mb-2 text-sm font-semibold text-gray-600">Father</h2>
                            <InfoRow label="Name" value={`${student.parent_profile?.father_first_name ?? ''} ${student.parent_profile?.father_last_name ?? ''}`} />
                            <InfoRow label="Occupation" value={student.parent_profile?.father_occupation} />
                            <InfoRow label="Mobile No." value={student.parent_profile?.father_mobile_no} />
                        </div>

                        <div className="rounded-lg bg-white p-4 shadow-sm">
                            <h2 className="mb-2 text-sm font-semibold text-gray-600">Mother</h2>
                            <InfoRow label="Name" value={`${student.parent_profile?.mother_first_name ?? ''} ${student.parent_profile?.mother_maiden_last_name ?? ''}`} />
                            <InfoRow label="Occupation" value={student.parent_profile?.mother_occupation} />
                            <InfoRow label="Mobile No." value={student.parent_profile?.mother_mobile_no} />
                        </div>

                        {/* Subjects */}
                        <div className="rounded-lg bg-white p-4 shadow-sm md:col-span-2">
                            <h2 className="mb-2 text-sm font-semibold text-gray-600">Enrolled Subjects</h2>
                            <p className="text-sm text-gray-700">
                                {enrollment.subjects.map((s) => s.name).join(', ') || '—'}
                            </p>
                        </div>

                        {/* Vital info */}
                        <div className="rounded-lg bg-white p-4 shadow-sm md:col-span-2">
                            <h2 className="mb-2 text-sm font-semibold text-gray-600">Vital Information</h2>
                            <InfoRow label="Special Health Problems" value={enrollment.vital_information?.special_health_problems} />
                            <InfoRow label="History Particulars" value={enrollment.vital_information?.history_particulars} />
                        </div>

                        {/* Billing */}
                        <div className="rounded-lg bg-white p-4 shadow-sm">
                            <h2 className="mb-2 text-sm font-semibold text-gray-600">Billing</h2>
                            <InfoRow label="Payment Option" value={enrollment.billing_contract?.payment_option} />
                            {enrollment.billing_contract?.scanned_contract_url && (

                                    <a
                                    href={`/storage/${enrollment.billing_contract.scanned_contract_url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-2 inline-block text-sm text-blue-600 hover:underline"
                                >
                                    View Scanned Contract →
                                </a>
                            )}
                        </div>

                        {/* Document verification checklist */}
                        <div className="rounded-lg bg-white p-4 shadow-sm">
                            <h2 className="mb-2 text-sm font-semibold text-gray-600">Document Verification</h2>
                            <CheckboxField
                                label="Form 138 submitted"
                                checked={verification?.has_form_138}
                                onChange={() => toggleVerification('has_form_138', verification?.has_form_138)}
                            />
                            <CheckboxField
                                label="Birth Certificate submitted"
                                checked={verification?.has_birth_certificate}
                                onChange={() => toggleVerification('has_birth_certificate', verification?.has_birth_certificate)}
                            />
                            <CheckboxField
                                label="Good Moral Certificate submitted"
                                checked={verification?.has_good_moral_certificate}
                                onChange={() => toggleVerification('has_good_moral_certificate', verification?.has_good_moral_certificate)}
                            />
                            <PaymentsSection enrollment={enrollment} />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
