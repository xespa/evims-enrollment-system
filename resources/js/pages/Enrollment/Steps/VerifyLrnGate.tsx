import { useState } from 'react';

function readCookie(name) {
    const match = document.cookie.match(
        new RegExp(`(?:^|; )${name}=([^;]*)`),
    );
    return match ? decodeURIComponent(match[1]) : '';
}

export default function VerifyLrnGate({
    defaultLrn,
    onMatched,
    onNewChild,
}) {
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
                onMatched(result.student, result.previousSchoolYear);
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
        <div className="rounded-[2rem] border border-[#1F2A24]/10 bg-white p-6 shadow-xl shadow-[#1F2A24]/5 sm:p-8">
            <h2 className="font-serif text-xl font-semibold text-[#1F2A24]">
                Welcome back!
            </h2>
            <p className="mt-1 text-sm text-[#1F2A24]/70">
                If this application is for a child already on file with us,
                enter their LRN to skip straight to subjects and billing —
                their information is already on record.
            </p>

            <form onSubmit={submit} className="mt-5">
                <label
                    htmlFor="verify-lrn"
                    className="mb-1.5 block text-sm font-medium text-[#1F2A24]/80"
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
                    placeholder="14-digit LRN"
                    className="min-h-11 w-full rounded-lg border border-[#1F2A24]/15 bg-white px-3 py-2 text-sm tracking-wider text-[#1F2A24] focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/30 focus:outline-none"
                />

                <p id="verify-lrn-hint" className="mt-1.5 text-xs text-[#1F2A24]/65">
                    {lrn.length}/14 digits
                </p>

                {notFound && (
                    <p role="alert" className="mt-2 text-sm text-[#C6473B]">
                        We couldn't find a record with this LRN under your
                        account. Double-check the number, or continue below if
                        this is a new child.
                    </p>
                )}
                {error && (
                    <p role="alert" className="mt-2 text-sm text-[#C6473B]">
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={checking || lrn.length !== 14}
                    className="mt-4 min-h-11 w-full rounded-full bg-[#2F6F4E] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#25573E] disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {checking ? 'Checking...' : 'Confirm LRN'}
                </button>
            </form>

            <button
                type="button"
                onClick={onNewChild}
                className="mt-3 min-h-11 w-full rounded-full text-center text-sm font-medium text-[#1F2A24]/70 hover:text-[#1F2A24] hover:underline"
            >
                This is a new child — fill in their details from scratch
            </button>
        </div>
    );
}
