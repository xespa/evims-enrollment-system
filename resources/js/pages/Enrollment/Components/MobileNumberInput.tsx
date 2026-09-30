import { useState } from 'react';
import {
    NATIONAL_NUMBER_LENGTH,
    formatNationalNumber,
    toNationalNumber,
} from './mobile-number';

type Props = {
    label: string;
    name: string;
    value: string | null | undefined;
    onChange: (name: string, value: string) => void;
    error?: string;
    required?: boolean;
};

/**
 * A Philippine mobile number: a fixed "+63" followed by the 10 digits of
 * the number, shown as "917 123 4567". Only digits get in (typed or
 * pasted), phones open the numeric keypad, and the value is stored in the
 * local 11-digit form ("09171234567") the server expects.
 */
export default function MobileNumberInput({
    label,
    name,
    value,
    onChange,
    error,
    required = false,
}: Props) {
    // Only complain about an unfinished number once the field is left, not
    // while it's still being typed.
    const [touched, setTouched] = useState(false);

    const national = toNationalNumber(value);
    const isIncomplete = national.length > 0 && !/^9\d{9}$/.test(national);
    const shownError =
        error ??
        (touched && isIncomplete
            ? `Enter the ${NATIONAL_NUMBER_LENGTH} digits after +63, starting with 9.`
            : undefined);

    const hintId = `${name}-hint`;
    const errorId = `${name}-error`;

    const handleChange = (typed: string) => {
        const digits = toNationalNumber(typed);
        onChange(name, digits ? `0${digits}` : '');
    };

    return (
        <div className="mb-4">
            <label
                htmlFor={name}
                className="mb-1.5 block text-sm font-medium text-[#1F2A24]/80"
            >
                {label}{' '}
                {required && (
                    <span className="text-[#C6473B]" aria-hidden="true">
                        *
                    </span>
                )}
            </label>

            <div
                className={`flex min-h-10 overflow-hidden rounded-lg border bg-white shadow-sm transition-colors focus-within:border-[#2F6F4E] focus-within:ring-2 focus-within:ring-[#2F6F4E]/30 ${
                    shownError
                        ? 'border-[#C6473B] bg-[#C6473B]/[0.03]'
                        : 'border-[#1F2A24]/15'
                }`}
            >
                <span
                    className="flex shrink-0 items-center border-r border-[#1F2A24]/15 bg-[#1F2A24]/[0.04] px-3 text-sm font-medium text-[#1F2A24]/70 tabular-nums select-none"
                    aria-hidden="true"
                >
                    +63
                </span>
                <input
                    id={name}
                    name={name}
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    placeholder="917 123 4567"
                    // 10 digits plus the two grouping spaces.
                    maxLength={NATIONAL_NUMBER_LENGTH + 2}
                    value={formatNationalNumber(national)}
                    onChange={(e) => handleChange(e.target.value)}
                    onBlur={() => setTouched(true)}
                    aria-required={required || undefined}
                    aria-invalid={shownError ? true : undefined}
                    aria-describedby={shownError ? errorId : hintId}
                    // Screen readers hear the country code the sighted
                    // prefix shows.
                    aria-label={`${label}, after country code plus 63`}
                    className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm tracking-wide text-[#1F2A24] tabular-nums placeholder-[#1F2A24]/40 focus:outline-none"
                />
            </div>

            {shownError ? (
                <p id={errorId} className="mt-1 text-sm text-[#C6473B]">
                    {shownError}
                </p>
            ) : (
                <p id={hintId} className="mt-1 text-xs text-[#1F2A24]/55">
                    The school may contact you at this number about the
                    application.
                </p>
            )}
        </div>
    );
}
