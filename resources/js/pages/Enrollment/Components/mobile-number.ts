// Mobile numbers, kept in international form: "+" then the country code and
// the number, e.g. "+639171234567". Philippine numbers must be a real PH
// mobile (+63 9XX XXX XXXX); other countries only need a plausible length.
// Must match StoreEnrollmentRequest::normalizeMobileNumber() and its rules
// on the server.

import {
    CALLING_COUNTRIES,
    DEFAULT_COUNTRY_ISO,
    findCountry,
} from './country-calling-codes';
import type { CallingCountry } from './country-calling-codes';

// E.164 caps a whole number (country code included) at 15 digits.
const MAX_DIGITS = 15;

const PHILIPPINE_NATIONAL_LENGTH = 10;

// When several countries share a calling code, a saved number is shown
// under the biggest one.
const PREFERRED_ISO_BY_CODE: Record<string, string> = { '1': 'US', '7': 'RU' };

/**
 * Digits only, in international form: "0917 123 4567", "+63 917 123 4567"
 * and "917-123-4567" all become "+639171234567", and "+1 415 555 2671"
 * becomes "+14155552671". Anything else is returned as bare digits, which
 * then fails validation.
 */
export function normalizeMobileNumber(input: unknown): string {
    const text = String(input ?? '').trim();
    const digits = text.replace(/\D/g, '');

    if (digits === '') {
        return '';
    }
    if (text.startsWith('+')) {
        return `+${digits}`;
    }
    if (digits.startsWith('00')) {
        return `+${digits.slice(2)}`;
    }
    if (digits.startsWith('63') && digits.length > PHILIPPINE_NATIONAL_LENGTH) {
        return `+${digits}`;
    }
    if (digits.startsWith('09')) {
        return `+63${digits.slice(1)}`;
    }
    if (digits.startsWith('9')) {
        return `+63${digits}`;
    }

    return digits;
}

export function isValidMobileNumber(value: unknown): boolean {
    return /^\+(?:639\d{9}|(?!63)[1-9]\d{6,14})$/.test(
        normalizeMobileNumber(value),
    );
}

/**
 * Splits a saved number into its country and the digits after the country
 * code, e.g. "+639171234567" → Philippines + "9171234567". The longest
 * matching code wins; `preferredIso` breaks ties between countries that
 * share one (e.g. the US and Canada).
 */
export function parseMobileNumber(
    value: unknown,
    preferredIso?: string,
): { country: CallingCountry; national: string } {
    const normalized = normalizeMobileNumber(value);

    if (!normalized.startsWith('+')) {
        return {
            country: findCountry(preferredIso ?? DEFAULT_COUNTRY_ISO),
            national: normalized,
        };
    }

    const digits = normalized.slice(1);
    const matches = CALLING_COUNTRIES.filter((country) =>
        digits.startsWith(country.code),
    );
    const longest = Math.max(0, ...matches.map((c) => c.code.length));
    const candidates = matches.filter((c) => c.code.length === longest);

    const country =
        candidates.find((c) => c.iso === preferredIso) ??
        candidates.find((c) => c.iso === PREFERRED_ISO_BY_CODE[c.code]) ??
        candidates[0];

    if (!country) {
        return { country: findCountry(DEFAULT_COUNTRY_ISO), national: digits };
    }

    return { country, national: digits.slice(country.code.length) };
}

/** Joins a country and the digits after its code; empty when there's no number. */
export function toMobileNumber(
    country: CallingCountry,
    national: string,
): string {
    return national ? `+${country.code}${national}` : '';
}

/** How many digits may follow the country's code. */
export function maxNationalLength(country: CallingCountry): number {
    return country.iso === 'PH'
        ? PHILIPPINE_NATIONAL_LENGTH
        : MAX_DIGITS - country.code.length;
}

/**
 * The digits typed after the country code: a leading trunk "0" (as in
 * "0917…" or "07911…") is dropped, and so is "63" pasted in front of a
 * Philippine number. Capped at the country's maximum length.
 */
export function toNationalNumber(
    input: unknown,
    country: CallingCountry,
): string {
    let digits = String(input ?? '').replace(/\D/g, '');

    if (
        country.iso === 'PH' &&
        digits.startsWith('63') &&
        digits.length > PHILIPPINE_NATIONAL_LENGTH
    ) {
        digits = digits.slice(2);
    }
    if (digits.startsWith('0')) {
        digits = digits.slice(1);
    }

    return digits.slice(0, maxNationalLength(country));
}

/**
 * Groups digits in threes, keeping the last four together: "9171234567" →
 * "917 123 4567", "4155552671" → "415 555 2671".
 */
export function formatNationalNumber(national: string): string {
    const groups: string[] = [];
    let rest = national;

    while (rest.length > 4) {
        groups.push(rest.slice(0, 3));
        rest = rest.slice(3);
    }
    if (rest) {
        groups.push(rest);
    }

    return groups.join(' ');
}

/** "+639171234567" → "+63 917 123 4567". */
export function formatMobileNumber(value: unknown): string {
    const { country, national } = parseMobileNumber(value);

    return `+${country.code} ${formatNationalNumber(national)}`.trim();
}

/** What's wrong with an unfinished number, phrased for its country. */
export function mobileNumberProblem(value: unknown): string {
    const { country } = parseMobileNumber(value);

    return country.iso === 'PH'
        ? 'Enter the 10 digits after +63, starting with 9.'
        : `Enter the full number after +${country.code}.`;
}
