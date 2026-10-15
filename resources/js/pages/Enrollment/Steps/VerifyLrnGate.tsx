import { useState } from 'react';
import { isValidLrn } from '../Components/LrnInput';

function readCookie(name) {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : '';
}

export default function VerifyLrnGate({ defaultLrn, onMatched, onNewChild }) {
    const [lrn, setLrn] = useState(defaultLrn ?? '');
    const [checking, setChecking] = useState(false);
    const [notFound, setNotFound] = useState(false);
    const [error, setError] = useState('');

    const submit = async (e) => {
        e.preventDefault();
        setChecking(true);
        setNotFound(false);
        setError('');

        try {
            const response = await fetch(route('admission.verify-lrn'), {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': readCookie('XSRF-TOKEN'),
                },
                body: JSON.stringify({ lrn }),
            });

            if (!response.ok) {
                setError(
                    'Something went wrong checking that LRN. Please try again.',
                );
                return;
            }

            const result = await response.json();

            if (result.matched) {
                onMatched(
                    result.student,
                    result.previousSchoolYear,
                    result.documentsOnFile,
                );
            } else {
                setNotFound(true);
            }
        } catch {
            setError(
                'Something went wrong checking that LRN. Please try again.',
            );
        } finally {
            setChecking(false);
        }
    };

    return (
        <div className="rounded-[2rem] border border-ink/10 bg-surface p-6 shadow-xl shadow-shade/5 sm:p-8">
            <h2 className="font-serif text-xl font-semibold text-ink">
                Welcome back!
            </h2>
            <p className="mt-1 text-sm text-ink/70">
                If this application is for a child already on file with us,
                enter their LRN to skip straight to subjects and billing — their
                information is already on record.
            </p>

            <form onSubmit={submit} className="mt-5">
                <label
                    htmlFor="verify-lrn"
                    className="mb-1.5 block text-sm font-medium text-ink/80"
                >
                    Learner Reference Number (LRN)
                </label>
                <input
                    id="verify-lrn"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    aria-describedby="verify-lrn-hint"
                    aria-invalid={notFound || error ? true : undefined}
                    maxLength={14}
                    value={lrn}
                    onChange={(e) => {
                        setLrn(e.target.value.replace(/\D/g, '').slice(0, 14));
                        setNotFound(false);
                    }}
                    placeholder="e.g. 45250112345678"
                    className="min-h-11 w-full rounded-lg border border-ink/15 bg-surface px-3 py-2 text-sm tracking-wider text-ink tabular-nums focus:border-brand focus:ring-2 focus:ring-brand/30 focus:outline-none"
                />

                <p
                    id="verify-lrn-hint"
                    className="mt-1.5 text-xs text-ink/65"
                >
                    {isValidLrn(lrn)
                        ? `${lrn.length} digits ✓`
                        : `${lrn.length} digits — use the 12-digit DepEd LRN (or 14 if EVIMS issued it).`}
                </p>

                {notFound && (
                    <p role="alert" className="mt-2 text-sm text-danger-ink">
                        We couldn't find a record with this LRN under your
                        account. Double-check the number, or continue below if
                        this is a new child.
                    </p>
                )}
                {error && (
                    <p role="alert" className="mt-2 text-sm text-danger-ink">
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={checking || !isValidLrn(lrn)}
                    className="mt-4 min-h-11 w-full rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {checking ? 'Checking...' : 'Confirm LRN'}
                </button>
            </form>

            <button
                type="button"
                onClick={onNewChild}
                className="mt-3 min-h-11 w-full rounded-full text-center text-sm font-medium text-ink/70 hover:text-ink hover:underline"
            >
                This is a new child — fill in their details from scratch
            </button>
        </div>
    );
}
