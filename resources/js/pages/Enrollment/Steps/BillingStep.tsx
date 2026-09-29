import SelectInput from '../Components/SelectInput';
import {
    BILLABLE_MONTHS,
    computeInstallments,
    formatCurrency,
    PAYMENT_OPTIONS,
} from '../Components/fees';

function FeeRow({ label, detail, amount }) {
    return (
        <div className="flex items-baseline justify-between gap-4 py-1.5 text-sm">
            <span className="text-gray-600">
                {label}
                {detail && (
                    <span className="ml-1 text-xs text-gray-400">{detail}</span>
                )}
            </span>
            <span className="font-medium text-gray-800 tabular-nums">
                {formatCurrency(amount)}
            </span>
        </div>
    );
}

export default function BillingStep({ data, gradeLevels, setData, errors }) {
    const selectedGrade = gradeLevels.find(
        (g) => String(g.id) === String(data.grade_level_id),
    );

    if (!selectedGrade) {
        return (
            <div>
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                    Billing / Tuition Contract
                </h2>
                <p className="text-sm text-gray-500">
                    Select a grade level first to see the school fees.
                </p>
            </div>
        );
    }

    const oneTimeFees = [
        { label: 'Registration Fee', amount: selectedGrade.registration_fee },
        { label: 'Miscellaneous Fee', amount: selectedGrade.miscellaneous_fee },
        { label: 'Books', amount: selectedGrade.books_fee },
    ].filter((fee) => Number(fee.amount) > 0);

    const monthlyFees = [
        { label: 'Tuition', amount: selectedGrade.monthly_tuition },
        {
            label: 'Laboratory Fee',
            amount: selectedGrade.monthly_laboratory_fee,
        },
    ].filter((fee) => Number(fee.amount) > 0);

    const total = selectedGrade.tuition_fee;
    const plan = data.payment_option
        ? computeInstallments(total, data.payment_option)
        : null;

    return (
        <div>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Billing / Tuition Contract
            </h2>

            <div className="mb-4 rounded-md border border-gray-200 bg-white px-4 py-3">
                <p className="mb-2 text-sm font-semibold text-gray-800">
                    School Fees — {selectedGrade.name}
                </p>

                <div className="divide-y divide-gray-100">
                    {oneTimeFees.map((fee) => (
                        <FeeRow
                            key={fee.label}
                            label={fee.label}
                            amount={fee.amount}
                        />
                    ))}
                    {monthlyFees.map((fee) => (
                        <FeeRow
                            key={fee.label}
                            label={`Monthly ${fee.label}`}
                            detail={`${formatCurrency(fee.amount)} × ${BILLABLE_MONTHS} months`}
                            amount={Number(fee.amount) * BILLABLE_MONTHS}
                        />
                    ))}
                </div>

                <div className="mt-2 flex items-baseline justify-between border-t-2 border-gray-200 pt-2">
                    <span className="text-sm font-semibold text-gray-900">
                        Total Amount to Pay
                    </span>
                    <span className="text-xl font-bold text-blue-700 tabular-nums">
                        {formatCurrency(total)}
                    </span>
                </div>
            </div>

            <SelectInput
                label="Payment Option"
                name="payment_option"
                value={data.payment_option}
                onChange={setData}
                error={errors.payment_option}
                required
                options={[
                    { value: 'MONTHLY', label: 'Monthly (10 payments)' },
                    { value: 'BI_MONTHLY', label: 'Bi-Monthly (5 payments)' },
                    {
                        value: 'FULL_PAYMENT',
                        label: 'Full Payment (1 payment)',
                    },
                ]}
            />

            {plan && (
                <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-gray-700">
                    {plan.count === 1 ? (
                        <p>
                            You will pay{' '}
                            <span className="font-semibold">
                                {formatCurrency(plan.last)}
                            </span>{' '}
                            in one payment.
                        </p>
                    ) : plan.regular === plan.last ? (
                        <p>
                            You will pay{' '}
                            <span className="font-semibold">
                                {plan.count} payments of{' '}
                                {formatCurrency(plan.regular)}
                            </span>
                            .
                        </p>
                    ) : (
                        <p>
                            You will pay{' '}
                            <span className="font-semibold">
                                {plan.count - 1} payments of{' '}
                                {formatCurrency(plan.regular)}
                            </span>{' '}
                            and a final payment of{' '}
                            <span className="font-semibold">
                                {formatCurrency(plan.last)}
                            </span>
                            .
                        </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                        {PAYMENT_OPTIONS[data.payment_option]?.label} plan ·
                        Total of {formatCurrency(total)}, paid at the school
                        counter or via GCash.
                    </p>
                </div>
            )}

            <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                    How will you pay? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label
                        className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 ${
                            data.payment_channel === 'COUNTER'
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-300'
                        }`}
                    >
                        <input
                            type="radio"
                            name="payment_channel"
                            value="COUNTER"
                            checked={data.payment_channel === 'COUNTER'}
                            onChange={(e) =>
                                setData('payment_channel', e.target.value)
                            }
                        />
                        <div>
                            <p className="text-sm font-medium text-gray-800">
                                Pay at School Counter
                            </p>
                            <p className="text-xs text-gray-500">
                                Cash payment at the registrar's office
                            </p>
                        </div>
                    </label>

                    <label
                        className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 ${
                            data.payment_channel === 'GCASH'
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-300'
                        }`}
                    >
                        <input
                            type="radio"
                            name="payment_channel"
                            value="GCASH"
                            checked={data.payment_channel === 'GCASH'}
                            onChange={(e) =>
                                setData('payment_channel', e.target.value)
                            }
                        />
                        <div>
                            <p className="text-sm font-medium text-gray-800">
                                Pay via GCash
                            </p>
                            <p className="text-xs text-gray-500">
                                Online, using the school's GCash account
                            </p>
                        </div>
                    </label>
                </div>
                {errors.payment_channel && (
                    <p className="mt-1 text-sm text-red-600">
                        {errors.payment_channel}
                    </p>
                )}
            </div>

            {data.payment_channel === 'GCASH' && (
                <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-4 text-center">
                    <p className="text-sm font-medium text-gray-700">
                        After you submit this application, you'll receive a
                        secure GCash payment link on the confirmation page.
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                        No need to pay right now — just complete your
                        application first.
                    </p>
                </div>
            )}
        </div>
    );
}
