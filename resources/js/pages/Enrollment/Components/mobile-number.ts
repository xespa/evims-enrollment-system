// Philippine mobile numbers, kept in the local 11-digit form: 09XXXXXXXXX.
// Must match StoreEnrollmentRequest::normalizeMobileNumber() on the server.

export const MOBILE_NUMBER_LENGTH = 11;

/**
 * Digits only, in local form: "+63 917 123 4567" and "917-123-4567" both
 * become "09171234567". Capped at 11 digits.
 */
export function normalizeMobileNumber(input: unknown): string {
    let digits = String(input ?? '').replace(/\D/g, '');

    if (digits.startsWith('63') && digits.length > 10) {
        digits = `0${digits.slice(2)}`;
    } else if (digits.startsWith('9')) {
        digits = `0${digits}`;
    }

    return digits.slice(0, MOBILE_NUMBER_LENGTH);
}

export function isValidMobileNumber(value: unknown): boolean {
    return /^09\d{9}$/.test(normalizeMobileNumber(value));
}

// The input shows a fixed "+63" and only the 10 digits after it.
export const NATIONAL_NUMBER_LENGTH = 10;

/**
 * The digits typed after "+63": "0917…", "+63 917…" and "917…" all become
 * "917…". Capped at 10 digits.
 */
export function toNationalNumber(input: unknown): string {
    let digits = String(input ?? '').replace(/\D/g, '');

    if (digits.startsWith('63') && digits.length > NATIONAL_NUMBER_LENGTH) {
        digits = digits.slice(2);
    } else if (digits.startsWith('0')) {
        digits = digits.slice(1);
    }

    return digits.slice(0, NATIONAL_NUMBER_LENGTH);
}

/** "9171234567" → "917 123 4567" (partial numbers are grouped as far as they go). */
export function formatNationalNumber(national: string): string {
    return [national.slice(0, 3), national.slice(3, 6), national.slice(6, 10)]
        .filter(Boolean)
        .join(' ');
}

/** "09171234567" → "0917 123 4567" (partial numbers are grouped as far as they go). */
export function formatMobileNumber(value: unknown): string {
    const digits = normalizeMobileNumber(value);

    return [digits.slice(0, 4), digits.slice(4, 7), digits.slice(7, 11)]
        .filter(Boolean)
        .join(' ');
}
