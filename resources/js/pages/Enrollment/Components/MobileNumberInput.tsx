import { useRef, useState } from 'react';
import { CircleCheck, X } from 'lucide-react';
import CountryCodePicker from './CountryCodePicker';
import { findCountry } from './country-calling-codes';
import type { CallingCountry } from './country-calling-codes';
import {
    formatNationalNumber,
    isValidMobileNumber,
    maxNationalLength,
    mobileNumberProblem,
    normalizeMobileNumber,
    parseMobileNumber,
    toMobileNumber,
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
 * A mobile number: a searchable country calling code (the Philippines by
 * default) followed by the rest of the number, shown grouped as
 * "917 123 4567". Only digits get in (typed or pasted), phones open the
 * numeric keypad, a check appears once the number is complete, and the
 * value is stored in international form ("+639171234567").
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
    const inputRef = useRef<HTMLInputElement>(null);
    // Kept separately from the value, which is empty (and so has no country
    // code) until a digit is typed.
    const [countryIso, setCountryIso] = useState(
        () => parseMobileNumber(value).country.iso,
    );
    const country = findCountry(countryIso);

    const normalized = normalizeMobileNumber(value);
    const national = normalized.startsWith(`+${country.code}`)
        ? normalized.slice(country.code.length + 1)
        : parseMobileNumber(value, countryIso).national;

    const isComplete = national.length > 0 && isValidMobileNumber(value);
    const isIncomplete = national.length > 0 && !isComplete;
    const shownError =
        error ??
        (touched && isIncomplete ? mobileNumberProblem(value) : undefined);

    const hintId = `${name}-hint`;
    const errorId = `${name}-error`;

    const handleNumberChange = (typed: string) => {
        // A whole international number pasted in picks its own country.
        if (typed.trim().startsWith('+')) {
            const parsed = parseMobileNumber(typed, countryIso);
            setCountryIso(parsed.country.iso);
            onChange(
                name,
                toMobileNumber(
                    parsed.country,
                    parsed.national.slice(0, maxNationalLength(parsed.country)),
                ),
            );
            return;
        }

        onChange(
            name,
            toMobileNumber(country, toNationalNumber(typed, country)),
        );
    };

    const handleCountryChange = (next: CallingCountry) => {
        setCountryIso(next.iso);
        onChange(
            name,
            toMobileNumber(next, national.slice(0, maxNationalLength(next))),
        );
        inputRef.current?.focus();
    };

    const clear = () => {
        onChange(name, '');
        setTouched(false);
        inputRef.current?.focus();
    };

    const isPhilippines = country.iso === 'PH';
    const hint = isPhilippines
        ? 'Format: +63 9XX XXX XXXX. The school may contact you here about the application.'
        : `Enter the number after +${country.code}, without the leading 0. The school may contact you here about the application.`;

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

            {/* Positions the country list under the whole field. */}
            <div className="relative">
                <div
                    className={`flex min-h-11 rounded-lg border bg-white shadow-sm transition-[border-color,box-shadow] duration-150 focus-within:border-[#2F6F4E] focus-within:ring-2 focus-within:ring-[#2F6F4E]/30 motion-reduce:transition-none ${
                        shownError
                            ? 'border-[#C6473B] bg-[#C6473B]/[0.03]'
                            : isComplete
                              ? 'border-[#2F6F4E]/50'
                              : 'border-[#1F2A24]/15'
                    }`}
                >
                    <CountryCodePicker
                        country={country}
                        onSelect={handleCountryChange}
                        label={label}
                    />
                    <input
                        ref={inputRef}
                        id={name}
                        name={name}
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel-national"
                        placeholder={
                            isPhilippines ? '917 123 4567' : 'Phone number'
                        }
                        // No maxLength, so a pasted "+44 …" isn't cut short —
                        // the digits are capped per country instead.
                        value={formatNationalNumber(national)}
                        onChange={(e) => handleNumberChange(e.target.value)}
                        onBlur={() => setTouched(true)}
                        aria-required={required || undefined}
                        aria-invalid={shownError ? true : undefined}
                        aria-describedby={shownError ? errorId : hintId}
                        // Screen readers hear the country code the sighted
                        // prefix shows.
                        aria-label={`${label}, after country code plus ${country.code}`}
                        className="min-w-0 flex-1 bg-transparent px-3 py-2 text-base tracking-wide text-[#1F2A24] tabular-nums placeholder-[#1F2A24]/40 focus:outline-none sm:text-sm"
                    />
                    {isComplete && !shownError && (
                        <span className="flex items-center pr-1 text-[#2F6F4E]">
                            <CircleCheck
                                className="h-4 w-4"
                                aria-hidden="true"
                            />
                            <span className="sr-only">Number is complete</span>
                        </span>
                    )}
                    {national.length > 0 && (
                        <button
                            type="button"
                            onClick={clear}
                            aria-label={`Clear ${label.toLowerCase()}`}
                            className="flex min-w-11 cursor-pointer items-center justify-center rounded-r-lg text-[#1F2A24]/45 transition-colors hover:text-[#1F2A24] focus-visible:text-[#1F2A24] focus-visible:outline-none"
                        >
                            <X className="h-4 w-4" aria-hidden="true" />
                        </button>
                    )}
                </div>
            </div>

            {shownError ? (
                <p
                    id={errorId}
                    role="alert"
                    className="mt-1 text-sm text-[#C6473B]"
                >
                    {shownError}
                </p>
            ) : (
                <p id={hintId} className="mt-1 text-xs text-[#1F2A24]/60">
                    {hint}
                </p>
            )}
        </div>
    );
}
