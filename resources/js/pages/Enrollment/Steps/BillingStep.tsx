import { usePage } from '@inertiajs/react';
import SelectInput from '../Components/SelectInput';
import {
    BILLABLE_MONTHS,
    computeInstallments,
    formatCurrency,
    PAYMENT_OPTIONS,
} from '../Components/fees';
import StepGuide from '../Components/StepGuide';

function FeeRow({ label, detail, amount }) {
    return (
        <div className="flex items-baseline justify-between gap-4 py-1.5 text-sm">
            <span className="text-ink/75">
                {label}
                {detail && (
                    <span className="ml-1 text-xs text-ink/65">
                        {detail}
                    </span>
                )}
            </span>
            <span className="font-medium text-ink tabular-nums">
                {formatCurrency(amount)}
            </span>
        </div>
    );
}

/**
 * The school's tuition fee contract and withdrawal procedure, from the paper
 * enrollment form. The parent agrees to it here instead of signing it.
 */
function TuitionAgreement({
    accepted,
    onChange,
    error,
}: {
    accepted: boolean;
    onChange: (accepted: boolean) => void;
    error?: string;
}) {
    const parentName = usePage().props.auth?.enrollee?.name;

    return (
        <section
            aria-labelledby="tuition-agreement-heading"
            className={`mb-4 rounded-xl border bg-surface px-4 py-3 ${error ? 'border-danger' : 'border-ink/10'}`}
        >
            <h3
                id="tuition-agreement-heading"
                className="mb-2 text-sm font-semibold text-ink"
            >
                Tuition Fee Contract and Withdrawal Procedure
            </h3>
            <div className="space-y-2 text-sm leading-relaxed text-ink/80">
                <p>
                    This is to signify that I,{' '}
                    {parentName ? (
                        <span className="font-semibold text-ink">
                            {parentName}
                        </span>
                    ) : (
                        'the parent/guardian'
                    )}
                    , fully understand the tuition term of EVIMS. Furthermore, I
                    attest that I fully comprehend that the registration and
                    miscellaneous fees are non-refundable if I did not continue
                    with my child's enrollment on this school.
                </p>
                <p>
                    I also understand that I am subject to withdrawal rules and
                    procedures of the school upon indicating my intention to
                    enroll. In this regard, I acknowledge that:
                </p>
                <ul className="list-disc space-y-1 pl-5">
                    <li>
                        Withdrawing within the <strong>first two weeks</strong>{' '}
                        of classes is charged <strong>10%</strong> of the total
                        annual fee.
                    </li>
                    <li>
                        Withdrawing on the <strong>third week</strong> of
                        classes is charged <strong>30%</strong> of the total
                        annual fee.
                    </li>
                    <li>
                        Withdrawing on the <strong>fourth week</strong> of
                        classes and onwards means I am responsible to pay the{' '}
                        <strong>total annual fee</strong>.
                    </li>
                </ul>
            </div>

            <label className="mt-3 flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-ink/10 bg-cream p-3 focus-within:ring-2 focus-within:ring-brand/30">
                <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
                    checked={accepted}
                    onChange={(e) => onChange(e.target.checked)}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={
                        error ? 'tuition_terms_accepted-error' : undefined
                    }
                />
                <span className="text-sm font-medium text-ink">
                    I have read, understood and accepted the abovementioned
                    terms and conditions.{' '}
                    <span className="text-danger-ink" aria-hidden="true">
                        *
                    </span>
                </span>
            </label>
            {error && (
                <p
                    id="tuition_terms_accepted-error"
                    className="mt-1 text-sm text-danger-ink"
                >
                    {error}
                </p>
            )}
        </section>
    );
}

export default function BillingStep({ data, gradeLevels, setData, errors }) {
    const selectedGrade = gradeLevels.find(
        (g) => String(g.id) === String(data.grade_level_id),
    );

    if (!selectedGrade) {
        return (
            <div>
                <h2 className="mb-4 font-serif text-xl font-semibold text-ink">
                    Billing / Tuition Contract
                </h2>
                <StepGuide className="">
                    Select a grade level first to see the school fees.
                </StepGuide>
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
            <h2 className="mb-4 font-serif text-xl font-semibold text-ink">
                Billing / Tuition Contract
            </h2>

            <TuitionAgreement
                accepted={data.tuition_terms_accepted}
                onChange={(accepted) =>
                    setData('tuition_terms_accepted', accepted)
                }
                error={errors.tuition_terms_accepted}
            />

            <div className="mb-4 rounded-xl border border-ink/10 bg-surface px-4 py-3">
                <p className="mb-2 text-sm font-semibold text-ink">
                    School Fees — {selectedGrade.name}
                </p>

                <div className="divide-y divide-ink/10">
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

                <div className="mt-2 flex items-baseline justify-between border-t-2 border-ink/10 pt-2">
                    <span className="text-sm font-semibold text-ink">
                        Total Amount to Pay
                    </span>
                    <span className="text-xl font-bold text-brand-ink tabular-nums">
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
                <div className="mb-4 rounded-xl border border-brand/25 bg-brand/5 px-4 py-3 text-sm text-ink/80">
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
                    <p className="mt-1 text-xs text-ink/70">
                        {PAYMENT_OPTIONS[data.payment_option]?.label} plan ·
                        Total of {formatCurrency(total)}. Once approved, you
                        choose to pay in cash at the school cashier or via GCash
                        from your portal dashboard.
                    </p>
                </div>
            )}
        </div>
    );
}
