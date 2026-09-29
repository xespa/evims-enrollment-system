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
            <span className="text-[#1F2A24]/75">
                {label}
                {detail && (
                    <span className="ml-1 text-xs text-[#1F2A24]/65">{detail}</span>
                )}
            </span>
            <span className="font-medium text-[#1F2A24] tabular-nums">
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
                <h2 className="mb-4 font-serif text-xl font-semibold text-[#1F2A24]">
                    Billing / Tuition Contract
                </h2>
                <p className="text-sm text-[#1F2A24]/70">
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
            <h2 className="mb-4 font-serif text-xl font-semibold text-[#1F2A24]">
                Billing / Tuition Contract
            </h2>

            <div className="mb-4 rounded-xl border border-[#1F2A24]/10 bg-white px-4 py-3">
                <p className="mb-2 text-sm font-semibold text-[#1F2A24]">
                    School Fees — {selectedGrade.name}
                </p>

                <div className="divide-y divide-[#1F2A24]/10">
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

                <div className="mt-2 flex items-baseline justify-between border-t-2 border-[#1F2A24]/10 pt-2">
                    <span className="text-sm font-semibold text-[#1F2A24]">
                        Total Amount to Pay
                    </span>
                    <span className="text-xl font-bold text-[#2F6F4E] tabular-nums">
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
                <div className="mb-4 rounded-xl border border-[#2F6F4E]/25 bg-[#2F6F4E]/5 px-4 py-3 text-sm text-[#1F2A24]/80">
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
                    <p className="mt-1 text-xs text-[#1F2A24]/70">
                        {PAYMENT_OPTIONS[data.payment_option]?.label} plan ·
                        Total of {formatCurrency(total)}, paid at the school
                        counter or via GCash.
                    </p>
                </div>
            )}

            <fieldset
                className="mb-4"
                aria-required="true"
                aria-describedby={errors.payment_channel ? 'payment_channel-error' : undefined}
            >
                <legend className="mb-2 block text-sm font-medium text-[#1F2A24]/80">
                    How will you pay?{' '}
                    <span className="text-[#C6473B]" aria-hidden="true">*</span>
                </legend>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label
                        className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors focus-within:ring-2 focus-within:ring-[#2F6F4E]/30 ${
                            data.payment_channel === 'COUNTER'
                                ? 'border-[#2F6F4E] bg-[#2F6F4E]/5'
                                : errors.payment_channel
                                  ? 'border-[#C6473B] hover:bg-[#1F2A24]/[0.03]'
                                  : 'border-[#1F2A24]/15 hover:bg-[#1F2A24]/[0.03]'
                        }`}
                    >
                        <input
                            type="radio"
                            className="h-4 w-4 shrink-0 accent-[#2F6F4E]"
                            name="payment_channel"
                            value="COUNTER"
                            checked={data.payment_channel === 'COUNTER'}
                            onChange={(e) =>
                                setData('payment_channel', e.target.value)
                            }
                        />
                        <div>
                            <p className="text-sm font-medium text-[#1F2A24]">
                                Pay at School Counter
                            </p>
                            <p className="text-xs text-[#1F2A24]/70">
                                Cash payment at the registrar's office
                            </p>
                        </div>
                    </label>

                    <label
                        className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors focus-within:ring-2 focus-within:ring-[#2F6F4E]/30 ${
                            data.payment_channel === 'GCASH'
                                ? 'border-[#2F6F4E] bg-[#2F6F4E]/5'
                                : errors.payment_channel
                                  ? 'border-[#C6473B] hover:bg-[#1F2A24]/[0.03]'
                                  : 'border-[#1F2A24]/15 hover:bg-[#1F2A24]/[0.03]'
                        }`}
                    >
                        <input
                            type="radio"
                            className="h-4 w-4 shrink-0 accent-[#2F6F4E]"
                            name="payment_channel"
                            value="GCASH"
                            checked={data.payment_channel === 'GCASH'}
                            onChange={(e) =>
                                setData('payment_channel', e.target.value)
                            }
                        />
                        <div>
                            <p className="text-sm font-medium text-[#1F2A24]">
                                Pay via GCash
                            </p>
                            <p className="text-xs text-[#1F2A24]/70">
                                Online, using the school's GCash account
                            </p>
                        </div>
                    </label>
                </div>
                {errors.payment_channel && (
                    <p id="payment_channel-error" className="mt-1 text-sm text-[#C6473B]">
                        {errors.payment_channel}
                    </p>
                )}
            </fieldset>

            {data.payment_channel === 'GCASH' && (
                <div className="mb-4 rounded-xl border border-[#2F6F4E]/20 bg-[#2F6F4E]/5 p-4 text-center">
                    <p className="text-sm font-medium text-[#1F2A24]/80">
                        After you submit this application, you'll receive a
                        secure GCash payment link on the confirmation page.
                    </p>
                    <p className="mt-1 text-xs text-[#1F2A24]/70">
                        No need to pay right now — just complete your
                        application first.
                    </p>
                </div>
            )}
        </div>
    );
}
