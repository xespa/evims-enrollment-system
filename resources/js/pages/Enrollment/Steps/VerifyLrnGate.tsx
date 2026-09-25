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
            const response = await fetch(route('enrollment.verifyLrn'), {
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
            <h2 className="text-lg font-semibold text-gray-900">
                Welcome back!
            </h2>
            <p className="mt-1 text-sm text-gray-500">
                If this application is for a child already on file with us,
                enter their LRN to skip straight to subjects and billing —
                their information is already on record.
            </p>

            <form onSubmit={submit} className="mt-5">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Learner Reference Number (LRN)
                </label>
                <input
                    type="text"
                    inputMode="numeric"
                    maxLength={14}
                    value={lrn}
                    onChange={(e) => {
                        setLrn(e.target.value.replace(/\D/g, '').slice(0, 14));
                        setNotFound(false);
                    }}
                    placeholder="14-digit LRN"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
                />

                {notFound && (
                    <p className="mt-2 text-sm text-red-600">
                        We couldn't find a record with this LRN under your
                        account. Double-check the number, or continue below if
                        this is a new child.
                    </p>
                )}
                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

                <button
                    type="submit"
                    disabled={checking || lrn.length !== 14}
                    className="mt-4 w-full rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {checking ? 'Checking...' : 'Confirm LRN'}
                </button>
            </form>

            <button
                type="button"
                onClick={onNewChild}
                className="mt-3 w-full text-center text-sm font-medium text-gray-500 hover:text-gray-700 hover:underline"
            >
                This is a new child — fill in their details from scratch
            </button>
        </div>
    );
}
