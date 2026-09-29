// Must match GradeLevel::BILLABLE_MONTHS and
// BillingContract::generateInstallments() on the server.
export const BILLABLE_MONTHS = 10;
const MIN_INSTALLMENT_AMOUNT = 100;

export const PAYMENT_OPTIONS = {
    FULL_PAYMENT: { label: 'Full Payment', count: 1 },
    BI_MONTHLY: { label: 'Bi-Monthly', count: 5 },
    MONTHLY: { label: 'Monthly', count: 10 },
};

export function formatCurrency(value) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
    }).format(Number(value) || 0);
}

/**
 * Splits the total the same way the server does: equal installments
 * rounded to the centavo, with the last one absorbing the remainder.
 */
export function computeInstallments(total, paymentOption) {
    const totalCents = Math.round(Number(total) * 100);
    let count = PAYMENT_OPTIONS[paymentOption]?.count ?? 1;
    let perCents = Math.round(totalCents / count);

    if (perCents < MIN_INSTALLMENT_AMOUNT * 100) {
        count = Math.max(
            1,
            Math.floor(totalCents / (MIN_INSTALLMENT_AMOUNT * 100)),
        );
        perCents = Math.round(totalCents / count);
    }

    return {
        count,
        regular: perCents / 100,
        last: (totalCents - perCents * (count - 1)) / 100,
    };
}
